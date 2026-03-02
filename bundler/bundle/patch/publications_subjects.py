import csv
import json
from pathlib import Path
from .patchfile import Patchfile
from . import util
from time import time_ns
from alive_progress import alive_bar

from .groups import append_to_group_searchable_json

def open_json(path: str):
  with open(path) as f:
    return json.load(f)

'''
Generates Patchfiles for the Core Curriculum
'''
def generate(source: Path, destination: Path):
  destination.mkdir(exist_ok=True)

  subjects: dict[str, str] = open_json(source / 'subjects.json')
  searchable_courses: list[dict[str, str]] = open_json(destination / '..' / 'io.cougargrades.searchable' / 'courses.json')["data"]

  ALL_ABBREVIATIONS: set[str] = set()

  # Adds all the abbrevations found in our source CSV data
  ALL_ABBREVIATIONS.update([ item["courseName"].strip().split(' ')[0].upper() for item in searchable_courses ])

  # Adds all the abbreviations found in our "subjects.json" file
  ALL_ABBREVIATIONS.update([ key.upper() for key in subjects.keys() ])


  with alive_bar(total=len(ALL_ABBREVIATIONS)) as bar:
    x = 0

    # Identify subjects that may have the same name (sometimes they change the acronym but group the same things together)
    HAS_DUPLICATES = set()
    NAME_COUNTS = dict()
    for name in subjects.values():
      NAME_COUNTS[name] = NAME_COUNTS.get(name, 0) + 1
      if NAME_COUNTS[name] > 1:
        HAS_DUPLICATES.add(name)

    print('Duplicate subjects:')
    print(HAS_DUPLICATES)

    # Iterate over all subjects and create basic groups
    for abbreviation in ALL_ABBREVIATIONS:
      # (abbreviation, name) in subjects.items()

      with open(destination / f'patch-0f-subject-groups-{x:03d}.json', 'w') as out, open(destination / f'patch-0g-allsubjects-{x:03d}.json', 'w') as out2:
        group = dict()
        if abbreviation in subjects:
          name = subjects[abbreviation]
          group["name"] = f'{name} (Subject)' if name not in HAS_DUPLICATES else f'{name} ("{abbreviation.upper()}") (Subject)'
        else:
          group["name"] = f'"{abbreviation}" (Subject)'
        group["identifier"] = abbreviation
        group["description"] = f'Courses from the \"{abbreviation}\" subject.'
        group["courses"] = []
        group["sections"] = []
        # "FSDR://" is recognized by the Firestore uploader.
        # See: https://github.com/cougargrades/deployment/blob/5e872577aa746ac9cfbd835a368d7405a4e849db/src/_firestoreFS.ts#L223
        group["relatedGroups"] = [ 'FSDR:///groups/all-subjects' ]
        group["keywords"] = []
        group["categories"] = ['#UHSubject']
        group["sources"] = []

        # used for creating searchable "groups.json"
        append_to_group_searchable_json(destination, {
          "href": f'/g/{group["identifier"]}',
          "identifier": group["identifier"],
          "name": group["name"],
          "description": group["description"],
          "categories": group["categories"],
        })

        out.write(str(
          Patchfile(f'/groups/{abbreviation}')
            .write(group)
        ))

        out2.write(str(
          Patchfile(f'/groups/all-subjects')
            .append('relatedGroups', 'firebase.firestore.DocumentReference', f'/groups/{abbreviation}')
        ))

      bar()
      x += 1

