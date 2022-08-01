#!/usr/bin/env python3
import csv
import requests
from urllib.parse import urlparse, parse_qs
from time import sleep
from bs4 import BeautifulSoup

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

# ids[catoid][coreCode][id]
records = {
  # 2020-2022 Undergraduate
  36: {
    10: 13121,
    20: 13122,
    30: 13123,
    40: 13120,
    50: 13124,
    60: 13125,
    70: 13126,
    80: 13127,
    81: 13129,
    91: 13128,
  },
  # 2021-2022 Undergraduate
  41: {
    10: 14726, # http://publications.uh.edu/content.php?catoid=41&navoid=14726
    20: 14727, # http://publications.uh.edu/content.php?catoid=41&navoid=14727
    30: 14728, # http://publications.uh.edu/content.php?catoid=41&navoid=14728
    40: 14725, # http://publications.uh.edu/content.php?catoid=41&navoid=14725
    50: 14729, # http://publications.uh.edu/content.php?catoid=41&navoid=14729
    60: 14730, # http://publications.uh.edu/content.php?catoid=41&navoid=14730
    70: 14731, # http://publications.uh.edu/content.php?catoid=41&navoid=14731
    80: 14732, # http://publications.uh.edu/content.php?catoid=41&navoid=14732
    81: 14734, # http://publications.uh.edu/content.php?catoid=41&navoid=14734
    91: 14733, # http://publications.uh.edu/content.php?catoid=41&navoid=14733
  },
  # 2022-2023 Undergraduate
  44: {
    10: 15888, # http://publications.uh.edu/content.php?catoid=44&navoid=15888
    20: 15889, # http://publications.uh.edu/content.php?catoid=44&navoid=15889
    30: 15890, # http://publications.uh.edu/content.php?catoid=44&navoid=15890
    40: 15887, # http://publications.uh.edu/content.php?catoid=44&navoid=15887
    50: 15891, # http://publications.uh.edu/content.php?catoid=44&navoid=15891
    60: 15892, # http://publications.uh.edu/content.php?catoid=44&navoid=15892
    70: 15893, # http://publications.uh.edu/content.php?catoid=44&navoid=15893
    80: 15894, # http://publications.uh.edu/content.php?catoid=44&navoid=15894
    81: 15896, # http://publications.uh.edu/content.php?catoid=44&navoid=15896
    91: 15895, # http://publications.uh.edu/content.php?catoid=44&navoid=15895
  }
}

with open('../core_curriculum.csv', 'w') as export:
  with open('../master.csv', 'r') as masterFile:
    # declare writer
    master = csv.DictReader(masterFile)
    writer = csv.DictWriter(export, master.fieldnames)
    # write the header row
    writer.writeheader()

    # used for de-duping
    entries = set()
    
    # iterate over catoids
    for catoid in records.keys():
      res2 = requests.get(f'http://publications.uh.edu/content.php?catoid={catoid}&navoid={id}')
      if res2.status_code == 200:
        html2 = BeautifulSoup(res2.content.decode(), features='html5lib')
        catalogName = html2.select_one('span.acalog_catalog_name').text
        print(f'--- \'{catalogName}\' ---')
        for coreCode in records[catoid].keys():
          id = records[catoid][coreCode]
          res = requests.get(f'http://publications.uh.edu/ajax/preview_page.php?catoid={catoid}&id={id}&show')
          if res.status_code == 200:
            html = BeautifulSoup(res.content.decode(), features='html5lib')
            # document.querySelector('h2')
            coreArea = html.select_one('h2').text.split(':')[0].strip()
            # document.querySelectorAll('h2 ~ ul li a:not(h4 ~ ul li a)')
            links = html.select('h2 ~ ul li a:not(h4 ~ ul li a)')
            for anchor in links:
              result = dict.fromkeys(master.fieldnames)
              # catoid,coreCode,coreArea
              result['catoid'] = catoid
              result['coreCode'] = coreCode
              result['coreArea'] = coreArea
              # department,catalogNumber,description,
              anchorText = anchor.text.strip()
              courseName = anchorText[:anchorText.index('-')].strip()
              description = anchorText[anchorText.index('-')+1:].strip()
              result['description'] = description.strip()
              department, catalogNumber = courseName.strip().split(' ')
              result['department'] = department.strip()
              result['catalogNumber'] = catalogNumber.strip()
              # coid
              coid = parse_qs(urlparse(anchor['href']).query)['coid'][0]
              result['coid'] = coid
              result['groupNavoid'] = id
              result['groupTitle'] = catalogName

              # used for de-duping (https://stackoverflow.com/a/12851143/4852536)
              # we don't care if a course with the same name appears in multiple catalogs
              key = (result['department'], result['catalogNumber'], coreCode)
              if key not in entries:
                writer.writerow(result)
                entries.add(key)
            print(f'[{catoid}] {coreArea} done')
            sleep(1)