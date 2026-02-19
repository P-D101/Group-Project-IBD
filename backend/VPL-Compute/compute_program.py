import json
import os
from nodes import *
from pass_program import convert_program

class OutputError(Exception):
    pass

###### A method to compute the output of programs
def compute_program(program):

###### The list of output values for each node
    node_values = []

###### Run though all the nodes in DAG order
    for node, inputs in zip(program["nodes"], program["inputs"]):
        try:
            for input in [node_values[i] for i in inputs]:
                try:
                    if input == 'Do Not Read Output':
                        raise OutputError()
                except OutputError as e:
                    raise OutputError('Cannot read output of an input only block')
                except Exception as e:
                    pass
            node_values.append(node.compute([node_values[i] for i in inputs]))
        except Exception as e:
            print('\033[91m' + f'Error with program "{program['name']}":', e, f'in node {node.__class__.__name__} with input {[node_values[i] for i in inputs]}' + '\033[0m')
            break








###### Test Execution

if __name__ == '__main__':

    dir_path = os.path.dirname(os.path.realpath(__file__))
    
    with open(dir_path[:-12] + '/data/programs/example.json', 'r') as example_file:
        example_program = json.load(example_file)

    program = convert_program(example_program)

    compute_program(program)