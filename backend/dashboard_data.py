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
    LIMIT 3
    """

    query_service_categories = """
    SELECT service_category, SUM(total_cost) AS total_cost FROM (
        SELECT 
        CASE
            WHEN meter_dimension IN ('cpu','memory') THEN 'Compute'
            WHEN meter_dimension = 'storage' THEN 'Storage'
            WHEN meter_dimension IN ('network','activity') THEN 'Network'
            WHEN meter_dimension = 'control-plane' THEN 'Control Plane'
            ELSE "Other"
        END AS service_category,
        SUM(billed_cost) AS total_cost
        FROM gold_standard_usage
        GROUP BY meter_dimension)
    GROUP BY service_category
    ORDER BY total_cost DESC"""
    df = pd.read_sql_query(query_var, database.get_db())
    df2 = pd.read_sql_query(query_service_categories, database.get_db())
    #cols_to_use = ['BillingPeriodStart', 'EffectiveCost', 'ListCost']
    #file_name = 'focus_data_table.csv' 
    #df = pd.read_csv(file_name, usecols= cols_to_use)

    #due to static data not placed within function

    #don't have enough data right now but could compute monthly variance by current month -previous month/previous month
    #sept_cost = df[df['BillingPeriodStart'] == '2024-09-01 00:00:00']['EffectiveCost'].sum()
    #oct_cost = df[df['BillingPeriodStart'] == '2024-10-01 00:00:00']['EffectiveCost'].sum()

    try:
        res = {
            'week0': df.iloc[0]['weekly_total'], 
            'week1': df.iloc[1]['weekly_total'],
            'week2': df.iloc[2]['weekly_total'], 
            'service_categories': df2['service_category'].to_list(),
            'service_costs': df2['total_cost'].to_list()
        }
        return jsonify(res)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500