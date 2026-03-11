import sys, traceback #debugging
import subprocess
import pandas as pd
from .database import get_db
from . import database
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from google import genai
from pydantic import BaseModel, Field
from typing import Optional
from google.genai.types import Tool, GenerateContentConfig, UrlContext
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from dotenv import load_dotenv
 

class JsonTicket(BaseModel):
    title: str = Field(..., description="The title of the ticket")
    description: str = Field(..., description="A detailed description of the issue or request")
    action: str = Field(..., description="Suggested actions to resolve the issue or fulfill the request")
    reasoning: str = Field(..., description="The reasoning behind the suggested actions")
    priority: str = Field(..., description="The priority level of the ticket (e.g., High, Medium, Low)")

class TicketList(BaseModel):
    suggested_tickets: list[JsonTicket]


def _get_genai_client():
    load_dotenv()
    apistr = os.environ.get("GEMINI_API_KEY", "")
    if not apistr:
        return None
    return genai.Client(api_key=apistr)


def enrich_tickets_with_ai(raw_tickets):
    """Take raw ticket rows from the DB and ask AI to produce enriched JsonTickets."""
    client = _get_genai_client()
    if client is None:
        return [
            JsonTicket(
                title=t["description"][:60],
                description=t["description"],
                action="Review this ticket and take appropriate action.",
                reasoning=f"Policy-raised ticket for receiver: {t['receiver']}",
                priority="Medium",
            )
            for t in raw_tickets
        ]

    tickets_csv_lines = ["receiver,description,raised_at"]
    for t in raw_tickets:
        tickets_csv_lines.append(f"{t['receiver']},{t['description']},{t['raised_at']}")
    tickets_csv = "\n".join(tickets_csv_lines)

    prompt = f"""
    You are given a list of tickets raised by automated cost-management policies.
    Each ticket has a receiver (the person/team it is addressed to), a description
    of the condition that triggered it, and the timestamp it was raised.

    For EACH ticket produce an enriched version with these fields:
    - title: a short, human-readable title
    - description: a clear explanation of the issue for a business user
    - action: a concrete suggested action to resolve the issue
    - reasoning: why this ticket matters and the likely cause
    - priority: High, Medium, or Low

    CRITICAL FORMATTING RULES:
    1. Write for business users — no database jargon or raw column names.
    2. Keep language natural and professional.
    3. Output exactly one enriched ticket per input ticket, in the same order.

    TICKETS:
    {tickets_csv}
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_json_schema": TicketList.model_json_schema(),
        },
    )

    result = TicketList.model_validate_json(response.text)
    return result.suggested_tickets


def get_anomaly_suggestions():
    """Original anomaly-based AI suggestions (fallback when no DB tickets)."""
    client = _get_genai_client()
    if client is None:
        return []

    query = """
    SELECT 
        resource_id, service_name, service_category, region_name, 
        usage_week, usage_month, usage_date, billed_cost, total_usage_cost, usage_quantity, 
        sku_id, compute_model, business_unit, usage_unit, 
        normalized_usage, confidence
    FROM gold_standard_usage
    WHERE usage_week != '2024-12'
    """
    
    df = pd.read_sql_query(query, database.get_db())

    data = df.copy()

    data['UnitCost'] = data['billed_cost'] / data['normalized_usage'].clip(lower=1)
    data['MeanService'] = data.groupby('service_name')['billed_cost'].transform('mean')
    data['MeanCompute'] = data.groupby('compute_model')['billed_cost'].transform('mean')

    ml_features = data[['billed_cost', 'UnitCost', 'MeanCompute', 'MeanService']].fillna(0)
    model = IsolationForest(contamination=0.001, random_state=11)
    data['anomaly'] = model.fit_predict(ml_features)

    last_week_only = data['usage_week'].max()
    anomalies_only = data[(data['anomaly'] == -1) & (data['usage_week'] == last_week_only)]
    anomalies_only = anomalies_only.sort_values(by='billed_cost', ascending=False)

    cols_llm = ['resource_id', 'service_name', 'service_category', 'region_name',
        'usage_date', 'billed_cost', 'usage_quantity', 'usage_unit',
        'compute_model', 'UnitCost', 'MeanService']

    llm_dataset = anomalies_only[cols_llm].head(25)
    data_str = llm_dataset.to_csv(index=False)

    prompt = f"""
    Analyse the following dataset, which represents the top 0.1% most severe cost anomalies, and provide suggestion tickets for cost optimisation. 
    These suggestions/policies should be actions can be implemented per server (using the resource_id) or to a number of servers to optimize costs.
    The dataset contains the following columns: 
        ['resource_id', 'service_name', 'service_category', 'region_name', 
         'usage_date', 'billed_cost', 'usage_quantity', 'usage_unit', 
         'compute_model', 'UnitCost', 'MeanService']
    The dataset is in a tabular format and contains information about the resources used and their associated costs. 

    Provide insights on how to optimize costs based on this data.
    Since these are already flagged as high-cost anomalies, determine the likely cause (cost drops, cost increases, high variance, large spikes) and also infer underutilised/missing reservations.

    When generating the 'suggested_actions' for the tickets, format them as concrete, trigger-based policy rules. Here are examples of the style and specificity I expect:
    - "Scale when low usage: Create ticket to scale down instances when weekly usage falls below 20%"
    - "Notify on high cost: Notify when daily spent exceeds $200"
    - "Auto-scale up on spike: Scale up if usage > 90 percent and cost < $150"
    - "Ticket if idle: Create ticket if utilisation < 10 percent and cost per unit is high"

    These suggestion ticket policies can suggest actions such as reallocation of resources, deleting certain underutilised services, buying reservations etc.
    
    CRITICAL FORMATTING AND STYLE RULES:
    1. NO DATABASE JARGON: You are writing for business users. Translate column names into plain English.
    2. NATURAL CASING: Convert data values to lowercase so they read naturally.
    3. READABLE RESOURCES: Always pair resource IDs with the service name.

    Give your response in JSON format as a list of tickets with fields: title, description, action, reasoning and priority. All of these are compulsory fields.
    
    DATASET:
    {data_str}
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_json_schema": TicketList.model_json_schema(),
        },
    )

    result = TicketList.model_validate_json(response.text)
    return result.suggested_tickets


def get_suggestions():
    """Main entry point for GET /api/suggestions.
    
    If there are policy-raised tickets in the DB, enrich them with AI.
    Otherwise fall back to anomaly-based suggestions.
    """
    try:
        raw_tickets = database.get_tickets(limit=25)

        if raw_tickets:
            enriched = enrich_tickets_with_ai(raw_tickets)
            return jsonify({"suggested_tickets": [t.model_dump() for t in enriched]})

        anomaly_tickets = get_anomaly_suggestions()
        return jsonify({"suggested_tickets": [t.model_dump() for t in anomaly_tickets]})
    except Exception as e:
        print(f"[get_suggestions] error: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    pass