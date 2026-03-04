#to do: needs updating to work with db
import sys
import subprocess
import pandas as pd
from database import get_db
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from google import genai
from pydantic import BaseModel, Field

from flask import Flask, request, jsonify
from flask_cors import CORS
import database
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
 
import subprocess
import pandas as pd
from database import get_db
from google import genai
import os
from pydantic import BaseModel, Field
from typing import Optional
from google.genai.types import Tool, GenerateContentConfig, UrlContext

def get_user_query():

    #ml model using isolation forest to detect anomalies
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

    print('read csv :)')

    data = df.copy()
    print('copied csv :)')

    #experimenting with features
    data['UnitCost'] = data['billed_cost'] / data['normalized_usage'].clip(lower=1)
    #data['UnitCost'] = data['EffectiveCost'] / data['ConsumedQuantity'].clip(lower=1)
    #data['DiscountDiff'] = data['ListCost'] - data['EffectiveCost']
    data['MeanService'] = data.groupby('service_name')['billed_cost'].transform('mean')
    #data['MeanRegion'] = data.groupby('RegionName')['billed_cost'].transform('mean')
    #data['MeanSku'] = data.groupby('sku_id')['billed_cost'].transform('mean')
    #data['MeanCategory'] = data.groupby('service_category')['billed_cost'].transform('mean')
    data['MeanCompute'] = data.groupby('compute_model')['billed_cost'].transform('mean')
    #data['MeanBU'] = data.groupby('business_unit')['billed_cost'].transform('mean')
    print('calculated extra features :)')

    ml_features = data[['billed_cost', 'UnitCost', 'MeanCompute', 'MeanService']].fillna(0)
    model = IsolationForest(contamination=0.001, random_state=11)
    print('intialised isolation forest :)')
    data['anomaly'] = model.fit_predict(ml_features)
    print('got the anomalies :)')

    last_week_only = data['usage_week'].max() #only get anomalies in the last week 
    anomalies_only = data[(data['anomaly'] == -1) & (data['usage_week'] == last_week_only)]
    print('created anomalies only dataset :)')
    anomalies_only.sort_values(by = 'billed_cost', ascending=False)

    '''['billed_cost', 'UnitCost', 'MeanCategory', 'MeanCompute', 'MeanService', 'MeanBU', 'MeanSku', 'Confidence'
                'resource_id', 'service_name', 'service_category', 'region_name', 
        'usage_week', 'usage_month', 'usage_date', 'billed_cost', 'total_usage_cost', 'usage_quantity', 
        'sku_id', 'compute_model', 'business_unit', 'usage_unit', 
        'normalized_usage']'''

    cols_llm = ['resource_id', 
        'service_name',
        'service_category', 
        'region_name', 
        'usage_date', 
        'billed_cost', 
        'usage_quantity', 
        'usage_unit', 
        'compute_model', 
        'UnitCost', 
        'MeanService'] 
        #,'confidence']

    llm_dataset = anomalies_only[cols_llm].head(25) #small amt for gemini

    print('llm dataset :)')
    print(llm_dataset)
    data_str = llm_dataset.to_csv(index=False)


    class JsonTicket(BaseModel):
        title: str = Field(..., description="The title of the ticket")
        description: str = Field(..., description="A detailed description of the issue or request")
        action: str = Field(..., description="Suggested actions to resolve the issue or fulfill the request")
        reasoning: str = Field(..., description="The reasoning behind the suggested actions")
        priority: str = Field(..., description="The priority level of the ticket (e.g., High, Medium, Low)")

    class TicketList(BaseModel):
        suggested_tickets: list[JsonTicket]
    
    apistr = "" #add api key here for testing
    client = genai.Client(api_key=apistr)
    
    prompt = """
    Analyse the following dataset, which represents the top 0.1% most severe cost anomalies, and provide suggestion tickets for cost optimisation. 
    These suggestions/policies should be actions can be implemented per server (using the resource_id) or to a number of servers to optimize costs.
    The dataset contains the following columns: 
        ['resource_id', 
        'service_name',
        'service_category', 
        'region_name', 
        'usage_date', 
        'billed_cost', 
        'usage_quantity', 
        'usage_unit', 
        'compute_model', 
        'UnitCost', 
        'MeanService']
    The dataset is in a tabular format and contains information about the resources used and their associated costs. 

    Provide insights on how to optimize costs based on this data.
    Since these are already flagged as high-cost anomalies, determine the likely cause (cost drops, cost increases, high variance, large spikes) and also infer underutilised/missing reservations
    

    When generating the 'suggested_actions' for the tickets, format them as concrete, trigger-based policy rules. Here are examples of the style and specificity I expect:
    - "Scale when low usage: Create ticket to scale down instances when weekly usage falls below 20%"
    - "Notify on high cost: Notify when daily spent exceeds $200"
    - "Auto-scale up on spike: Scale up if usage > 90 percent and cost < $150"
    - "Ticket if idle: Create ticket if utilisation < 10 percent and cost per unit is high"
    - "Log low usage event: Log event if usage < 10%"


    These suggestion ticket policies can sugest actions such as reallocation of resources, deleting certain underutilised services, buying reservations etc.
    
    CRITICAL INSTRUCTION - NO DATABASE JARGON:
    You are writing for business users and FinOps managers. You are STRICTLY FORBIDDEN from using raw database column names or underscores in your JSON output. 
    - DO NOT use: "billed_cost". Instead use "Cost".
    - DO NOT use: "MeanService". Instead use "Average per service".
    - DO NOT use: "usage_quantity" or "usage_unit". Instead use "Utilization" or "Usage Levels".
    - DO NOT use: "UnitCost". Instead use "Cost per Unit".
    - DO NOT use raw IDs like "res_722" alone. ALWAYS pair it with the service name (e.g., "the AWS Lambda function (ID: res_722)").

    Give your response in JSON format as a list of tickets with fields: title, description, suggested_actions, reasoning and priority. All of these are compulsory fields.
    
    DATASET:
    {data_str}
    """ 

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_json_schema": TicketList.model_json_schema(),
        },
    )

    result = TicketList.model_validate_json(response.text)

    print(result)#for debugging #Gemini suggestions which can be displayed on main page


    try:
        return jsonify(result.model_dump())
    except Exception as e:
        return jsonify({"error": str(e)}), 500
