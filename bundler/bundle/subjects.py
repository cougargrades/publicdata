import re
import json
from pathlib import Path


def unwrap(s):
  # see: https://stackoverflow.com/a/6208415
  # paren[0] => '(Asian American Studies)'
  parenthesis = re.search('\(([^\)]+)\)', s['title'])
  d = dict()
  d['abbreviation'] = s['id']
  # exclude first and last characters
  d['description'] = parenthesis[0][1:-1]
  return d

'''
Processes subject.json to be more accessible
by generating 2 alternative files:
- entries.json
    generate a large array of objects with the properties:
    - abbreviation
    - description
    ex: [{"abbreviation": "ARCH", "description": "Architecture"}, ...]

- dictionary.json
    generate a large dictionary where they the abbreviation
    is used as the key and the value corresponds to the description
    ex: {"ARCH": "Architecture", ...}
 
'''
def process(source: Path, destination: Path):
  # print(source.name)
  destination.mkdir(exist_ok=True)
  with open(source / 'subjects.json', 'r') as f:
    data = json.loads(f.read())
    entries = [unwrap(s) for s in data]
    results = dict()
    for e in entries:
      results[e['abbreviation']] = e['description']
    with open(destination / 'entries.json', 'w') as ex:
      ex.write(json.dumps(entries))
    with open(destination / 'dictionary.json', 'w') as ex:
      ex.write(json.dumps(results))
  print('\t✔')
