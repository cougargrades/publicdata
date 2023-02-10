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
  # with open(destination / 'pairs.csv', 'w') as outfile:
  #   writer = csv.DictWriter(outfile, ['catoid', 'coid', 'classification', 'department', 'catalogNumber', 'title'])
  #   writer.writeheader()
  #   for p in source.glob('*.csv'):
  #     print(f'\t{Style.DIM}{Path(p).name}{Style.RESET_ALL}')
  #     with alive_bar(util.file_len(p)-1) as bar:
  #       with open(p, 'r') as infile:
  #         reader = csv.DictReader(infile)
  #         # for every row in this index.csv file
  #         for row in reader:
  #           # check if there's a match
  #           for course in KNOWN_COURSES:
  #             if course.lower().strip() in row["course_title"].lower().strip():
  #               writer.writerow({
  #                 "catoid": row["catoid"],
  #                 "coid": row["coid"],
  #                 "classification": row["classification"],
  #                 "department": course.split(' ')[0],
  #                 "catalogNumber": course.split(' ')[1],
  #                 "title": row["catalog_title"]
  #               })
  #           bar()
  
  # TODO: create searchable courses
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
          #break # TODO: maybe remove this if it proves useful
          with open(source / matched_pair["catoid"] / f'{matched_pair["catoid"]}-{matched_pair["coid"]}.html') as htmlFile:
            # get primary content area
            html = BeautifulSoup(htmlFile.read(), features='html5lib')
            # compute content
            h3 = html.select_one('.coursepadding div h3')
            for strong in html.select('strong'):
              # print(list(strong.contents))
              # print(list(strong.contents)[:1])
              # print(str(list(strong.contents)[:1]).strip())
              #print(f'\"{strong.text}\"')
              if strong.text.strip() == 'Description':
                #print(f'strong found! {htmlFile.name}')
                #print('\tsibs: ', strong.next_siblings)
                afterElems = []
                for sib in strong.next_siblings:
                  if sib.name == 'strong':
                    break
                  else:
                    afterElems.append(sib)
                content = ''.join([ str(item) for item in afterElems ]).strip()
                textContent = ' '.join(BeautifulSoup(content, features='html5lib').find_all(text=True, recursive=True)).strip()
                textContent2 = textContent.split('\n')[0] if textContent.find('\n') >= 0 else textContent
                #print(f'\t\"{textContent2}\"')
                search_result_item["publicationTextContent"] = textContent
                break
                # for i in range(0, len(afterElems)):
                #   afterElems[i].name ==
                # print('strong found!')
                # print('sibs: ', list(strong.next_siblings)[:2])
            
            if search_result_item["publicationTextContent"] != "":
              print(f'no description found? {matched_pair["department"]} {matched_pair["catalogNumber"]} -> {os.path.basename(htmlFile.name)}')
            # afterElems = []
            # for item in h3.next_siblings:
            #   # change URLs that point to other courses to a CougarGrades URL
            #   if item.name == 'a' and item['href'] != None and item['href'].startswith('preview_course_nopop.php'):
            #     item.attrs.clear()
            #     item['href'] = quote(f'/c/{item.string.strip()}')
            #   # skip spammy tooltip divs
            #   if item.name != None and item.name != '' and item.has_attr('style') and item['style'] != None and 'display:none' in "".join(item['style'].split()).lower():
            #     continue
            #   # replace the <hr /> with <br />
            #   if item.name == 'hr':
            #     item.name = 'br'
            #   # add to list
            #   afterElems += [ item ]

            # # convert elements to a single single
            # content = ''.join([ str(item) for item in afterElems ]).strip()
            # innerHtml = BeautifulSoup(content, features='html5lib')
            # innerTextContent = ' '.join(innerHtml.find_all(text=True, recursive=True)).strip()
            # search_result_item["publicationTextContent"] += innerTextContent
          if search_result_item["publicationTextContent"] != "":
            break
        results.append(search_result_item)
        bar()
    
    # write the results to a file
    outfile.write(json.dumps({ "data": results }, indent=2))


    # with alive_bar(len(KNOWN_COURSES)) as bar:
    #   for courseName in KNOWN_COURSES:
        
      # Output structure
    sample = {
      "href": "/c/AAMS 2300",
      "courseName": "AAMS 2300",
      "description": "Intro Asian American Studies",
      "publicationTextContent": "",
    }

    # TODO: write the data
    #outfile.write(json.dumps([], indent=2))
  
  # sort output file
  sortedlist = []
  with open(destination / 'pairs.csv', 'r') as infile:
    reader = csv.DictReader(infile)
    sortedlist = sorted(reader, key=lambda row: (row['catoid'], row['coid']), reverse=False)
  with open(destination / 'pairs.csv', 'w') as outfile:
    writer = csv.DictWriter(outfile, ['catoid', 'coid', 'classification', 'department', 'catalogNumber', 'title'])
    writer.writeheader()
    writer.writerows(sortedlist)
