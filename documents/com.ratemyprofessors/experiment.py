import csv
from typing import Callable, Tuple
from alive_progress import alive_bar

func: Callable[[str, str], int] = lambda var1, var2: var1.index(var2)

def run_experiment(title: str, func: Callable[[str, str], Tuple[int, str, str]]):
  print(f'{title} starting...')
  total_names = 0
  total_matches = 0
  with open('master.csv', 'r') as masterFile:
    with open('records.csv') as infile:
      with open(f'{title}.csv', 'w') as outfile:
        master = csv.DictReader(masterFile)
        reader = csv.DictReader(infile)
        writer = csv.DictWriter(outfile, fieldnames=master.fieldnames)
        writer.writeheader()
      
        sortedlist = sorted(reader, key=lambda row: len(f'{row["INSTR FIRST NAME"]} {row["INSTR LAST NAME"]}'), reverse=True)

        names = set()

        for row in sortedlist:
          fullName = f'{row["INSTR FIRST NAME"]} {row["INSTR LAST NAME"]}'
          if len(fullName.split(' ')) > 2 and fullName not in names:
            names.add((row["INSTR FIRST NAME"], row["INSTR LAST NAME"]))
        
        total_names = len(names)
        
        with alive_bar(total_names) as bar:
          for item in names:
            firstName, lastName = item
            rmpId, rmpFirstName, rmpLastName = func(firstName, lastName)
            row = {
              "sourceFirstName": firstName,
              "sourceLastName": lastName,
              "rmpId": rmpId,
              "rmpFirstName": rmpFirstName,
              "rmpLastName": rmpLastName,
            }
            if rmpId != None:
              total_matches += 1
            writer.writerow(row)
            bar()
  print(f'{title} completed with a {round(total_matches/total_names*100, 2)}% success rate ({total_matches} of {total_names})')
  print(f'------------------------')
    
    