import json
import os
from nodes import *
from graph import Graph

def convert_program(json_program):

    program_graph = Graph(json_program["Connections"])
    index_mapping = {}

    start_nodes = []

    for node in json_program["Nodes"]:
        if node["Type"] == "Input":
            start_nodes.append(node["Index"])

    sorted_order = program_graph.DAG_sort(start_nodes)
    for i, j in enumerate(sorted_order):
        index_mapping[j] = i

    output_program = {
        "nodes": [0 for _ in range(len(sorted_order))],
        "inputs": [[] for _ in range(len(sorted_order))],
        "name": json_program["Policy Name"]
    }


    for node in json_program["Nodes"]:
        try: 
# There is an error case for a node that is not connected to the graph as this would no be in the index table and hence error would throw. 
# We don't want to add this node to the outputs so just passing works.
# Another error case is for input nodes, these nodes are not in the in_set so an error would throw.
# We want to leave the inputs in this case as an empty list so just passing works.

            output_program["nodes"][index_mapping[node["Index"]]] = assign_node(node["Type"], node)
            output_program["inputs"][index_mapping[node["Index"]]] = [index_mapping[i] for i in program_graph.in_set[node["Index"]]]
        except:
            pass

    return output_program















###### Test Execution

if __name__ == "__main__":
    
    dir_path = os.path.dirname(os.path.realpath(__file__))
    
    with open(dir_path[:-12] + '/data/programs/example.json', 'r') as example_file:
        example_program = json.load(example_file)

    convert_program(example_program)