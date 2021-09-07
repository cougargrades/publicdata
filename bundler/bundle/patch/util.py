import csv
import math
from pathlib import Path

# see: https://stackoverflow.com/q/845058
def file_len(fname):
  with open(fname) as f:
    for i, l in enumerate(f):
      pass
  return i + 1

import itertools

# inspired by: https://medium.com/@ken11zer01/firebase-firestore-text-search-and-pagination-91a0df8131ef
# excerpt from original python: https://github.com/cougargrades/importer-python/blob/5c4995ebad68ca28f8c00a43a6faf3d7d69f75e5/cougargrades/util.py
def createKeywords(a_string):
  result = []
  partialWord = ''
  for letter in a_string:
    partialWord += letter.lower()
    result += [ partialWord ]
  return result

def termString(termCode: int) -> str:
  year = math.floor(termCode / 100)
  season = f'{math.floor(termCode / 10) % 10}{termCode % 10}'
  seasons = {
    "01": "Spring",
    "02": "Summer",
    "03": "Fall",
  }
  return f'{seasons[season]} {year}'

def get_known_courses(destination: Path) -> set:
  KNOWN_COURSES = set()
  with open(destination / '..' / 'edu.uh.grade_distribution' / 'records.csv') as infile:
    reader = csv.DictReader(infile)
    for row in reader:
      KNOWN_COURSES.add(f'{row["SUBJECT"].strip()} {row["CATALOG NBR"].strip()}')
  return KNOWN_COURSES
