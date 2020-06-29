import csv
from bundle import util
from pathlib import Path
from alive_progress import alive_bar



'''
Iterates over records.csv to pair 
'catoid' and 'coid' values with their
corresponding 'department' and 'catalogNumber' pairs
'''
def process(source: Path, destination: Path):
  # prepares destination
  destination.mkdir(exist_ok=True)

  KNOWN_COURSES = set()

  # iterates over records.csv
  with open(destination / '..' / 'edu.uh.grade_distribution' / 'records.csv') as infile:
    reader = csv.DictReader(infile)
    for row in reader:
      KNOWN_COURSES.add(f'{row["SUBJECT"].strip()} {row["CATALOG NBR"].strip()}')
  
  # create the output file
  with open(destination / 'pairs.csv', 'w') as outfile:
    writer = csv.DictWriter(outfile, ['catoid', 'coid', 'department', 'catalogNumber'])
    # for every catalog's index.csv file
    for p in source.glob('**/index.csv'):
      with alive_bar(util.file_len(p)) as bar:
        with open(p, 'r') as infile:
          reader = csv.DictReader(infile)
          # for every row in this index.csv file
          for row in reader:
            # check if there's a match
            for course in KNOWN_COURSES:
              if course.lower().strip() in row["course_title"].lower().strip():
                writer.writerow({
                  "catoid": row["catoid"],
                  "coid": row["coid"],
                  "department": course.split(' ')[0],
                  "catalogNumber": course.split(' ')[1]
                })
            bar()
