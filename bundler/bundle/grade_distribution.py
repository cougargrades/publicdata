import csv
from pathlib import Path
from alive_progress import alive_bar

'''
Combines all CSV data for this dataset into
a single records.csv file
'''
def process(source: Path, destination: Path):
  # print(source.name)
  destination.mkdir(exist_ok=True)
  with alive_bar() as bar:
    with open(destination / 'records.csv', 'w') as export:
      # declare writer
      writer = csv.writer(export)
      # get first file in source
      first_file = [f for f in source.iterdir() if f.match('*.csv')][0]
      # write the header row
      with open(first_file, 'r') as f:
        reader = csv.reader(f)
        for row in reader:
          # ONLY write the first row (header row)
          writer.writerow(row)
          break
      # write the other rows
      for csvfile in source.iterdir():
        if(csvfile.match('*.csv')):
          with open(csvfile, 'r') as f:
            reader = csv.reader(f)
            # skip the first row (header)
            next(reader)
            for row in reader:
              writer.writerow(row)
              bar()
