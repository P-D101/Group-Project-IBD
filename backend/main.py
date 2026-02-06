from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("api/getVPL=<file>")
def home_page():
    pass # get vpl file