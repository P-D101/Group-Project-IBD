###### Used for testing
import numpy as np
import time
import sys

import inspect
from backend import database
from backend.interface import SELECTS, AGGREGATES, COMPUTE_TYPES, FILTERS

def get_data_from_db(field, aggregate, compute_type, after=None, before=None):
    if field not in SELECTS:
        return {"error": f"Bad Request: selection parameter: {field} not in acceptible selections: {SELECTS.to_list()}"}, 400

    if aggregate not in AGGREGATES:
        return {"error": f"Bad Request: aggregate parameter: {aggregate} not in acceptible aggregates: {AGGREGATES.to_list()}"}, 400

    if compute_type not in COMPUTE_TYPES and compute_type != "all":
        return {"error": f"Bad Request: compute_type parameter: {compute_type} not in acceptible compute types: {COMPUTE_TYPES.to_list()}"}, 400    

    where_clauses = []
    if after:
        try:
            where_clauses.append(FILTERS.AFTER.validate_and_process_to_SQL(after,'usage_date'))
        except Exception as e:
            return {"error": f"Bad Request: filter after's value not valid, reason: {e}"}, 400
    if before:
        try:
            where_clauses.append(FILTERS.BEFORE.validate_and_process_to_SQL(before,'usage_date'))
        except Exception as e:
            return {"error": f"Bad Request: filter before's value not valid, reason: {e}"}, 400
    if compute_type != "all":
        where_clauses.append(f"meter_dimension IN {COMPUTE_TYPES(compute_type).map()}")

    if len(where_clauses) == 0:
        where_clause = ""
    else:
        where_clause = "WHERE " + " AND ".join(where_clauses)

    query = f"""
    SELECT
        {AGGREGATES(aggregate).map(field)}
    FROM gold_standard_usage
    {where_clause}
    """
    print(query)
    
    res = database.query(query)[0][0]
    print(res)
    return res

###### End section for testing




##### A node of computation

class Node:
    def __init__(self):
        pass

    def compute(self, args):
        pass

class ADD(Node):
    def __init__(self):
        super().__init__()

    def compute(self, arg1, arg2):
        return arg1 + arg2

class SUBTRACT(Node):
    def __init__(self):
        super().__init__()

    def compute(self, arg1, arg2):
        return arg1 - arg2
    
class MULTIPLY(Node):
    def __init__(self):
        super().__init__()

    def compute(self, arg1, arg2):
        return arg1 * arg2
    
class DIVIDE(Node):
    def __init__(self):
        super().__init__()

    def compute(self, arg1, arg2):
        return arg1 / arg2

class GREATER_THAN(Node):
    def __init__(self):
        super().__init__()

    def compute(self, arg1, arg2):
        return arg1 > arg2

class LESS_THAN(Node):
    def __init__(self):
        super().__init__()

    def compute(self, arg1, arg2):
        return arg1 < arg2

class EQUALS(Node):
    def __init__(self):
        super().__init__()

    def compute(self, arg1, arg2):
        return arg1 == arg2
    
class AND(Node):
    def __init__(self):
        super().__init__()
    def compute(self, arg1, arg2):
        return np.logical_and(arg1, arg2)

class OR(Node):
    def __init__(self):
        super().__init__()
    def compute(self, arg1, arg2):
        return np.logical_or(arg1, arg2)

class TICKET(Node):
    def __init__(self, node_object):
        super().__init__()
        self.description = node_object.get("description", "")
        payload = node_object.get("payload", {})
        self.receiver = payload.get("receiver", "")

    def compute(self, args):
        if args:
            print(f"TICKET raised -> receiver: {self.receiver}, description: {self.description}")
            try:
                database.insert_ticket(self.receiver, self.description)
            except Exception as e:
                print(f"Failed to persist ticket: {e}")
        return 'Do Not Read Output'

class INPUT(Node):
    def __init__(self, node_object):
        super().__init__()
        # check if field, aggregate, date_after, date_before are in node_object and if not set to None
        self.field = node_object["payload"]["field"]
        self.aggregate = node_object["payload"]["aggregate"]
        self.type = node_object["payload"]["type"]
        self.date_after = node_object["payload"]["after"]
        self.date_before = node_object["payload"]["before"]

    def compute(self):
        # args will be empty
        # this will return a value based on the field, aggregate, type, date_after and date_before
        return get_data_from_db(self.field,self.aggregate,self.type,self.date_after,self.date_before)

class CONSTANT(Node):
    def __init__(self, node_object):
        self.value = node_object["payload"]["value"]
        super().__init__()

    def compute(self):
        return self.value
    
class OUTPUT(Node):
    def __init__(self):
        super().__init__()

    def compute(self, args):
        print(args)
        return 'Do Not Read Output'
    

def get_all_node_types():
    classes = []
    for name, obj in inspect.getmembers(sys.modules[__name__]):
        if inspect.isclass(obj):
            name = obj.__name__
            if name != "Node":
                classes.append(name)
    return classes




###### This is a function for assign nodes to the correct type

def assign_node(type, node):
    
    if type == "add":
        return ADD()
    elif type == "subtract":
        return SUBTRACT()
    elif type == "multiply":
        return MULTIPLY()
    elif type == "divide":
        return DIVIDE()
    elif type == "gt":
        return GREATER_THAN()
    elif type == "lt":
        return LESS_THAN()
    elif type == "eq":
        return EQUALS()
    elif type == "and":
        return AND()
    elif type == "or":
        return OR()
    elif type == "ticket":
        return TICKET(node)
    elif type == "input":
        return INPUT(node)
    elif type == "const":
        return CONSTANT(node)
    elif type == "output":
        return OUTPUT()
    else:
        raise Exception(f'Node type {type} not recognized')