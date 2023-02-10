import re
import csv
import math
import itertools
from pathlib import Path
from typing import List

# see: https://stackoverflow.com/q/845058
def file_len(fname):
  with open(fname) as f:
    for i, l in enumerate(f):
      pass
  return i + 1

# inspired by: https://medium.com/@ken11zer01/firebase-firestore-text-search-and-pagination-91a0df8131ef
# excerpt from original python: https://github.com/cougargrades/importer-python/blob/5c4995ebad68ca28f8c00a43a6faf3d7d69f75e5/cougargrades/util.py
def createKeywords(a_string):
  result = []
  partialWord = ''
  for letter in a_string:
    partialWord += letter.lower()
    result += [ partialWord ]
  return result

def cleanSentenceForPermutations(a_sentence) -> str:
  # replace multiple spaces in a row with a single space
  regex_spaces = re.compile('[ ]{2,}')
  temp = a_sentence.replace("&","and").replace("and","").replace(",","").replace("/"," ").strip()
  return re.sub(pattern=regex_spaces, repl=' ', string=temp)

def createKeywordsWithPermutations(a_sentence):
  a_sentence_cleaned = cleanSentenceForPermutations(a_sentence)
  k = len(a_sentence_cleaned.split(' '))
  permutations = generatePermutations(a_sentence_cleaned) if k < 5 else [ a_sentence_cleaned ]
  result = []
  for p in permutations:
    result += createKeywords(p)
  return sorted(list(set(result)))

# excerpt from original python: https://github.com/cougargrades/importer-python/blob/5c4995ebad68ca28f8c00a43a6faf3d7d69f75e5/cougargrades/util.py
def generatePermutations(a_sentence) -> List[str]:
  words = a_sentence.split(' ')
  #print(words)
  permutations = []
  results = []
  for i in range(1, len(words)+1):
    permutations += list(itertools.permutations(words, i))
  for tup in permutations:
    results += [ ' '.join(tup) ]
  return results

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
