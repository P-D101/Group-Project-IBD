from flask import Flask, request
from flask_cors import CORS
from interface import TIMESPAN,SELECTS,GROUPBY,FILTERS, get_data
import database
import pandas as pd

app = Flask(__name__)
CORS(app, resources = {
    r"/*": { # restrict origins of all routes
        "origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ]
    }
})

@app.route("/")
def index():
    return "Flask API"


#############################################
#                Data Routes                #
#############################################

## OVERVIEW
@app.route("/api/overview")
def overview(): # TODO
    return "TODO"

#
@app.route("/api/overview/<provider>") 
def overview_provider(provider): # TODO
    return "TODO"

## Data fields enumerations
@app.route("/api/data/<field>")
def get_data_enumeration(field):
    return get_data(field)

## USAGE
@app.route("/api/usage/<timestep>") # Basic ungrouped usage (indexed) - quick
def usage(timestep):
    # check parameters
    if timestep not in TIMESPAN:
        return f'Bad Request: {timestep} not in acceptible timesteps: {TIMESPAN.to_list()}', 400

    # provider, not provided = all
    provider = request.args.get('provider', default=None)
    if provider not in get_data('provider') and provider:
        return f'Bad Request: {provider} not in acceptible providers: {get_data('provider')}', 400
    
    
    selected_table, selected_usage_field = TIMESPAN(timestep).map()

    query = f"""
    SELECT    
        {selected_usage_field},
        SUM(total_usage_cost) AS usage_cost
    FROM {selected_table}{f'\
    WHERE provider_name = "{provider}"' if provider else ""}
    GROUP BY {selected_usage_field}
    ORDER BY {selected_usage_field};
    """
    # TODO: pandas so it is formated nicely
    return database.query(query)

@app.route('/api/usage/breakdown/<timestep>') # slower as not fully indexed
def grouped_usage(timestep):
    # check parameter
    if timestep not in TIMESPAN:
        return f'Bad Request: {timestep} not in acceptible timesteps: {TIMESPAN.to_list()}', 400

    selected_table, selected_usage_field = TIMESPAN(timestep).map()

    # groupby: comma seperated list
    groupby = request.args.get('groupby', default=None)

    # split by , unless not provided
    groupby = groupby.split(',') if groupby else []

    for field in groupby: # check valid grouping
        if field not in GROUPBY:
            return f'Bad Request: selection parameter: {field} not in acceptible group selections: {GROUPBY.to_list()}', 400
    
    # fields to select: comma seperated list
    selects = request.args.get('selects', default=None)

    # split by , unless not provided
    selects = selects.split(',') if selects else []

    for i,select in enumerate(selects):
        if select not in SELECTS: 
            return f'Bad Request: selection parameter: {select} not in acceptible selections: {SELECTS.to_list()}', 400
        
        # map to the correct database column name
        selects[i] = SELECTS(select).map()

        # If we are selecting usage_quantity we need to group by usage unit so the sum makes sense.
        if select == SELECTS.USAGE_QUANTITY: groupby.append('usage_unit')
    # select the selected timespan as well
    selects.insert(0,selected_usage_field)

    # we also want to select everything we are grouping by
    selects.extend(groupby)

    # always group by the selected time field
    groupby.append(selected_usage_field)

    # filters: json object
    filters = request.get_json(silent=True) or {} # default empty object
    # validate and process filters for where clause
    for key,value in filters.items():
        if key not in FILTERS:
            return f'Bad Request: filter json:{key} not in acceptible filters: {FILTERS.to_list()}', 400
        
        # turn the values into the relevant SQL statement, will throw an error if the input is ill formatted.
        try:
            filters[key] = FILTERS(key).validate_and_process_to_SQL(value,selected_usage_field)
        except Exception as e:
            return f'Bad Request: filter {key}\'s value not valid, reason: {e}', 400

    # query builder
    if len(filters.keys()) == 0:
        where_clause = ""
    else:
        where_clause = f"""
        WHERE {" AND ".join(filters.values())}
        """

    query = f"""
    SELECT
        {','.join(selects)}
    FROM {selected_table}
    {where_clause}
    GROUP BY {','.join(groupby)}
    ORDER BY {selected_usage_field}
    """

    print(query)

    # TODO: pandas, add a top n query parameter so i can remove the route below

    return database.query(query)

@app.route("/api/usage/top_services/<provider>/<timestep>")
def top_services(provider,timestep):
    # check parameters
    if timestep not in TIMESPAN:
        return f'Bad Request: ${timestep} not in acceptible timesteps: ${TIMESPAN.to_list()}', 400

    if provider not in get_data('provider'):
        return f'Bad Request: ${provider} not in acceptible providers: ${get_data('provider')}', 400

    selected_table, selected_usage_field = TIMESPAN(timestep).map()

    # How many services to give information for and how many to
    N_top_services = int(request.args.get("N", 5))

    query = f"""
    SELECT    
        {selected_usage_field}, service_name,
        SUM(total_usage_cost) AS usage_cost
    FROM {selected_table}
    WHERE provider_name = "{provider}"
    GROUP BY {selected_usage_field}, service_name
    ORDER BY {selected_usage_field};
    """
    # read the query directly into a pandas dataframe
    df = pd.read_sql_query(query, database.get_db())

    # find the top N services
    top_services = df.groupby("service_name")["usage_cost"].sum().nlargest(N_top_services).index

    # create new column with the service_name if it is in the top 5, otherwise set to "Other"
    df["service_group"] = df["service_name"].where(df["service_name"].isin(top_services), "Other")

    # create a table of usage hour against the N service groups, other costs for that hour
    plot_df = df.groupby([selected_usage_field, "service_group"])["usage_cost"].sum().reset_index()
    pivot_df = plot_df.pivot(index=selected_usage_field, columns="service_group", values="usage_cost").fillna(0)

    # return json object
    return pivot_df.to_json()


############################################
#                VPL Policy API            #
############################################

import os
import uuid
import json

@app.route("/api/policies", methods=["POST"])
def save_policy():
    """
    Receives a VPL policy JSON and stores it as a file in backend/data/programs/.
    """
    policy = request.get_json()
    if not policy or 'blocks' not in policy:
        return {"error": "Invalid policy format"}, 400
    # Generate a unique filename
    policy_id = str(uuid.uuid4())
    filename = f"policy_{policy_id}.json"
    save_dir = os.path.join(os.path.dirname(__file__), "data", "programs")
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, filename)
    try:
        with open(save_path, "w") as f:
            json.dump(policy, f, indent=2)
    except Exception as e:
        return {"error": f"Failed to save policy: {e}"}, 500
    return {"message": "Policy saved", "policy_id": policy_id, "filename": filename}, 200

############################################
#                VPL Routes                #
############################################

@app.route("/api/getVPL=<vplID>")
def home_page(vplID):
    return vplID # get vpl file

@app.teardown_appcontext
def on_close(exception):
    database.close_connection(exception)

# make sure no caching while testing
@app.after_request
def add_headers(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response






