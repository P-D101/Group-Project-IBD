import json
import os
from nodes import *

def convert_program(json_program):

    output_program = {
        "nodes": [],
        "input_indexes": [],
        "output_indexes": []
    }

    index_mapping = {}

    for i, node in enumerate(json_program["Nodes"]):
        index_mapping[node["Index"]] = i
        output_program.nodes.append(assign_node(node["Type"], node))

    for connection in json_program["Connections"]:
        output_program.output_indexes[connection[0]].append(connection[1])


if __name__ == "__main__":
    
    dir_path = os.path.dirname(os.path.realpath(__file__))
    
    with open(dir_path + '/programs/example.json', 'r') as example_file:
        example_program = json.load(example_file)

    convert_program(example_program)