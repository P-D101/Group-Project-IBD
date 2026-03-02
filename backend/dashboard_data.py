import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS 

app = Flask(__name__)
CORS(app)
cols_to_use = ['BillingPeriodStart', 'EffectiveCost', 'ListCost']
file_name = 'focus_data_table.csv' 
df = pd.read_csv(file_name, usecols= cols_to_use)

#due to static data not placed within function

#don't have enough data right now but could compute monthly variance by current month -previous month/previous month
sept_cost = df[df['BillingPeriodStart'] == '2024-09-01 00:00:00']['EffectiveCost'].sum()
oct_cost = df[df['BillingPeriodStart'] == '2024-10-01 00:00:00']['EffectiveCost'].sum()
print('Septcost:', sept_cost, ' oct cost: ', oct_cost)
if sept_cost !=0:
    monthly_var = (oct_cost - sept_cost)/sept_cost
else:
    monthly_var = 0

#don't have historical data based on money saved due to policy changes so instead for now, displaying savings based on discounts
savings_afterdiscounts = (df['ListCost'] - df['EffectiveCost']).sum()

@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    try:
        response = {'monthly_variance': monthly_var, 'savings_discounts': savings_afterdiscounts}
        
        print(monthly_var, savings_afterdiscounts)

        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)