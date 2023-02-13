#!/usr/bin/env python3
import csv
import json
import fnmatch
from urllib.parse import urlparse, parse_qs
from time import sleep
from bs4 import BeautifulSoup

KNOWN_COURSES = set()
RECORDS = []

def num_of_sections(courseName):
  return len([ row for row in RECORDS if f'{row["SUBJECT"].strip()} {row["CATALOG NBR"].strip()}' == courseName])

# iterates over records.csv
with open('../records.csv') as infile:
  reader = csv.DictReader(infile)
  RECORDS = [row for row in reader]
  for row in RECORDS:
    KNOWN_COURSES.add(f'{row["SUBJECT"].strip()} {row["CATALOG NBR"].strip()}')

with open('../curated_colleges.json', 'r') as sourceFile, open('../curated_colleges_globbed.json', 'w') as outFile, open('../curated_colleges_globbed_minified.json', 'w') as outFileMin:
  curated_colleges = json.load(sourceFile)

  for college in curated_colleges:
    print(f'{college["groupShortTitle"]}')
    result = []
    if len(college["courseGlobs"]) == 0:
      print('\tno globs')
    total_courses = 0
    #total_sections = 0
    for glob in college["courseGlobs"]:
      matched = fnmatch.filter(KNOWN_COURSES, glob)
      total_courses += len(matched)
      #secs4glob = sum([ num_of_sections(match) for match in matched])
      #total_sections += secs4glob
      print(f'\tGlob `{glob}` matched {len(matched)} courses')
      result += matched
    print(f'\tTotal courses matched: {total_courses} courses')
    subjects = list(set([ item.split(' ')[0] for item in result ]))
    college["courses"] = sorted(result)
    college["subjects"] = sorted(subjects)
  
  outFile.write(json.dumps(curated_colleges, indent=2))

  for college in curated_colleges:
    college["courses"] = []
  outFileMin.write(json.dumps(curated_colleges, indent=2))

