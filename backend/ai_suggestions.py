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

import subprocess
import pandas as pd
from database import get_db
from google import genai
import os
from pydantic import BaseModel, Field
from typing import Optional
from google.genai.types import Tool, GenerateContentConfig, UrlContext

app = Flask(__name__)
CORS(app)

#ml model using isolation forest to detect anomalies
file_name = 'focus_data_table.csv' 
key_cols = ['ResourceId', 'ServiceName', 'RegionName', 'ChargePeriodStart', 
            'EffectiveCost', 'ListCost', 'ConsumedQuantity', 'SkuId']
df = pd.read_csv(file_name, usecols= key_cols)
print('read csv :)')

data = df[key_cols].copy()
print('copied csv :)')

data['UnitCost'] = data['EffectiveCost'] / data['ConsumedQuantity'].clip(lower=1)
data['DiscountDiff'] = data['ListCost'] - data['EffectiveCost']
data['MeanService'] = data.groupby('ServiceName')['EffectiveCost'].transform('mean')
data['MeanRegion'] = data.groupby('RegionName')['EffectiveCost'].transform('mean')
data['MeanSku'] = data.groupby('SkuId')['EffectiveCost'].transform('mean')
print('calculated extra features :)')

ml_features = data[['EffectiveCost', 'UnitCost', 'DiscountDiff', 'MeanService', 'MeanRegion', 'MeanSku']].fillna(0)
model = IsolationForest(contamination=0.001, random_state=1)
print('intialised isolation forest :)')
data['anomaly'] = model.fit_predict(ml_features)
print('got the anomalies :)')

anomalies_only = data[data['anomaly'] == -1]
print('created anomalies only dataset :)')

cols_llm = ['ResourceId', 'ServiceName', 'RegionName', 'ChargePeriodStart', 'EffectiveCost', 'ConsumedQuantity']
llm_dataset = anomalies_only[cols_llm].head(25) #small amt for gemini

print('llm dataset :)')
print(llm_dataset)
data_str = llm_dataset.to_csv(index=False)

'''
dataset = get_db().execute("SELECT * FROM hundred_k")
key_cols = ['ResourceId', 'ResourceName', 'ResourceType', 'ServiceName', 'RegionName', 'EffectiveCost', 'ListUnitPrice', 'ConsumedQuantity', 'ConsumedUnit', 'ChargePeriodStart', 'CommitmentDiscountStatus', 'CommitmentDiscountId']
features = pd.dataset[key_cols]
features = features.replace(-100, np.nan).dropna()

##might needs to one-hot encode the categorical features??

n_estimators = 100 #total num of trees
contamination = 0.01  #expected anomalies
sample_size = 256  #samples to train for each tree
forest_model = IsolationForest(n_estimators=n_estimators, contamination=contamination, max_samples=sample_size, random_state=42)
forest_model.fit(features)
data = features.copy() #make a copy of data to add anomaly info too
data['anomaly_score'] = forest_model.decision_function(features) #checks how anomalous a point is
data['anomaly'] = forest_model.predict(features) #classify as anomlay or not
'''


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
These suggestions should be actionable and/or formulae that can be implemented per server (using the ResourceId) or to a number of servers to optimize costs.
The dataset contains the following columns: 'ResourceId', 'ServiceName', 'RegionName', 'ChargePeriodStart', 'EffectiveCost', 'ConsumedQuantity'
The dataset is in a tabular format and contains information about the resources used and their associated costs. 

Provide insights on how to optimize costs based on this data.
Since these are already flagged as high-cost anomalies, determine the likely cause (cost drops, cost increases, high variance, large spikes) and also infer underutilised/missing reservations

Give your response in JSON format as a list of tickets with fields: title, description, suggested_actions, reasoning and priority. All of these are compulsory fields.
These suggestion ticket policies can sugest actions such as reallocation of resources, deleting certain underutilised services, buying reservations etc.

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

#code currently outside of function as static data

@app.route('/suggestions', methods=['GET'])
def get_user_query():
    try:
        return jsonify(result.model_dump())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)

