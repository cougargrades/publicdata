#!/usr/bin/env python3
import csv
import requests
from urllib.parse import urlparse, parse_qs
from time import sleep
from bs4 import BeautifulSoup
import analyze

# http://publications.uh.edu/ajax/preview_page.php?catoid=36&id=13126&show
# h2
# document.querySelectorAll('h2 ~ ul li a:not(h4 ~ ul li a)')

'''
10 => Communication
20 => Mathematics
30 => Life & Physical Sciences
40 => Language, Philosophy, & Culture
50 => Creative Arts
60 => American History
70 => Government/Political Science
80 => Social & Behavioral Sciences
81 => Writing in the Disciplines
91 => Math/Reasoning
'''


# ids[catoid]["core"][coreCode][api_core_id]
records = {
  # 2024-2025 Undergraduate
  52: {
    # https://publications.uh.edu/content.php?catoid=52&navoid=20440
    "root_navoid": 20440,
    "core": {
      10: 69061, # Communication 010 (6 credit hours) 
      20: 69062, # Mathematics 020 (3 credit hours)
      30: 69063, # Life & Physical Sciences 030 (6 credit hours)
      40: 69064, # Language, Philosophy, and Culture 040 (3 credit hours)
      50: 69065, # Creative Arts 050 (3 credit hours) 
      60: 69066, # American History 060 (6 credit hours)
      70: 69067, # Government/Political Science 070 (6 credit hours)
      80: 69068, # Social and Behavioral Sciences 080 (3 credit hours)
      81: 69070, # Component Area Option 090 (B): Writing in the Disciplines UH 081 (3 credit hours)
      91: 69069, # Component Area Option 090 (A): Mathematics/Reasoning (3 credit hours)
    }
  },

}

'''

{
  "department": "ENGL", -> comes from course title
  "catalogNumber": "2361", -> comes from course title
  "description": "Western World Literature II - Honors", -> comes from course title
  "catoid": "36", -> comes from catalog
  "coid": "171276", -> comes from course 
  "coreCode": "10", -> decided by the programmer (see above)
  "coreArea": "Communication", -> comes from core (this is not used in the website)
  "groupNavoid": "13121", -> comes from original page (root_navoid)
  "groupTitle": "2020-2021 Undergraduate Catalog" -> comes from catalog
},

'''

with open('../core_curriculum_old.csv', 'r') as legacyFile:
  # newline is needed, see: https://stackoverflow.com/a/3348664/4852536
  with open('../core_curriculum.csv', 'w', newline='') as export:
    with open('../master.csv', 'r') as masterFile:
      # declare writer
      master = csv.DictReader(masterFile)
      writer = csv.DictWriter(export, master.fieldnames)

      # write the header row
      writer.writeheader()

      # used for de-duping
      entries = set()

      print(f'--- (Legacy scrape data) ---')
      # write legacy data into the output
      for item in csv.DictReader(legacyFile):
        writer.writerow(item)
      
      # iterate over catoids
      for catoid in records.keys():

        # get catalog information
        shallow_catalog = analyze.get_catalog(legacy_catalog_id=catoid)
        catalog_id = shallow_catalog["id"]
        catalogName = shallow_catalog["name"]
        groupNavoid = records[catoid]["root_navoid"]

        print(f'--- \'{catalogName}\' ---')

        # iterate over coreCodes
        for coreCode in records[catoid]["core"].keys():
          core_id = records[catoid]["core"][coreCode]
          # fetch data for a `core`
          deep_core = analyze.get_core(catalog_id=catalog_id, core_id=core_id)
          core_courses = analyze.get_core_courses(catalog_id=catalog_id, core_id=core_id)
          coreArea = deep_core["name"]

          # iterate over courses
          for course in core_courses:
            result = dict.fromkeys(master.fieldnames)
            # catoid,coreCode,coreArea
            result['catoid'] = catoid
            result['coreCode'] = coreCode
            result['coreArea'] = coreArea.strip()

            #course["title"] ==> "HIST 1301 -  The U.S. to 1877"

            # department,catalogNumber,description,
            anchorText = course["title"].strip()
            courseName = anchorText[:anchorText.index('-')].strip()
            description = anchorText[anchorText.index('-')+1:].strip()
            result['description'] = description.strip()
            department, catalogNumber = courseName.strip().split(' ')
            result['department'] = department.strip()
            result['catalogNumber'] = catalogNumber.strip()

            result['coid'] = course["legacy-id"]
            result['groupNavoid'] = groupNavoid
            result['groupTitle'] = catalogName.strip()

            # used for de-duping (https://stackoverflow.com/a/12851143/4852536)
            # we don't care if a course with the same name appears in multiple catalogs
            key = (result['department'], result['catalogNumber'], coreCode, groupNavoid)
            if key not in entries:
              writer.writerow(result)
              entries.add(key)
          
          print(f'[{catoid}] {coreArea} done')
