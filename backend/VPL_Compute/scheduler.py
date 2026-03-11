from .compute_program import compute_program
from .pass_program import convert_program
import time
import os
import json
from glob import glob
import copy

dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))

def load_programs(folder_name):
    os.makedirs(os.path.join(dir_path, "data", folder_name), exist_ok=True)

    program_file_paths = glob(os.path.join(dir_path, "data", folder_name, "*.json"))

    programs = []

    for file_path in program_file_paths:
        with open(file_path, 'r') as program_file:
            try:
                prog = convert_program(json.load(program_file))
                programs.append(prog)
            except Exception as e:
                print(f"Error in program {file_path}: {e}")
    
    return programs



if __name__ == "__main__":
    programs = load_programs("programs")
    running_programs = []
    
    while True:

        print('\033[92m' + ' Start Execute '.center(110, '-') + '\033[0m')
        
        remove_program_file_paths = glob(os.path.join(dir_path, "data", "remove-programs", "*.json"))
        for file_path in remove_program_file_paths:
            # get the filename from the path using os
            file_name = os.path.basename(file_path)

            with open(file_path, 'r') as remove_file:
                remove_object = json.load(remove_file)
                for program in programs:
                    if program["name"] == remove_object["Policy Name"]:
                        programs.remove(program)

            os.remove(file_path)
            print(os.path.join(dir_path, "data", "programs", file_name))
            os.remove(os.path.join(dir_path, "data", "programs", file_name))

        new_programs = load_programs("new-programs")
        programs.extend(new_programs)
        # move all programs from new-programs to programs
        for file_path in glob(os.path.join(dir_path, "data", "new-programs", "*.json")):
            file_name = os.path.basename(file_path)
            os.rename(file_path, os.path.join(dir_path, "data", "programs", file_name))
            

        running_programs = programs.copy()

        disable_program_file_paths = glob(os.path.join(dir_path, "data", "disable-programs", "*.json"))
        
        for file_path in disable_program_file_paths:
            file_name = os.path.basename(file_path)
            with open(file_path, 'r') as remove_file:
                disable_object = json.load(remove_file)
                for program in programs:
                    if program["name"] == disable_object["Policy Name"]:
                        running_programs.remove(program)
        
        for program in running_programs:
            print('\n\033[93m' + '\033[1m' + f'Program: {program['name']} '.ljust(110, '-') + '\033[0m\n')
            compute_program(program)
            print()

        print('\033[96m' + ' End Execute '.center(110, '-') + '\033[0m\n')

        time.sleep(10)