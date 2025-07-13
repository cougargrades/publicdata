#!/usr/bin/env python3
import os
import json
from urllib.parse import urlparse, parse_qs
from time import sleep
from bs4 import BeautifulSoup
import urllib3
urllib3.disable_warnings()
from colorama import init
init()
from colorama import Fore, Back, Style
import acalog # From: `../../_common/`

# records[catoid][navoid]
records = [
  [36, 13221], # 2020-2021 Undergraduate
  [37, 13813], # 2020-2021 Graduate,
  [41, 14820], # 2021-2022 Undergraduate,
  [40, 14406], # 2021-2022 Graduate
  [44, 15983], # 2022-2023 Undergraduate
  [45, 16595],  # 2022-2023 Graduate
  [52, 19813], # 2024-2025 Undergraduate
  [53, 20423]  # 2024-2025 Graduate
]

RESULT = dict()
# resume our progress between runs
# with open('../subjects.json', 'r') as f:
#   RESULT = json.loads(f.read())

with open('../subjects.json', 'w') as export:
  for i in range(0, len(records)):
    catoid, navoid = records[i]
    print(f'Starting: https://publications.uh.edu/content.php?catoid={catoid}')

    # Map catoid -> catalog_id
    shallow_catalog = acalog.get_catalog(legacy_catalog_id=catoid)
    catalog_id = shallow_catalog["id"]

    # Iterate over all courses
    for (shallow_course, j, n) in acalog.get_courses(catalog_id=catalog_id):
      if j % 10 == 0:
        print(f'--- Catalog {i+1} of {len(records)} / Course {j} of {n} ---')
      #deep_course = acalog.get_course(catalog_id=catalog_id, course_id=shallow_course["id"])
      # shallow_course["title"] => "AAMS 2300 -  Introduction to Asian American Studies"
      # "AAMS"
      #prefix = deep_course["prefix"]
      prefix, *_ = shallow_course["title"].strip().split(' ')
      print(f'{Fore.LIGHTBLACK_EX}- {shallow_course["title"]}{Style.RESET_ALL}')

      if len(shallow_course["course_types"]) > 0 and "name" in shallow_course["course_types"][0]:
        # "Asian American Studies"
        subject_description = shallow_course["course_types"][0]["name"]
        # if this is a new prefix, or a change in verbiage
        if prefix not in RESULT:
          print(f'{Fore.GREEN}[+] {prefix} => {subject_description}{Style.RESET_ALL}')
        elif RESULT[prefix] != subject_description:
          print(f'{Fore.CYAN}[~] {prefix} => {subject_description}{Style.RESET_ALL}')
        RESULT[prefix] = subject_description
        
      
      # ensure writing to disk between pages
      export.seek(0)
      export.write(json.dumps(RESULT, indent=2, sort_keys=True))
      export.truncate()
      export.flush()
      os.fsync(export.fileno())
