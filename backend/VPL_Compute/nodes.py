###### Used for testing
import numpy as np
import time
import sys
import inspect


def Cloud_Serves_1_Usage(t):
    return np.array([max(min(0.1 * np.sin(0.1 * t) + 0.4 * np.sin(0.01 * t + 1) + 0.5, 1), 0)])

def Cloud_Serves_2_Usage(t):
    return np.array([max(min(0.4 * np.sin(0.1 * t) + 0.4 * np.sin(0.01 * t + 2) + 0.4, 1), 0)])

def Cloud_Serves_3_Usage(t):
    return np.array([max(min(0.6 * np.sin(0.1 * t) + 0.1 * np.sin(0.01 * t + 3) + 0.6, 1), 0)])

def get_data(channel_name, t = time.time()):
    if channel_name == "Cloud_Serves_1:Usage":
        return Cloud_Serves_1_Usage(t)
    if channel_name == "Cloud_Serves_2:Usage":
        return Cloud_Serves_2_Usage(t)
    if channel_name == "Cloud_Serves_3:Usage":
        return Cloud_Serves_3_Usage(t)

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

    def compute(self, args):
        return sum(args)

class SUBTRACT(Node):
    def __init__(self):
        super().__init__()

    def compute(self, args):
        return args[0] - sum(args[1:])
    
class MULTIPLY(Node):
    def __init__(self):
        super().__init__()

    def compute(self, args):
        return np.multiply(*args)
    
class DIVIDE(Node):
    def __init__(self):
        super().__init__()

    def compute(self, args):
        return np.divide(*args)

class GREATER_THAN(Node):
    def __init__(self):
        super().__init__()

    def compute(self, args = [0]):
        greaterthan = np.array([True for _ in range(len(args[0]))])
        for i in range(len(args)-1):
            greaterthan = np.logical_and(greaterthan, args[i+1] - args[i] < 0)
        return greaterthan

class LESS_THAN(Node):
    def __init__(self):
        super().__init__()

    def compute(self, args = [0]):
        lessthan = np.array([True for _ in range(len(args[0]))])
        for i in range(len(args)-1):
            lessthan = np.logical_and(lessthan, args[i+1] - args[i] > 0)
        return lessthan

class EQUALS(Node):
    def __init__(self):
        super().__init__()

    def compute(self, args = [0]):
        equal = np.array([True for _ in range(len(args[0]))])
        for arg in args[1:]:
            equal = np.logical_and(equal, arg - args[0] == 0)
        return equal
    
class AND(Node):
    def __init__(self):
        super().__init__()
    def compute(self, args):
        return np.logical_and(*args)
    
class OR(Node):
    def __init__(self):
        super().__init__()
    def compute(self, args):
        return np.logical_or(*args)

class TICKET(Node):
    def __init__(self, node_object):
        super().__init__()
        self.description = node_object["Description"]
        self.receiver = node_object["Receiver"]

    def compute(self, args):
        for val in args[0]:
            if val:
                print(self.receiver)
                print(self.description)
        return 'Do Not Read Output'
    
class INPUT(Node):
    def __init__(self, node_object):
        super().__init__()
        self.provider = node_object["Input Provider"]
        self.channel = node_object["Input Channel"]
        
        self.field = node_object["Field"]
        self.aggregate = node_object["Aggregate"]
        self.type = node_object["Type"]
        self.date_after = node_object["Date After"]
        self.date_before = node_object["Date Before"] or None
    

    def compute(self, args, t):
        return get_data(f'{self.provider}:{self.channel}', t)

class CONSTANT(Node):
    def __init__(self, node_object):
        self.value = node_object["Value"]
        super().__init__()

    def compute(self, args):
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


if __name__ == "__main__":
    print(get_data("Cloud_Serves_1:Usage"))