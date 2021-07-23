import csv
from pathlib import Path
from alive_progress import alive_bar

'''
Combines all CSV data for this dataset into
a single records.csv file
'''
def process(source: Path, destination: Path):
  destination.mkdir(exist_ok=True)
  with alive_bar() as bar:
    with open(destination / 'records.csv', 'w') as export:
      with open(source / 'master.csv', 'r') as masterFile:
        # declare writer
        master = csv.DictReader(masterFile)
        writer = csv.DictWriter(export, master.fieldnames)
        # write the header row
        writer.writeheader()

        # write the other rows
        for csvfile in source.iterdir():
          if(csvfile.match('*.csv') and not csvfile.match('master.csv')):
            with open(csvfile, 'r') as f:
              reader = csv.DictReader(f)
              # DictReader already skips the header row
              # iterate over every row
              for row in reader:
                # create an object where we will copy the row data from
                # (all values default to None)
                result = dict.fromkeys(master.fieldnames)
                # iterate over all the allowed fields
                for field in master.fieldnames:
                  # only grab the fields that the master has, otherwise fallback on some values
                  if(field in row):
                    # fix weird spacing issue for courses with alphabet characters in CATALOG_NBR
                    if(field == 'CATALOG NBR' and row[field] != None and row[field] != row[field].strip()):
                      result[field] = row[field].strip()
                    else:
                      result[field] = row[field]
                  # if this is a numeric value that we can zero out
                  elif(field in ['A','B','C','D','F','SATISFACTORY','NOT REPORTED','TOTAL DROPPED']):
                    result[field] = 0
                writer.writerow(result)
                bar()
