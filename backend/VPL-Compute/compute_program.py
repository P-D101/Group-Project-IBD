import json
import os
import nodes
import pass_program

def get_data(channel_name):
    if channel_name == "Cloud_Serves_1:Usage":
        return Cloud_Serves_1_Usage
    if channel_name == "Cloud_Serves_2:Usage":
        return Cloud_Serves_2_Usage

def out_edge_list(connections):
    list = {}
    for connection in connections:
        if list.get(connection[0]) == None:
            list[connection[0]] = [connection[1]]
        else:
            list[connection[0]].append(connection[1])
    return list

def in_edge_list(connections):
    list = {}
    for connection in connections:
        if list.get(connection[1]) == None:
            list[connection[1]] = [connection[0]]
        else:
            list[connection[1]].append(connection[0])
    return list

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

def compute_node(node, args):
    if node["Type"] == "Input":
        return get_data(f'{node["Input Provider"]}:{node["Input Channel"]}')
    
    if node["Type"] == "Greater Than":
        return args[0] > args[1]
    
    if node["Type"] == "Ticket":
        if sum(args) >= 1:
            print(node["Description"])
    return 0

def compute_program(JSON_program):

    start_nodes = []
    
    for node in example_program["Nodes"]:
        if node["Type"] == "Input":
            start_nodes.append(node["Index"])

    node_output = {}
    args = in_edge_list(example_program["Connections"])

    operation_oder = DAG_sort(JSON_program["Connections"], start_nodes)

    for node_index in operation_oder:
        i = 0
        node = example_program["Nodes"][i]
        while node["Index"] != node_index:
            node = example_program["Nodes"][i]
            i += 1
        val = []
        if args.get(node_index) != None:
            for arg in args.get(node_index):
                val.append(node_output[arg])
        node_output[node_index] = compute_node(node, val)
    print(node_output)



Cloud_Serves_1_Usage = 0.5
Cloud_Serves_2_Usage = 0.1

if __name__ == '__main__':
    # Test Execution


    dir_path = os.path.dirname(os.path.realpath(__file__))
    
    with open(dir_path + '/programs/example.json', 'r') as example_file:
        example_program = json.load(example_file)

    compute_program(example_program)