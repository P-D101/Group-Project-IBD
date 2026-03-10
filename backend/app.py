import shutil
import os

from .VPL_Compute.pass_program import convert_program
from .VPL_Compute.compute_program import compute_program
from flask import Flask, request, make_response
from flask_cors import CORS
from .interface import TIMESPAN,SELECTS,GROUPBY,FILTERS, get_data
from .dashboard_data import get_dashboard_data
from .dashboard_graph import get_dashboard_graph 
from .ai_query import get_user_query
from .ai_suggestions import get_user_query

from . import database
import pandas as pd

app = Flask(__name__)
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "DELETE", "OPTIONS", "PUT"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    },
)


@app.after_request
def add_cors_headers(response):
    # Explicit CORS headers to avoid 403 from preflight
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS, PUT"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

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

@app.route('/api/dashboard-data', methods=['GET'])
def dashboard_overview():
    return get_dashboard_data()

@app.route('/api/dashboard-graph', methods=['GET'])
def dashboard_graph():
    return get_dashboard_graph()

@app.route('/api/suggestions', methods=['GET'])
def ticket_suggestions():
    return get_user_query()

## Data fields enumerations
@app.route("/api/data/<field>")
def get_data_enumeration(field):
    return get_data(field)

@app.route("/api/time_fields")
def get_time_fields():
    return TIMESPAN.to_list()

@app.route("/api/group_fields")
def get_group_fields():
    return GROUPBY.to_list()

@app.route("/api/input_fields")
def get_input_fields():
    return SELECTS.to_list()

@app.route("/api/filter_fields")
def get_filter_fields():
    return FILTERS.to_list()

"""
Example Query: https://localhost:5000/api/usage/weekly?provider=AWS
timestep: daily, weekly or monthly
provider: filter by provider, must be in list of providers returned by /api/data/provider

Returns: daily 
"""
@app.route("/api/usage/<timestep>") # Basic ungrouped usage (indexed) - quick
def usage(timestep):
    # check parameters
    if timestep not in TIMESPAN:
        return {"error": f"Bad Request: {timestep} not in acceptible timesteps: {TIMESPAN.to_list()}"}, 400

    # provider, not provided = all
    provider = request.args.get('provider', default=None)
    if provider not in get_data('provider') and provider:
        return {"error": f"Bad Request: {provider} not in acceptible providers: {get_data('provider')}"}, 400
    
    
    selected_usage_field = TIMESPAN(timestep).map()

    query = f"""
    SELECT    
        {selected_usage_field},
        SUM(net_cost) AS usage_cost,
        SUM(billed_cost) AS billed_cost
    FROM gold_standard_usage {f'\
    WHERE provider_name = "{provider}"' if provider else ""}
    GROUP BY {selected_usage_field}
    ORDER BY {selected_usage_field};
    """
    # TODO: pandas so it is formated nicely
    return database.query(query)




"""
Example Query: https://localhost:5000/api/usage/breakdown/daily?groupby=service_name,provider&selects=net_cost,usage_quantity
selects: comma seperated list of fields to select, must be in SELECTS enum
groupby: comma seperated list of fields to group by, must be in GROUPBY enum

JSON body: key,value where key must be in FILTERS
{
    "service_name": "Amazon Elastic Compute Cloud Compute",
    "before": "2024-01-01",
    "region": "us-east-1"
}
"""

@app.route('/api/usage/breakdown/<timestep>') # slower as not fully indexed
def grouped_usage(timestep):
    # check parameter
    if timestep not in TIMESPAN:
        return {"error": f"Bad Request: {timestep} not in acceptible timesteps: {TIMESPAN.to_list()}"}, 400

    selected_usage_field = TIMESPAN(timestep).map()

    # groupby: comma seperated list
    groupby = request.args.get('groupby', default=None)

    # split by , unless not provided
    groupby = groupby.split(',') if groupby else []

    for i,field in enumerate(groupby): # check valid grouping
        if field not in GROUPBY:
            return {"error": f"Bad Request: selection parameter: {field} not in acceptible group selections: {GROUPBY.to_list()}"}, 400
        groupby[i] = GROUPBY(field).map()
    
    # fields to select: comma seperated list
    selects = request.args.get('selects', default=None)

    # split by , unless not provided
    selects = selects.split(',') if selects else []

    for i,select in enumerate(selects):
        if select not in SELECTS: 
            return {"error": f"Bad Request: selection parameter: {select} not in acceptible selections: {SELECTS.to_list()}"}, 400
        
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
            return {"error": f"Bad Request: filter json:{key} not in acceptible filters: {FILTERS.to_list()}"}, 400
        
        # turn the values into the relevant SQL statement, will throw an error if the input is ill formatted.
        try:
            filters[key] = FILTERS(key).validate_and_process_to_SQL(value,selected_usage_field)
        except Exception as e:
            return {"error": f"Bad Request: filter {key}'s value not valid, reason: {e}"}, 400

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
    FROM gold_standard_usage
    {where_clause}
    GROUP BY {','.join(groupby)}
    ORDER BY {selected_usage_field}
    """

    print(query)

    # TODO: pandas, add a top n query parameter so i can remove the route below

    return database.query(query)

"""
Example Query: https://localhost:5000/api/usage/top_services/AWS/daily

