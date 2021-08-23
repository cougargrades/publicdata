import csv
import json
from pathlib import Path
from .patchfile import Patchfile
from . import util
from time import time_ns
from alive_progress import alive_bar

'''
Generates Patchfiles for the Core Curriculum
'''
def generate(source: Path, destination: Path):
  destination.mkdir(exist_ok=True)
  with open(source / 'core_curriculum.csv', 'r') as f:
    with alive_bar(util.file_len((source / 'core_curriculum.csv').resolve())-1) as bar:
      reader = csv.DictReader(f)
      core = [ row for row in reader ]
      # do corecourses first because these affect different documents
      for row in core:
        with open(destination / f'patch_2_corecourses_{time_ns()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/catalog/{row["department"]} {row["catalogNumber"]}').append('groups', 'firebase.firestore.DocumentReference', f'/groups/{row["coreCode"]}')
          ))
      groups = list(set([ item["coreCode"] for item in core ]))
      for group in groups:
        coursesForGroup = [ item for item in core if item["coreCode"] == group]
        with open(destination / f'patch_1_coregroups_{time_ns()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/groups/{group}').append('courses', 'firebase.firestore.DocumentReference', [ f'/catalog/{item["department"]} {item["catalogNumber"]}' for item in coursesForGroup ], many=True)
          ))
        bar(incr=len(coursesForGroup))
