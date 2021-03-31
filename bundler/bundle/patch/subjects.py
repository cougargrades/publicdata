import json
from pathlib import Path
from .patchfile import Patchfile
from time import time_ns
from alive_progress import alive_bar

'''
Generates patchfiles for individual subject groups
'''
def generate(source: Path, destination: Path):
  destination.mkdir(exist_ok=True)
  with open(source / 'entries.json', 'r') as f:
    entries = json.loads(f.read())
    with alive_bar(len(entries)) as bar:
      for item in entries:
        with open(destination / f'patch-1-groupsbyabbreviation-{time_ns()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/groups/{item["abbreviation"]}').write({
              "name": item["description"],
              "identifier": item["abbreviation"],
              "courses": [],
              "keywords": [],
              "description": f'Courses from the \"{item["abbreviation"]}\" subject.',
              "courses_count": 0
            })
          ))
          bar()
