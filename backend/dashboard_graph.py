import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS 
from . import database
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
 

def get_dashboard_graph():
    query = """
    SELECT 
        SUM(total_usage_cost) AS daily_net_cost, 
        usage_date 
    FROM gold_standard_usage 
    WHERE usage_month == '2024-09' 
    GROUP BY usage_date
    """

    query2 ="""
    SELECT service_name, 
        SUM(total_usage_cost) AS total_cost
    FROM gold_standard_usage
    GROUP BY service_name
    ORDER BY total_cost DESC
    LIMIT 7
"""

   
    try:
        df = pd.read_sql_query(query, database.get_db())
        daily_net = df['daily_net_cost'].tolist()
        usage_date = df['usage_date'].tolist()

        df2 = pd.read_sql_query(query2, database.get_db())
        service_name = df2['service_name'].tolist()
        total_cost = df2['total_cost'].tolist()
    
        response = {'daily_net_cost': daily_net, 'usage_date': usage_date, 'service_name': service_name, 'total_cost': total_cost }

        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
