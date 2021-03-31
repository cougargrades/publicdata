import json
import csv
from pathlib import Path
from .patchfile import Patchfile
from time import time_ns
from alive_progress import alive_bar

'''
Generates patchfiles for individual subject groups
'''
def generate(source: Path, destination: Path):
  destination.mkdir(exist_ok=True)

  KNOWN_COURSES = set()

  # build known courses
  with open(destination / '..' / 'edu.uh.grade_distribution' / 'records.csv') as infile:
    reader = csv.DictReader(infile)
    for row in reader:
      KNOWN_COURSES.add(f'{row["SUBJECT"].strip()} {row["CATALOG NBR"].strip()}')

  # generate groups by abbreviation
  with open(source / 'entries.json', 'r') as f:
    entries = json.loads(f.read())
    abbreviations = [item["abbreviation"] for item in entries] # generate list of only abbreviations
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

    # progress bar
    with alive_bar(len(KNOWN_COURSES)) as bar:
      # for every known course
      for course in KNOWN_COURSES:
        # check that an abbreviation exists already, there's a group that already exists for this subject
        if course.split(' ')[0] in abbreviations:
          # write the patchfile that updates: `catalog/ABCD 1337/.groups[]`
          with open(destination / f'patch-2-addabbrgrouptocourse-{time_ns()}.json', 'w') as out:
            out.write(str(
              Patchfile(f'/catalog/{course}').append('groups', 'firebase.firestore.DocumentReference', f'/groups/{course.split(" ")[0]}')
            ))
          with open(destination / f'patch-3-addcoursetoabbrgroup-{time_ns()}.json', 'w') as out:
            out.write(str(
              Patchfile(f'/groups/{course.split(" ")[0]}')
                .append('courses', 'firebase.firestore.DocumentReference', f'/catalog/{course}') # updates `groups/GroupName/.courses[]`
                .increment('courses_count', 1) # updates `groups/GroupName/.courses_count`
            ))
        bar()

