import os
#### This file is for simulating what would have happened in the last week if a given policy was added

import time
from .compute_program import compute_program
from .pass_program import convert_program
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
    dir_path = os.path.dirname(os.path.realpath(__file__))
    
    with open(dir_path[:-12] + '/data/programs/policy_77526dac-d0e6-473a-8abc-03aac309de74.json', 'r') as example_file:
        example_program = json.load(example_file)

    sim_policy(json.dumps(example_program))