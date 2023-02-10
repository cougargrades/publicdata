import os
import csv
import json
from bundle import util
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import quote
from alive_progress import alive_bar
from colorama import init
init()
from colorama import Fore, Back, Style



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
    writer = csv.DictWriter(outfile, ['catoid', 'coid', 'classification', 'department', 'catalogNumber', 'title'])
    writer.writeheader()
    for p in source.glob('*.csv'):
      print(f'\t{Style.DIM}{Path(p).name}{Style.RESET_ALL}')
      with alive_bar(util.file_len(p)-1) as bar:
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
                  "classification": row["classification"],
                  "department": course.split(' ')[0],
                  "catalogNumber": course.split(' ')[1],
                  "title": row["catalog_title"]
                })
            bar()
  
  # create searchable courses
  print(f'\t{Style.DIM}Generating search-optimized data: courses.json{Style.RESET_ALL}')
  searchable_destination = destination / '..' / 'io.cougargrades.searchable'
  searchable_destination.mkdir(exist_ok=True)
  with open(searchable_destination / 'courses.json', 'w') as outfile, open(destination / 'pairs.csv', 'r') as pairs_file, open(destination / '..' / 'edu.uh.grade_distribution' / 'records.csv') as records_file:
    pairs = sorted([row for row in csv.DictReader(pairs_file)], key=lambda d: d["catoid"], reverse=True)
    records = [row for row in csv.DictReader(records_file)]
    
    unique_courses_with_descriptions = sorted(list(set([(
      f'{row["SUBJECT"].strip()} {row["CATALOG NBR"].strip()}',
      row["COURSE DESCR"]
    ) for row in records])))

    results = []
    missing_desc_counter = 0
    with alive_bar(len(unique_courses_with_descriptions)) as bar:
      for (courseName, description) in unique_courses_with_descriptions:
        search_result_item = {
          "href": f'/c/{courseName}',
          "courseName": courseName,
          "description": description,
          "publicationTextContent": ""
        }
        matching_pairs = [pair for pair in pairs if f'{pair["department"]} {pair["catalogNumber"]}' == courseName][:1]
        for matched_pair in matching_pairs:
          with open(source / matched_pair["catoid"] / f'{matched_pair["catoid"]}-{matched_pair["coid"]}.html') as htmlFile:
            # debug info
            course_and_file = f'{matched_pair["department"]} {matched_pair["catalogNumber"]} -> {os.path.basename(htmlFile.name)}'
            # get primary content area
            html = BeautifulSoup(htmlFile.read(), features='html5lib')
            # compute content
            h3 = html.select_one('.coursepadding div h3')
            for strong in html.select('strong'):
              if strong.text.strip() == 'Description':
                #print(f'strong found! {course_and_file}')
                afterElems = []
                content = ''.join([ str(item) for item in strong.next_siblings if item.name is None])
                textContent = content.strip().split('\n')[0] if content.strip().find('\n') >= 0 else content.strip()
                #print(f'\t\"{textContent}\"')
                search_result_item["publicationTextContent"] = textContent
                break
            if search_result_item["publicationTextContent"] == "":
              #print(f'no description found? {course_and_file}')
              missing_desc_counter += 1
          if search_result_item["publicationTextContent"] != "":
            break
        results.append(search_result_item)
        bar()
    
    # write the results to a file
    outfile.write(json.dumps({ "data": results }, indent=2))
    print(f'Percentage of missing descriptions: {missing_desc_counter / len(unique_courses_with_descriptions) * 100}%')
  
  # sort output file
  sortedlist = []
  with open(destination / 'pairs.csv', 'r') as infile:
    reader = csv.DictReader(infile)
    sortedlist = sorted(reader, key=lambda row: (row['catoid'], row['coid']), reverse=False)
  with open(destination / 'pairs.csv', 'w') as outfile:
    writer = csv.DictWriter(outfile, ['catoid', 'coid', 'classification', 'department', 'catalogNumber', 'title'])
    writer.writeheader()
    writer.writerows(sortedlist)
