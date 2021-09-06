import csv
import json
from pathlib import Path
from .patchfile import Patchfile
from . import util
from time import time_ns
from alive_progress import alive_bar

'''
Generates Patchfiles for TCCNS Updates
'''
def generate(source: Path, destination: Path):
  destination.mkdir(exist_ok=True)
  with open(source / 'tccns_updates.csv', 'r') as f:
    with alive_bar(util.file_len((source / 'tccns_updates.csv').resolve())-1) as bar:
      reader = csv.DictReader(f)
      for row in reader:
        with open(destination / f'patch-5-tccnsOld2New-{time_ns()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/catalog/{row["FormerUHCourseNumber"]}').append('tccnsUpdates', 'object', {
              "shortMessage": f'Renamed to {row["ReplacementUHCourseNumber"]}',
              "longMessage": f'Effective {util.termString(int(row["SemesterEffective"]))}, {row["FormerUHCourseNumber"]} was renamed to {row["ReplacementUHCourseNumber"]}',
              "courseHref": f'/c/{row["ReplacementUHCourseNumber"]}',
              "sourceHref": row["Reference"],
            })
          ))
        with open(destination / f'patch-6-tccnsNew2Old-{time_ns()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/catalog/{row["ReplacementUHCourseNumber"]}').append('tccnsUpdates', 'object', {
              "shortMessage": f'Previously known as {row["FormerUHCourseNumber"]}',
              "longMessage": f'Effective {util.termString(int(row["SemesterEffective"]))}, {row["FormerUHCourseNumber"]} was renamed to {row["ReplacementUHCourseNumber"]}',
              "courseHref": f'/c/{row["FormerUHCourseNumber"]}',
              "sourceHref": row["Reference"],
            })
          ))
          
        bar()