Returns the daily cost of the top 5 most expensive services for AWS, with all other services grouped into "Other"
"""
@app.route("/api/usage/top_services/<provider>/<timestep>")
def top_services(provider,timestep):
    # check parameters
    if timestep not in TIMESPAN:
        return {"error": f"Bad Request: {timestep} not in acceptible timesteps: {TIMESPAN.to_list()}"}, 400

    if provider not in get_data('provider'):
        return {"error": f"Bad Request: {provider} not in acceptible providers: {get_data('provider')}"}, 400

    selected_usage_field = TIMESPAN(timestep).map()

    # How many services to give information for and how many to
    N_top_services = int(request.args.get("N", 5))

    query = f"""
    SELECT    
        {selected_usage_field}, service_name,
        SUM(total_usage_cost) AS usage_cost
    FROM gold_standard_usage
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
import backend.VPL_Compute.nodes as nodes

@app.route("/api/vpl/node_types", methods=["GET"])
def get_node_types():
    nodesTypes = nodes.get_all_node_types()
    print(nodesTypes)
    return nodesTypes


import os
import uuid
import json

def is_in_removed(vplID):
    file_path = os.path.join(os.path.dirname(__file__), "data", "remove-programs", f"policy_{vplID}.json")
    return os.path.exists(file_path)

@app.route("/api/policies/<vplID>", methods=["GET"])
def get_vpl_from_id(vplID):
    if is_in_removed(vplID):
        return {"error":"VPL has been deleted"}, 404
    # load input file ./programs/policy_{vplID}.json then respond with this file
    file_path = os.path.join(os.path.dirname(__file__), "data", "programs", f"policy_{vplID}.json")

    try:
        with open(file_path, "r") as f:
            vpl_data = json.load(f)
    except FileNotFoundError:
        return {"error": "VPL not found"}, 404
    except json.JSONDecodeError:
        return {"error": "Invalid JSON in VPL file"}, 400
    except Exception as e:
        return {"error": f"An error occurred while reading the VPL file: {e}"}, 500

    return vpl_data # get vpl file

@app.route("/api/policies/<vplID>/disabled", methods=["GET"])
def get_vpl_from_id_disabled(vplID):
    if is_in_removed(vplID):
        return {"error":"VPL has been deleted"}
    # load input file ./programs/policy_{vplID}.json then respond with this file
    file_path = os.path.join(os.path.dirname(__file__), "data", "disable-programs", f"policy_{vplID}.json")

    try:
        with open(file_path, "r") as f:
            vpl_data = json.load(f)
    except FileNotFoundError:
        return {"error": "VPL not found"}, 404
    except json.JSONDecodeError:
        return {"error": "Invalid JSON in VPL file"}, 400
    except Exception as e:
        return {"error": f"An error occurred while reading the VPL file: {e}"}, 500

    return vpl_data # get vpl file

@app.route("/api/policies/<vplID>/processing", methods=["GET"])
def get_vpl_from_id_processing(vplID):
    # load input file ./programs/policy_{vplID}.json then respond with this file
    file_path = os.path.join(os.path.dirname(__file__), "data", "new-programs", f"policy_{vplID}.json")

    try:
        with open(file_path, "r") as f:
            vpl_data = json.load(f)
    except FileNotFoundError:
        return {"error": "VPL not found"}, 404
    except json.JSONDecodeError:
        return {"error": "Invalid JSON in VPL file"}, 400
    except Exception as e:
        return {"error": f"An error occurred while reading the VPL file: {e}"}, 500

    return vpl_data # get vpl file



