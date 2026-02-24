#### This file is for simulating what would have happened in the last week if a given policy was added

import time
from compute_program import compute_program
from pass_program import convert_program
from glob import glob
import os
import json

def sim_policy(program):

    t = time.time() - 1000
    test_program = convert_program(json.loads(program))

    
    '''
    dir_path = os.path.dirname(os.path.realpath(__file__))[:-12]

    program_file_paths = glob(dir_path + "/data/programs/*.json")

    programs = []

    for file_path in program_file_paths:
        with open(file_path, 'r') as program_file:
            programs.append(convert_program(json.load(program_file)))
    '''

    while t < time.time():

        print('\033[92m' + f' Start Sim (at time {t}) '.center(110, '-') + '\033[0m')

        print()
        print('\033[93m' + '\033[1m' + f'Program: {test_program['name']} '.ljust(110, '-') + '\033[0m')
        print()
        compute_program(test_program, t)
        print()

        t = t + 100

if __name__ == '__main__':
    sim_policy('''
{
    "Policy Name" : "example",
    "Data Sources" : ["Cloud_Serves_1", "Cloud_Serves_2"],
    "Nodes" : [
        {
            "Index": 0,
            "Type" : "Input",
            "Position" : [100, 100],
            "Input Channel" : "Usage",
            "Input Provider" : "Cloud_Serves_1"
        }, {
            "Index": 1,
            "Type" : "Input",
            "Position" : [100, 200],
            "Input Channel" : "Usage",
            "Input Provider" : "Cloud_Serves_2"
        }, {
            "Index": 2,
            "Type" : "Greater Than",
            "Position" : [200, 100]
        }, {
            "Index": 3,
            "Type" : "Greater Than",
            "Position" : [200, 200]
        }, {
            "Index": 4,
            "Type" : "Ticket",
            "Position" : [300, 100],
            "Receiver" : "example.email@calero.com",
            "Description" : "example 1"
        }, {
            "Index": 5,
            "Type" : "Ticket",
            "Position" : [300, 200],
            "Receiver" : "example.email@calero.com",
            "Description" : "example 2"
        }
    ],
    "Connections" : [
        [0, 2],
        [1, 2],
        [1, 3],
        [0, 3],
        [2, 4],
        [3, 5]
    ]
}
''')