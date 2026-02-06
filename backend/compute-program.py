import json
import os

def get_data(channel_name):
    if channel_name == "Cloud_Serves_1:Usage":
        return Cloud_Serves_1_Usage
    if channel_name == "Cloud_Serves_2:Usage":
        return Cloud_Serves_2_Usage

def DAG_sort(connections, start_nodes):
    sorted_order = []
    nodes = start_nodes.copy()
    while len(nodes) > 0:
        node = nodes.pop()
        sorted_order.append(node)
        for out_edge in connections[:]:
            if out_edge[0] == node:
                connections.remove(out_edge)
                check = False
                for in_edge in connections:
                    if out_edge[1] == in_edge[1]:
                        check = True
                if not check:
                    nodes.append(out_edge[1])
    
    return sorted_order

def compute_program(JSON_program):
    DAG_sort(JSON_program.connections)

Cloud_Serves_1_Usage = 0.5
Cloud_Serves_2_Usage = 0.1

if __name__ == '__main__':
    # Test Execution


    dir_path = os.path.dirname(os.path.realpath(__file__))
    
    with open(dir_path + '/programs/example.json', 'r') as example_file:
        example_program = json.load(example_file)

    start_nodes = []
    
    for node in example_program["Nodes"]:
        if node["Type"] == "Input":
            start_nodes.append(node["Index"])

    print(DAG_sort(example_program["Connections"], start_nodes))


    #compute_program(example_program)