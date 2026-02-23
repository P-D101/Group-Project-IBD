import sys
import subprocess
import pandas as pd
from database import get_db
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from google import genai
from pydantic import BaseModel, Field

#ml model using isolation forest to detect anomalies
##not currently working due to database api error

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

#data = get_db().execute("SELECT * FROM hundred_k") ##test code

##llm - works as expected but not tested on database data 
client = genai.Client(api_key="")

class JsonTicket(BaseModel):
    title: str = Field(..., description="The title of the ticket")
    description: str = Field(..., description="A detailed description of the issue or request")
    suggested_actions: str = Field(..., description="Suggested actions to resolve the issue or fulfill the request")
    reasoning: str = Field(..., description="The reasoning behind the suggested actions")
    priority: str = Field(..., description="The priority level of the ticket (e.g., High, Medium, Low)")

client = genai.Client()
prompt = """
Analyse the following dataset and provide suggestion tickets for cost optimization. 
These suggestions should be actionable and/or formulae that can be implemented per server or to a number of servers to optimize costs.
The dataset contains the following columns: ResourceId, ResourceName, ResourceType, ServiceName, RegionName, EffectiveCost, ListUnitPrice, ConsumedQuantity, ConsumedUnit, ChargePeriodStart, CommitmentDiscountStatus, CommitmentDiscountId. 
The dataset is in a tabular format and contains information about the resources used and their associated costs. 
Provide insights on how to optimize costs based on this data.
Identify anomolies in the data (cost drops, cost increases, high variance, large spikes) and also infer underutilised reservations
Give your response in JSON format with fields: title, description, suggested_actions, reasoning and priority.
These suggestion ticket policies can sugest actions such as reallocation of resources, deleting certain underutilised services
"""

response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents=[data, prompt],
    config={
        "response_mime_type": "application/json",
        "response_json_schema": JsonTicket.model_json_schema(),
    },
)

result = JsonTicket.model_validate_json(response.text)

print(result) ##Gemini suggestions which can be displayed on main page

