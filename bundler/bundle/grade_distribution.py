import os
import csv
import json
from pathlib import Path
from typing import Dict, List, Set
from alive_progress import alive_bar

'''
Combines all CSV data for this dataset into
a single records.csv file
'''
def process(source: Path, destination: Path, csv_path_pattern: str = '*.csv'):
  csv_path_pattern = '*.csv' if csv_path_pattern == None else csv_path_pattern
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
          if(csvfile.match(csv_path_pattern, case_sensitive=False) and not csvfile.match('master.csv')):
            print(f'Bundling matched CSV file: {csvfile.name}')
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
  print('Sorting records...')
  sortedlist = []
  with open(destination / 'records.csv', 'r') as records:
    reader = csv.DictReader(records)
    sortedlist = sorted(reader, key=lambda row: row['TERM'], reverse=False)
  with open(destination / 'records.csv', 'w') as export:
    with open(source / 'master.csv', 'r') as masterFile:
      # declare writer
      master = csv.DictReader(masterFile)
      writer = csv.DictWriter(export, master.fieldnames)
      # write the header row
      writer.writeheader()
      writer.writerows(sortedlist)
  print('Done')
  print('Splitting records...')
  split_csv(source_filepath=(destination / 'records.csv').absolute(), dest_folder=destination.absolute(), split_file_prefix='records_split', records_per_file=15000)
  print('Done')
  print('Generating count data...')
  with open(destination / 'records.csv', 'r') as records:
    with open(destination / 'counts.json', 'w') as metaFile:
        reader = csv.DictReader(records)
        rows = [row for row in reader]
        meta = dict()
        meta["num_terms"] = count_distinct_by_keys(rows,keys=['TERM']) # should be 25
        meta["num_courses"] = count_distinct_by_keys(rows,keys=['SUBJECT', 'CATALOG NBR'])
        meta["num_instructors"] = count_distinct_by_keys(rows,keys=['INSTR LAST NAME', 'INSTR FIRST NAME'])
        meta["num_subjects"] = count_distinct_by_keys(rows,keys=['SUBJECT'])
        meta["num_sections"] = count_distinct_by_keys(rows,keys=['TERM', 'SUBJECT', 'CATALOG NBR', 'CLASS SECTION'])
        metaFile.write(json.dumps(meta, indent=2))
  print('Generating all_courses data...')
  with open(destination / 'records.csv', 'r') as records:
    with open(destination / 'all_courses.json', 'w') as metaFile:
        reader = csv.DictReader(records)
        rows = [row for row in reader]
        # ID based on:
        # https://github.com/cougargrades/types/blob/bcf4d9b075b3b4b09d14bcf5641a31b947bc3c87/src/GradeDistributionCSVRow.ts#L43-L60
        meta = sorted(list(set([ f'{row["SUBJECT"]} {row["CATALOG NBR"]}' for row in rows ])))
        metaFile.write(json.dumps(meta, indent=2))
  print('Generating all_instructors data...')
  with open(destination / 'records.csv', 'r') as records:
    with open(destination / 'all_instructors.json', 'w') as metaFile:
        reader = csv.DictReader(records)
        rows = [row for row in reader]
        # ID based on:
        # https://github.com/cougargrades/types/blob/bcf4d9b075b3b4b09d14bcf5641a31b947bc3c87/src/GradeDistributionCSVRow.ts#L43-L60
        meta = sorted(list(set([ f'{row["INSTR LAST NAME"].strip()}, {row["INSTR FIRST NAME"].strip()}'.lower() for row in rows ])))
        metaFile.write(json.dumps(meta, indent=2))
  print(f'Generating search-optimized data: instructors.json')
  searchable_destination = destination / '..' / 'io.cougargrades.searchable'
  searchable_destination.mkdir(exist_ok=True)
  with open(searchable_destination / 'instructors.json', 'w') as metaFile, open(destination / 'records.csv', 'r') as records:
    rows = [row for row in csv.DictReader(records)]    
    # here we use a dictionary because it's an easy way to ensure that duplicates don't get added by some arbitrary check
    results = dict()
    # iterate over all rows
    for row in rows:
      # extract some basic fields from the instructor
      firstName = row["INSTR FIRST NAME"].strip()
      lastName = row["INSTR LAST NAME"].strip()
      legalName = f'{lastName}, {firstName}'
      key_href = f'/i/{lastName}, {firstName}'.lower()

      # set the item result if the key is unique
      if key_href not in results:
        results[key_href] = {
          "href": key_href,
          "firstName": firstName,
          "lastName": lastName,
          "legalName": legalName,
        }
    
    # now that we've built a hashmap/dict of the results, we just want to dump the output as an array
    metaFile.write(json.dumps({ "data": list(results.values()) }, indent=2))
  print('Done')

def count_distinct_by_keys(rows: List[Dict], keys: List[str]) -> int:
  selection = set()
  for row in rows:
    selection.add(tuple([(f'{row[k]}'.lower() if type(row[k]) == str else row[k]) for k in keys]))
  return len(selection)

def split_csv(source_filepath, dest_folder, split_file_prefix, records_per_file):
    """
    Split a source csv into multiple csvs of equal numbers of records,
    except the last file.
    Includes the initial header row in each split file.
    Split files follow a zero-index sequential naming convention like so:
      `{split_file_prefix}_0.csv`
    From: https://stackoverflow.com/a/49452109
    """
    if records_per_file <= 0:
      raise Exception('records_per_file must be > 0')

    with open(source_filepath, 'r') as source:
      reader = csv.reader(source)
      headers = next(reader)
      file_idx = 0
      records_exist = True
      while records_exist:
        i = 0
        target_filename = f'{split_file_prefix}_{file_idx}.csv'
        target_filepath = os.path.join(dest_folder, target_filename)
        with open(target_filepath, 'w') as target:
            writer = csv.writer(target)
            while i < records_per_file:
              if i == 0:
                writer.writerow(headers)
              try:
                writer.writerow(next(reader))
                i += 1
              except StopIteration:
                records_exist = False
                break
        if i == 0:
          # we only wrote the header, so delete that file
          os.remove(target_filepath)
        file_idx += 1
