import csv
import json
from pathlib import Path
from .patchfile import Patchfile
from . import util
from time import time_ns
from alive_progress import alive_bar

from .groups import append_to_group_searchable_json

'''
Generates Patchfiles for the Core Curriculum
'''
def generate(source: Path, destination: Path):
  destination.mkdir(exist_ok=True)
  with open(source / 'subjects.json', 'r') as f:
    subjects: dict[str, str] = json.loads(f.read())
    with alive_bar(total=len(subjects.keys())) as bar:
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
      for (abbreviation, name) in subjects.items():
        with open(destination / f'patch-0f-subject-groups-{x:03d}.json', 'w') as out:
          group = dict()
          group["name"] = f'{name} (Subject)' if name not in HAS_DUPLICATES else f'{name} ("{abbreviation.upper()}") (Subject)'
          group["identifier"] = abbreviation
          group["description"] = f'Courses from the \"{abbreviation}\" subject.'
          group["courses"] = []
          group["sections"] = []
          group["relatedGroups"] = []
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
        bar()
        x += 1

