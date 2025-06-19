#!/usr/bin/env python3
import os
import json
import requests
from urllib.parse import urlparse, parse_qs
from time import sleep
from bs4 import BeautifulSoup
import urllib3
urllib3.disable_warnings()

# records[catoid][navoid]
records = [
  # [36, 13221], # 2020-2021 Undergraduate
  # [37, 13813], # 2020-2021 Graduate,
  # [41, 14820], # 2021-2022 Undergraduate,
  # [40, 14406], # 2021-2022 Graduate
  # [44, 15983], # 2022-2023 Undergraduate
  # [45, 16595],  # 2022-2023 Graduate
  [52, 19813], # 2024-2025 Undergraduate
  [53, 20423]  # 2024-2025 Graduate
]

RESULT = dict()
# resume our progress between runs
with open('../subjects.json', 'r') as f:
  RESULT = json.loads(f.read())

with open('../subjects.json', 'w') as export:
  for j in range(0, len(records)):
    pair = records[j]
    catoid, navoid = pair
    print(f'Starting: https://publications.uh.edu/content.php?catoid={catoid}&navoid={navoid}')

    # first task: get the number of pages for this pair
    total_pages = 0
    res = requests.get(f'https://publications.uh.edu/content.php?catoid={catoid}&navoid={navoid}', verify=False)
    if res.status_code == 200:
      html = BeautifulSoup(res.content.decode(), features='html5lib')
      paginationEnd = html.select_one('#advanced_filter_section + table tr:last-child a:last-child')
      total_pages = int(paginationEnd.text)
    #sleep(1)

    # iterate over every page 
    for i in range(1, total_pages + 1):
      print(f'--- Catalog {j+1} of {len(records)} / Page {i} of {total_pages} ---')
      res = requests.get(f'https://publications.uh.edu/content.php?catoid={catoid}&navoid={navoid}&filter[cpage]={i}', verify=False)
      html = BeautifulSoup(res.content.decode(), features='html5lib')
      # select subjects
      subjects = html.select('#advanced_filter_section + table p strong')
      new = []
      # iterate over subjects
      for sub in subjects:
        # get full name
        subName = sub.text
        siblingRow = sub.find_parent('tr').find_next_sibling('tr').select_one('a')
        # get the acronym
        subAcronym, *_ = siblingRow.text.strip().split(' ')
        # save our findings
        RESULT[subAcronym] = subName
        print(f'- {subAcronym} => {subName}')
      # ensure writing to disk between pages
      export.seek(0)
      export.write(json.dumps(RESULT, indent=2, sort_keys=True))
      export.truncate()
      export.flush()
      os.fsync(export.fileno())
      #sleep(3)
