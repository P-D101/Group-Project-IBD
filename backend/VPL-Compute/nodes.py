Cloud_Serves_1_Usage = 0.5
Cloud_Serves_2_Usage = 0.1

def get_data(channel_name):
    if channel_name == "Cloud_Serves_1:Usage":
        return Cloud_Serves_1_Usage
    if channel_name == "Cloud_Serves_2:Usage":
        return Cloud_Serves_2_Usage

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

class GREATER_THAN(Node):
    def __init__(self):
        super().__init__()

    def compute(self, args):
        return args[0] > args[1]

class LESS_THAN(Node):
    def __init__(self):
        super().__init__()

    def compute(self, args):
        return args[0] < args[1]

class EQUALS(Node):
    def __init__(self):
        super().__init__()

    def compute(self, args):
        return args[0] == args[1]

class TICKET(Node):
    def __init__(self, node_object):
        super().__init__()
        self.description = node_object["Description"]
        self.receiver = node_object["Receiver"]

    def compute(self, args):
        if args[0]:
            print(self.receiver)
            print(self.description)
        return 0
    
class INPUT(Node):
    def __init__(self, node_object):
        super().__init__()
        self.provider = node_object["Input Provider"]
        self.channel = node_object["Input Channel"]

    def compute(self, args):
        return get_data(f'{self.provider}:{self.channel}')
    
class OUTPUT(Node):
    def __init__(self):
        super().__init__()

    def compute(self, args):
        print(args)
        return 0
    
def assign_node(type, node):
    
    if type == "Add":
        return ADD()
    if type == "Greater Than":
        return GREATER_THAN()
    if type == "Less Than":
        return LESS_THAN()
    if type == "Equals":
        return EQUALS()
    if type == "Ticket":
        return TICKET(node)
    if type == "Input":
        return INPUT(node)
    if type == "Output":
        return OUTPUT()