@app.route("/api/policies", methods=["GET"])
def get_vpls():
    # list all files in ./programs/ and return the names without the policy_ prefix and .json suffix
    enabled_dir = os.path.join(os.path.dirname(__file__), "data", "programs")
    disabled_dir = os.path.join(os.path.dirname(__file__), "data", "disable-programs")
    processing_dir = os.path.join(os.path.dirname(__file__), "data", "new-programs")
    removed_dir = os.path.join(os.path.dirname(__file__),"data","remove-programs")

    # check dir exists
    if not os.path.exists(enabled_dir) and not os.path.exists(disabled_dir) and not os.path.exists(processing_dir):
        return {"vpl_ids": []} # if not return empty list
    
    vpl_ids = {}
    get_id = lambda f: f.split("policy_")[1].split(".json")[0]
    if os.path.exists(removed_dir): # we only want to remove files in "remove-programs" if they're not processing. This is because deleted processing programs just get directly deleted, instead of being copied to remove-programs
        removed_files = set(os.listdir(removed_dir))
    if os.path.exists(disabled_dir):
        disabled_files = set(os.listdir(disabled_dir)).difference(removed_files)
        vpl_ids["disabled"] = [get_id(f) for f in disabled_files if f.startswith("policy_") and f.endswith(".json")]
    if os.path.exists(enabled_dir):
        enabled_files = set(os.listdir(enabled_dir)).difference(disabled_files).difference(removed_files)
        vpl_ids["enabled"] = [get_id(f) for f in enabled_files if f.startswith("policy_") and f.endswith(".json")]
    if os.path.exists(processing_dir):
        processing_files = os.listdir(processing_dir)
        vpl_ids["processing"] = [get_id(f) for f in processing_files if f.startswith("policy_") and f.endswith(".json")]



    return {"vpl_ids": vpl_ids}

@app.route("/api/policies/all", methods=["GET"])
def get_all_vpls():
    # list all VPL files across all directories
    ids = get_vpls()['vpl_ids']
    data = {}
    for status in ids:
        if status == "enabled":
            data[status] = [{**get_vpl_from_id(id), **{"id": id}} for id in ids[status]]
        elif status == "disabled":
            data[status] = [{**get_vpl_from_id_disabled(id), **{"id": id}} for id in ids[status]]
        elif status == "processing":
            data[status] = [{**get_vpl_from_id_processing(id), **{"id": id}} for id in ids[status]]
    
    return data


@app.route("/api/policies", methods=["POST", "OPTIONS"])
def save_policy():
    """
    Receives a VPL policy JSON and stores it as a file in backend/data/programs/.
    """
    if request.method == "OPTIONS":
        resp = make_response("", 200)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return resp
    try:
        policy = request.get_json()
    except Exception as e:
        print(f"[save_policy] JSON parse error: {e}")
        return {"error": f"Invalid JSON: {e}"}, 400
    if not policy or 'Nodes' not in policy:
        print("[save_policy] Missing Nodes in payload")
        return  {"error": "Invalid JSON, requires 'Nodes'"}, 400
    # Generate a unique filename
    policy_id = str(uuid.uuid4())
    filename = f"policy_{policy_id}.json"
    save_dir = os.path.join(os.path.dirname(__file__), "data", "new-programs")
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, filename)
    try:
        with open(save_path, "w") as f:
            json.dump(policy, f, indent=2)
    except Exception as e:
        print(f"[save_policy] Failed to save policy: {e}")
        return {"error": f"Failed to save policy: {e}"}, 500
    return {"message": "Policy saved", "policy_id": policy_id, "filename": filename}, 200

@app.route("/api/policies/<vplID>", methods=["DELETE"])
def delete_vpl(vplID):
    # delete the file ./programs/policy_{vplID}.json
    filename = f"policy_{vplID}.json"
    programs_file_path = os.path.join(os.path.dirname(__file__), "data", "programs", filename)
    new_programs_file_path = os.path.join(os.path.dirname(__file__), "data", "new-programs", filename)
    if not os.path.exists(programs_file_path) and not os.path.exists(new_programs_file_path):
        return {"error": "VPL not found"}, 404
    try:
        if os.path.exists(programs_file_path):
            # move the file to a deleted folder instead of deleting it permanently, in case of accidental deletion
            deleted_dir = os.path.join(os.path.dirname(__file__), "data", "remove-programs")
            os.makedirs(deleted_dir, exist_ok=True)
            # copy instead of move
            shutil.copy(programs_file_path, os.path.join(deleted_dir, filename))
        else: # program is only in new-programs, so it can be deleted directly
            os.remove(new_programs_file_path)
    except Exception as e:
        return {"error": f"Failed to delete VPL: {e}"}, 500
    return {"message": "VPL deleted", "vpl_id": vplID}, 200

