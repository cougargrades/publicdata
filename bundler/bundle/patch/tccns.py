import csv
import json
from pathlib import Path
from typing import Dict, Set, Tuple
from .patchfile import Patchfile
from . import util
from time import time_ns
from alive_progress import alive_bar

_file_id_ = 0
def file_id():
  global _file_id_
  _file_id_ += 1
  return _file_id_

def increment_dict(d: dict, key):
  d[key] = d.get(key, 0) + 1

'''
Generates Patchfiles for TCCNS Updates
'''
def generate(source: Path, destination: Path):
  destination.mkdir(exist_ok=True)
  all_courses = set()
  with open(destination / '..' / 'edu.uh.grade_distribution' / 'all_courses.json', 'r') as f:
    all_courses = set(json.load(f))
  # number skipped by reason
  skipped: Dict[str, int] = dict()
  with open(source / 'tccns_updates.csv', 'r') as f:
    with alive_bar(util.file_len((source / 'tccns_updates.csv').resolve())-1) as bar:
      reader = csv.DictReader(f)
      old2new_pairs: Set[Tuple[str, str]] = set()
      for row in reader:

        # confirm that both old and new exist (don't make broken links)
        if row["FormerUHCourseNumber"] not in all_courses:
          increment_dict(skipped, "Missing grade data for former course")
          continue
        if row["ReplacementUHCourseNumber"] not in all_courses:
          increment_dict(skipped, "Missing grade data for replacement course")
          continue
        if f'{row["FormerUHCourseNumber"]}'.lower().strip() == f'{row["ReplacementUHCourseNumber"]}'.lower().strip():
          increment_dict(skipped, "Former and replacement course are the same course")
          continue
        # this will favor the earlier ones over the later ones if there's any duplicates, which seems valid because the "manual" ones are first
        if (row["FormerUHCourseNumber"], row["ReplacementUHCourseNumber"]) in old2new_pairs:
          increment_dict(skipped, "The pair of (Former, Replacement) has already had patches generated.")
          continue

        # mark this pair as seen
        old2new_pairs.add((row["FormerUHCourseNumber"], row["ReplacementUHCourseNumber"]))

        old2new_longMessage = ""
        new2old_longMessage = ""

        if int(row["SemesterEffective"]) > 0:
          old2new_longMessage = f'Effective {util.termString(int(row["SemesterEffective"]))}, {row["FormerUHCourseNumber"]} was renamed to {row["ReplacementUHCourseNumber"]}'
          new2old_longMessage = f'Effective {util.termString(int(row["SemesterEffective"]))}, {row["FormerUHCourseNumber"]} was renamed to {row["ReplacementUHCourseNumber"]}'
        elif row["Acquisition"] == "FormerlyField":
          old2new_longMessage = f'Based on UH Publications, {row["ReplacementUHCourseNumber"]} was formerly known as {row["FormerUHCourseNumber"]}'
          new2old_longMessage = f'Based on UH Publications, {row["ReplacementUHCourseNumber"]} was formerly known as {row["FormerUHCourseNumber"]}'
        elif row["Acquisition"] == "TccnsEquivalentField":
          # For now, do nothing. We're going to reconsider how to work this in the future.
          increment_dict(skipped, "\'tccns_equivalent\' is not being used at this time")
          continue

        with open(destination / f'patch-5-tccnsOld2New-{file_id()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/catalog/{row["FormerUHCourseNumber"]}').append('tccnsUpdates', 'object', {
              "shortMessage": f'Renamed to {row["ReplacementUHCourseNumber"]}',
              "longMessage": old2new_longMessage,
              "courseHref": f'/c/{row["ReplacementUHCourseNumber"]}',
              "sourceHref": row["Reference"],
              "isSourceReliable": True if int(row["SemesterEffective"]) > 0 else False,
            })
          ))
        with open(destination / f'patch-6-tccnsNew2Old-{file_id()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/catalog/{row["ReplacementUHCourseNumber"]}').append('tccnsUpdates', 'object', {
              "shortMessage": f'Previously known as {row["FormerUHCourseNumber"]}',
              "longMessage": new2old_longMessage,
              "courseHref": f'/c/{row["FormerUHCourseNumber"]}',
              "sourceHref": row["Reference"],
              "isSourceReliable": True if int(row["SemesterEffective"]) > 0 else False,
            })
          ))
          
        bar()
  
  print(f'{sum(skipped.values())} TCCNS updates were skipped:')
  for (k,v) in skipped.items():
    print(f'- {v} skipped because: {k}')

