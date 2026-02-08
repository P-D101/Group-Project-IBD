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
        "inputs": [[] for _ in range(len(sorted_order))]
    }


    for node in json_program["Nodes"]:
        output_program["nodes"][index_mapping[node["Index"]]] = assign_node(node["Type"], node)
        try:
            output_program["inputs"][index_mapping[node["Index"]]] = [index_mapping[i] for i in program_graph.in_set[node["Index"]]]
        except:
            pass

    return output_program


if __name__ == "__main__":
    
    dir_path = os.path.dirname(os.path.realpath(__file__))
    
    with open(dir_path[:-12] + '/data/programs/example.json', 'r') as example_file:
        example_program = json.load(example_file)

    convert_program(example_program)