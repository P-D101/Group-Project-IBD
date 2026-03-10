import os

import json
from .nodes import *
from .pass_program import convert_program
import time

class OutputError(Exception):
    pass

###### A method to compute the output of programs
def compute_program(program, t = time.time()):

###### The list of output values for each node
    node_values = []

###### Run though all the nodes in DAG order
    for node, inputs in zip(program["nodes"], program["inputs"]):
        try:
            print(node,inputs)
            for input in [node_values[j] for j in inputs]:
                try:
                    if input == 'Do Not Read Output':
                        raise OutputError()
                except OutputError as e:
                    raise OutputError('Cannot read output of an input only block')
                except Exception as e:
                    raise Exception(f'Error with input value {input}: {e}')
            # inputs = [node_values[j] for j in inputs]
            if len(inputs) > 2:
                raise Exception('Too many inputs')
            node_vals = [node_values[j] for j in inputs]
            node_values.append(node.compute(*node_vals))
        except OutputError as e:
            print('\033[91m' + f'Output error with program "{program['name']}":', e, f'in node {node.__class__.__name__} with input {[node_values[i] for i in inputs]}' + '\033[0m')
        except Exception as e:
            print(inputs)
            print('\033[91m' + f'Some error with program "{program['name']}":', e, f'in node {node.__class__.__name__} with input {[node_values[i] for i in inputs]}' + '\033[0m')
            break








###### Test Execution

if __name__ == '__main__':

    dir_path = os.path.dirname(os.path.realpath(__file__))
    
    with open(dir_path[:-12] + '/data/programs/policy_77526dac-d0e6-473a-8abc-03aac309de74.json', 'r') as example_file:
        example_program = json.load(example_file)

    program = convert_program(example_program)

    compute_program(program)