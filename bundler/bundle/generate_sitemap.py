import csv
import json
import urllib.parse
from pathlib import Path
from alive_progress import alive_bar
from colorama import init
init()
from colorama import Fore, Back, Style



'''
Iterates over records.csv to pair 
'catoid' and 'coid' values with their
corresponding 'department' and 'catalogNumber' pairs
'''
def process(destination: Path):
  # prepares destination
  destination.mkdir(exist_ok=True)

  KNOWN_COURSES = set()
  KNOWN_INSTRUCTORS = set()
  KNOWN_GROUPS = set()

  print('\tLoading known courses + instructors + groups...')
  # iterates over records.csv
  with open(destination / '..' / 'edu.uh.grade_distribution' / 'records.csv') as infile:
    reader = csv.DictReader(infile)
    for row in reader:
      KNOWN_COURSES.add(f'{row["SUBJECT"].strip()} {row["CATALOG NBR"].strip()}')
      # Per https://github.com/cougargrades/web/issues/128, instructor names should be lowercase
      KNOWN_INSTRUCTORS.add(f'{row["INSTR LAST NAME"].strip()}, {row["INSTR FIRST NAME"].strip()}'.lower())
  with open(destination / '..' / 'io.cougargrades.groups' / 'defaults.json') as infile:
    defaults = list(json.load(infile))
    for item in [item['identifier'] for item in defaults]:
      KNOWN_GROUPS.add(item)
  with open(destination / '..' / 'edu.uh.publications.subjects' / 'subjects.json') as infile:
    subjects = dict(json.load(infile))
    for item in subjects.keys():
      KNOWN_GROUPS.add(item)
  print('\tDone')
  
  # create the output file
  with open(destination / 'sitemap.txt', 'w') as outfile:
    # write basic stuff
    # outfile.write('https://cougargrades.io/\n')
    # outfile.write('https://cougargrades.io/about\n')
    # outfile.write('https://cougargrades.io/faq\n')
    outfile.write('''https://cougargrades.io/
https://cougargrades.io/about
https://cougargrades.io/faq
https://cougargrades.io/faq/data-accuracy
https://cougargrades.io/faq/data-authenticity
https://cougargrades.io/faq/data-updates
https://cougargrades.io/faq/github-sponsors
https://cougargrades.io/faq/instructor-shaming
https://cougargrades.io/faq/interim-grading-theory
https://cougargrades.io/faq/uh-affiliation
https://cougargrades.io/top/enrolled-courses
https://cougargrades.io/top/enrolled-instructors
https://cougargrades.io/top/viewed-courses
https://cougargrades.io/top/viewed-instructors
''')
    print('Writing groups...')
    with alive_bar(len(KNOWN_GROUPS)) as bar:
      for item in sorted(list(KNOWN_GROUPS)):
        outfile.write(f'https://cougargrades.io/g/{urllib.parse.quote(item)}\n')
        bar()
    print('Writing instructors...')
    with alive_bar(len(KNOWN_INSTRUCTORS)) as bar:
      for item in sorted(list(KNOWN_INSTRUCTORS)):
        outfile.write(f'https://cougargrades.io/i/{urllib.parse.quote(item)}\n')
        bar()
    print('Writing courses...')
    with alive_bar(len(KNOWN_COURSES)) as bar:
      for item in sorted(list(KNOWN_COURSES)):
        outfile.write(f'https://cougargrades.io/c/{urllib.parse.quote(item)}\n')
        bar()
