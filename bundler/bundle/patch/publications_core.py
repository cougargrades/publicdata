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
      for row in reader:
        with open(destination / f'patch-1-coregroups-{time_ns()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/groups/{row["coreCode"]}').append('courses', 'firebase.firestore.DocumentReference', f'/catalog/{row["department"]} {row["catalogNumber"]}')
          ))
        with open(destination / f'patch-2-corecourses-{time_ns()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/catalog/{row["department"]} {row["catalogNumber"]}').append('groups', 'firebase.firestore.DocumentReference', f'/groups/{row["coreCode"]}')
          ))
        bar()
