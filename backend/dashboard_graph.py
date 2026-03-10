import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS 
import database
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
 

def get_dashboard_graph():
    query = """
    SELECT 
        SUM(net_cost) AS daily_net_cost, 
        usage_date 
    FROM gold_standard_usage 
    WHERE usage_month == '2024-09' 
    GROUP BY usage_date
    """


    
   
    try:
        df = pd.read_sql_query(query, database.get_db())
        daily_net = df['daily_net_cost'].tolist()
        usage_date = df['usage_date'].tolist()
    
        response = {'daily_net_cost': daily_net, 'usage_date': usage_date}
        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
