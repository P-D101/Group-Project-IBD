from flask import Flask

app = Flask(__name__)

@app.route("/api/getVPL=<file>")
def home_page():
    pass # get vpl file