@app.route("/api/policies/<vplID>/disable", methods=["POST"])
def disable_vpl(vplID):
    # disable the file ./programs/policy_{vplID}.json
    filename = f"policy_{vplID}.json"
    file_path = os.path.join(os.path.dirname(__file__), "data", "programs", filename)
    if not os.path.exists(file_path):
        return {"error": "VPL not found"}, 404
    try:
        # move the file to a disabled folder instead of deleting it permanently, in case of accidental deletion
        deleted_dir = os.path.join(os.path.dirname(__file__), "data", "disable-programs")
        os.makedirs(deleted_dir, exist_ok=True)
        # copy instead of move
        shutil.copy(file_path, os.path.join(deleted_dir, filename))
    except Exception as e:
        return {"error": f"Failed to disable VPL: {e}"}, 500
    return {"message": "VPL disabled", "vpl_id": vplID}, 200

@app.route("/api/policies/<vplID>/enable", methods=["POST"])
def enable_vpl(vplID):
    # remove the file from ./disable-programs/policy_{vplID}.json
    filename = f"policy_{vplID}.json"
    file_path = os.path.join(os.path.dirname(__file__), "data", "disable-programs", filename)
    if not os.path.exists(file_path):
        return {"error": "VPL not found"}, 404

    try:
        # delte the file in the disabled folder
        # check if it is in programs, if not copy it (theoretically it should always be in programs)
        enabled_file_path = os.path.join(os.path.dirname(__file__), "data", "programs", filename)
        if not os.path.exists(enabled_file_path):
            shutil.copy(file_path, enabled_file_path)
        os.remove(file_path)
    except Exception as e:
        return {"error": f"Failed to enable VPL: {e}"}, 500
    return {"message": "VPL enabled", "vpl_id": vplID}, 200



@app.route("/api/policies/<vplID>", methods=["PUT"])
def update_vpl(vplID):
    # update the file ./programs/policy_{vplID}.json with the new data from the request body
    filename = f"policy_{vplID}.json"
    programs_file_path = os.path.join(os.path.dirname(__file__), "data", "programs", filename)
    new_programs_file_path = os.path.join(os.path.dirname(__file__), "data", "new-programs", filename)
    if not os.path.exists(programs_file_path) and not os.path.exists(new_programs_file_path):
        return {"error": "VPL not found"}, 404
    new_data = request.get_json()
    if not new_data or 'Nodes' not in new_data: # CHANGED - we have two vpl interpreters, the old one uses 'blocks' and the new one uses 'Nodes', we want to support both for now but validate that at least one is present
        return {"error": "Invalid policy format"}, 400
    try:
        if os.path.exists(new_programs_file_path):
            with open(new_programs_file_path, "w") as f:
                json.dump(new_data, f, indent=2)
        elif os.path.exists(programs_file_path):
            # Copy old file to remove-programs
            deleted_dir = os.path.join(os.path.dirname(__file__), "data", "remove-programs")
            shutil.copy(programs_file_path, os.path.join(deleted_dir, filename))

            # Add new file to new-programs
            with open(new_programs_file_path, "w") as f:
                json.dump(new_data, f, indent=2)

    except Exception as e:
        return {"error": f"Failed to update VPL: {e}"}, 500
    return {"message": "VPL updated", "vpl_id": vplID}, 200


# @app.route("/api/policies/<vplID>/execute", methods=["POST"])
# def execute_vpl(vplID):
#     # execute the VPL with the given ID, for now just return a success message
#     filename = f"policy_{vplID}.json"
#     file_path = os.path.join(os.path.dirname(__file__), "data", "programs", filename)
#     if not os.path.exists(file_path):
#         return {"error": "VPL not found"}, 404

#     compute_program(convert_program(json.load(open(file_path))))


#     return {"message": "VPL executed", "vpl_id": vplID}, 200


############################################
#                   OTHER                  #
############################################

@app.route('/api/query', methods=['POST', 'OPTIONS'])
def ai_query():
    return get_user_query()

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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)






