from compute_program import compute_program
from pass_program import convert_program
import time
import os
import json
from glob import glob

if __name__ == "__main__":

    dir_path = os.path.dirname(os.path.realpath(__file__))[:-12]
    program_file_paths = glob(dir_path + "/data/programs/*.json")

    programs = []

    for file_path in program_file_paths:
        with open(file_path, 'r') as program_file:
            programs.append(convert_program(json.load(program_file)))


    while True:

        new_program_file_paths = glob(dir_path + "/data/new-programs/*.json")
        
        for file_path in new_program_file_paths:

            print(file_path)

            with open(file_path, 'r') as program_file:
                programs.append(convert_program(json.load(program_file)))
            
            os.rename(file_path, dir_path + "/data/programs/" + file_path[137:])

        for program in programs:
            compute_program(program)

        remove_program_file_paths = glob(dir_path + "/data/remove-programs/*.json")

        time.sleep(10)