import csv
import json
from pathlib import Path
from .patchfile import Patchfile
from . import util
from time import time_ns
from alive_progress import alive_bar

'''
Generates Patchfiles for the RateMyProfessors.com
'''
def generate(source: Path, destination: Path):
  destination.mkdir(exist_ok=True)
  with open(source / 'instructors.csv', 'r') as f:
    with alive_bar(util.file_len((source / 'instructors.csv').resolve())-1) as bar:
      reader = csv.DictReader(f)
      for row in reader:
        if row['rmpId'] != None and row['rmpId'] != "":
          with open(destination / f'patch-4-rmplink-{time_ns()}.json', 'w') as out:
            # Per https://github.com/cougargrades/web/issues/128, instructor names should be lowercase
            out.write(str(
              Patchfile(f'/instructors/{row["sourceLastName"]}, {row["sourceFirstName"]}'.lower()).merge({
                "rmpLegacyId": row["rmpId"]
              })
            ))
        bar()
