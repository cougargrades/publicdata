#!/usr/bin/env python3
import os
import json
import requests
from urllib.parse import urlparse, parse_qs
from time import sleep
from bs4 import BeautifulSoup

# records[catoid][navoid]
records = [
  [36, 13221],
  [37, 13813],
]

RESULT = dict()
# resume our progress between runs
with open('../subjects.json', 'r') as f:
  RESULT = json.loads(f.read())

with open('../subjects.json', 'w') as export:
  for pair in records:
    catoid, navoid = pair
    print(f'Starting: http://publications.uh.edu/content.php?catoid={catoid}&navoid={navoid}')

    # first task: get the number of pages for this pair
    total_pages = 0
    res = requests.get(f'http://publications.uh.edu/content.php?catoid={catoid}&navoid={navoid}')
    if res.status_code == 200:
      html = BeautifulSoup(res.content.decode(), features='html5lib')
      paginationEnd = html.select_one('#advanced_filter_section + table tr:last-child a:last-child')
      total_pages = int(paginationEnd.text)
    sleep(1)

    # iterate over every page 
    for i in range(1, total_pages + 1):
      print(f'--- Page {i} of {total_pages} ---')
      res = requests.get(f'http://publications.uh.edu/content.php?catoid={catoid}&navoid={navoid}&filter[cpage]={i}')
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
      export.seek(0)
      export.write(json.dumps(RESULT, indent=2, sort_keys=True))
      export.truncate()
      export.flush()
      os.fsync(export.fileno())
      sleep(3)
