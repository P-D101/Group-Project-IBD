from compute_program import compute_program
from pass_program import convert_program
import time
import os
import json
from glob import glob
import copy

if __name__ == "__main__":

    dir_path = os.path.dirname(os.path.realpath(__file__))[:-12]
    program_file_paths = glob(dir_path + "/data/programs/*.json")

    programs = []
    running_programs = []

    for file_path in program_file_paths:
        with open(file_path, 'r') as program_file:
            programs.append(convert_program(json.load(program_file)))


    while True:

        print('\033[92m' + ' Start Execute '.center(110, '-') + '\033[0m')

        new_program_file_paths = glob(dir_path + "/data/new-programs/*.json")
        
        for file_path in new_program_file_paths:

            file_name = file_path.split('/')[-1]

            with open(file_path, 'r') as program_file:
                programs.append(convert_program(json.load(program_file)))
            
            os.rename(file_path, dir_path + "/data/programs/" + file_name)

        remove_program_file_paths = glob(dir_path + "/data/remove-programs/*.json")

        for file_path in remove_program_file_paths:

            file_name = file_path.split('/')[-1]

            with open(file_path, 'r') as remove_file:
                remove_object = json.load(remove_file)
                for program in programs:
                    if program["name"] == remove_object["Policy Name"]:
                        programs.remove(program)

            os.remove(file_path)
            os.remove(dir_path + "/data/programs/" + file_name)

        running_programs = programs.copy()

        disable_program_file_paths = glob(dir_path + "/data/disable-programs/*.json")
        
        for file_path in disable_program_file_paths:

            file_name = file_path.split('/')[-1]
            
            with open(file_path, 'r') as remove_file:
                disable_object = json.load(remove_file)
                for program in programs:
                    if program["name"] == disable_object["Policy Name"]:
                        running_programs.remove(program)
        
        for program in running_programs:
            print()
            print('\033[93m' + '\033[1m' + f'Program: {program['name']} '.ljust(110, '-') + '\033[0m')
            print()
            compute_program(program)
            print()

        print('\033[96m' + ' End Execute '.center(110, '-') + '\033[0m')
        print()

        time.sleep(10)