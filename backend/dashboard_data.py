import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS 
from . import database
import os
 

def get_dashboard_data():
    query_var = """
    SELECT usage_week, SUM(billed_cost) as weekly_total
    FROM gold_standard_usage
    GROUP BY usage_week
    ORDER BY usage_week DESC
    LIMIT 2
    """

    query_topservice = """
    SELECT service_name, SUM(billed_cost) as total_spend
    FROM gold_standard_usage

    WHERE usage_month = (
            SELECT MAX(usage_month) 
            FROM gold_standard_usage)
            
    GROUP BY service_name
    ORDER BY total_spend DESC
    LIMIT 1"""
    df = pd.read_sql_query(query_var, database.get_db())
    df2 = pd.read_sql_query(query_topservice, database.get_db())
    #cols_to_use = ['BillingPeriodStart', 'EffectiveCost', 'ListCost']
    #file_name = 'focus_data_table.csv' 
    #df = pd.read_csv(file_name, usecols= cols_to_use)

    #due to static data not placed within function

    #don't have enough data right now but could compute monthly variance by current month -previous month/previous month
    #sept_cost = df[df['BillingPeriodStart'] == '2024-09-01 00:00:00']['EffectiveCost'].sum()
    #oct_cost = df[df['BillingPeriodStart'] == '2024-10-01 00:00:00']['EffectiveCost'].sum()

    try:
        if len(df) == 2:
            this_week = df.iloc[0]['weekly_total']
            last_week = df.iloc[1]['weekly_total']
            
            var = (this_week - last_week) / last_week
        else:
            var = 0

        if not df2.empty:
            top_service = df2.iloc[0]['service_name']
            top_spend = df2.iloc[0]['total_spend']
        else:
            top_service = "No Data"
            top_spend = 0
        response = {'weekly_variance': var, 'top_service': top_service, 'top_spend': top_spend}

        
        print(var, top_service, top_spend)

        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
