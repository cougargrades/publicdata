import csv
import json
from pathlib import Path
from .patchfile import Patchfile
from . import util
from time import time_ns
from alive_progress import alive_bar

_file_id_ = 0
def file_id():
  _file_id_ += 1
  return _file_id_

'''
Generates Patchfiles for TCCNS Updates
'''
def generate(source: Path, destination: Path):
  destination.mkdir(exist_ok=True)
  all_courses = set()
  with open(destination / '..' / 'edu.uh.grade_distribution' / 'all_courses.json', 'r') as f:
    all_courses = set(json.load(f))
  with open(source / 'tccns_updates.csv', 'r') as f:
    with alive_bar(util.file_len((source / 'tccns_updates.csv').resolve())-1) as bar:
      reader = csv.DictReader(f)
      for row in reader:

        # confirm that both old and new exist (don't make broken links)
        if row["FormerUHCourseNumber"] not in all_courses:
          continue
        if row["ReplacementUHCourseNumber"] not in all_courses:
          continue

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
          continue

        # TODO Issue #49: If we don't have an approximate time for when this happened, change the verbiage to be more generic
        # This could be indicated when "SemesterEffective" == -1
        with open(destination / f'patch-5-tccnsOld2New-{file_id():03d}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/catalog/{row["FormerUHCourseNumber"]}').append('tccnsUpdates', 'object', {
              "shortMessage": f'Renamed to {row["ReplacementUHCourseNumber"]}',
              "longMessage": old2new_longMessage,
              "courseHref": f'/c/{row["ReplacementUHCourseNumber"]}',
              "sourceHref": row["Reference"],
              "isSourceReliable": True if int(row["SemesterEffective"]) > 0 else False,
            })
          ))
        with open(destination / f'patch-6-tccnsNew2Old-{file_id():03d}.json', 'w') as out:
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
