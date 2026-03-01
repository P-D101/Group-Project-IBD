#code for the ai input box on home page, which will allow users to ask questions 
#regarding how to use the platform

#the result will be a natural langauge aanswer
#along with a hyperlink to the relevant page if needed

#could also allow users to ask questions about data 
#this will have a natural language reponse along with relavant data from database

from flask import Flask, request, jsonify
from flask_cors import CORS
import http
import sys
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

class QueryResponse(BaseModel):
    response: str = Field(..., description="The response to the user's query")
    url: Optional[str] = Field(None, description="A URL to a relevant page or resource requested (optional)")

apistr = "" #add api key here for testing 
client = genai.Client(api_key=apistr)

##debug test
'''try:
    client = genai.Client(api_key=apistr)
    print(f"Client initialized! Key length: {len(apistr)}")
    
    # Try a tiny test call
    response = client.models.generate_content(
        model="gemini-3-flash-preview", 
        contents="Hello"
    )
    print("Success! Gemini responded.")
except Exception as e:
    print(f"Caught Error: {e}")'''



def process_query(user_query):
    prompt = """
    You are a helpful assistant for a cost management platform.
    Answer the user's query in a clear and concise manner.
    If the user asks for information that can be found on a specific page of the platform, provide a hyperlink to that page in your response.
    If the user asks for data-related information, provide a natural language response along with relevant data from the database if applicable.
    If you can't answer the user's query, respond with "I'm sorry, I don't have that information." and do not provide a hyperlink.
    Give your response in JSON format with fields: response and url (if applicable). Make sure the response is detailed and driectly answers the user's question. Don't give tell the user to go to the dashboard page as that is where the user is already.

    Here's is some info about the platform and its features that you can use to answer user queries:
    - The platform provides cost optimization suggestions based on resource usage and cost data.
    - Users can view detailed cost breakdowns and trends on the dashboard.
    - The platform allows users to set up alerts for cost anomalies and budget thresholds.
    - Users can view all of their created policies on the policies page
    - they can also create new policies per service for cost optimization/efficiency on the policy editor page.

    Below are some paths to relevant pages on the platform that you can link to in your responses:
    - Main page:"http://localhost:5173/"
    - The main page routes to the ai-dashboard
    - Dashboard: /ai-dashboard
    - Policy Editor: /policy-editor
    - Service Viewer: /service-viewer
    """ + "User's query: " + user_query


    tools = [Tool(url_context=UrlContext())]



    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=[prompt],
        config=GenerateContentConfig(
            tools=tools,
            response_mime_type="application/json",
        # response_json_schema=QueryResponse.model_json_schema(),
        ),  

    )

    result = QueryResponse.model_validate_json(response.text)

    print(result) ##Gemini suggestions which can be displayed on main page
    return result

@app.route('/query', methods=['POST', 'OPTIONS'])
def get_user_query():
    user_query = "Tell me what the site does" #example query for now
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json() #get data from frontend 
    user_query = data.get('query', user_query)  # use the example query if none provided
    result = process_query(user_query)
    return jsonify(result.model_dump())
    ##return jsonify(result)  # return the processed query result as JSON

if __name__ == '__main__':
    app.run(debug=True, port=5001)
