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
    with alive_bar(total=None) as bar:
      reader = csv.DictReader(f)
      core = [ row for row in reader ]
      courses = [
        {"department": tup[0], "catalogNumber": tup[1], "coreCode": tup[2]} 
        for tup in set([ 
          (course["department"], course["catalogNumber"], course["coreCode"]) for course in core
        ])
      ]
      # do corecourses first because these affect different documents
      for row in courses:
        # get the curriculums that this course was a part of
        core_curriculum_by_catalog_by_course = [
          {"coreCode": tup[0], "groupNavoid": tup[1], "groupTitle": tup[2]} 
          for tup in set([ 
            (row["coreCode"], row["groupNavoid"], row["groupTitle"]) for row in [item for item in core if item["department"] == row["department"] and item["catalogNumber"] == row["catalogNumber"]]
          ])
        ]
        history = [ ccc for ccc in core_curriculum_by_catalog_by_course if ccc["coreCode"] == row["coreCode"] ]
        with open(destination / f'patch-2-corecourses-{time_ns()}.json', 'w') as out:
          out.write(str(
            #Patchfile(f'/catalog/{row["department"]} {row["catalogNumber"]}').append('groups', 'firebase.firestore.DocumentReference', f'/groups/{row["coreCode"]}')
            Patchfile(f'/catalog/{row["department"]} {row["catalogNumber"]}')
              .append('groups', 'firebase.firestore.DocumentReference', [
                f'/groups/{identifier}' # reference the other curriculums
                for identifier in ([row["coreCode"]] + [f'{row["coreCode"]}-{ccc["groupNavoid"]}' for ccc in history])
                ], many=True)
          ))
      
      # add course references and sources to "all" groups
      groups = list(set([ item["coreCode"] for item in core ]))
      for group in groups:
        coursesForGroup = [ item for item in courses if item["coreCode"] == group]
        groupSources = [
          { "title": f'{tup[0]}', "url": f'http://publications.uh.edu/content.php?catoid={tup[1]}&navoid={tup[2]}' } 
          for tup in set([
            (item["groupTitle"], item["catoid"], item["groupNavoid"])
            for item in core if item["coreCode"] == group
            ])
          ]
        with open(destination / f'patch-1a-coregroups-{time_ns()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/groups/{group}')
            .append('courses', 'firebase.firestore.DocumentReference', [ f'/catalog/{item["department"]} {item["catalogNumber"]}' for item in coursesForGroup ], many=True)
          ))
        with open(destination / f'patch-1b-coregroups-{time_ns()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/groups/{group}')
            .append('sources', 'object', [ item for item in groupSources ], many=True)
          ))
        bar(incr=len(coursesForGroup))

      # add course references and sources to the specific catalog groups
      groups = list(set([ (item["coreCode"], item["groupNavoid"]) for item in core ]))
      for (groupCode, groupNavoid) in groups:
        coursesForGroup = [ item for item in core if item["coreCode"] == groupCode and item["groupNavoid"] == groupNavoid]
        groupSources = [
          { "title": f'{tup[0]}', "url": f'http://publications.uh.edu/content.php?catoid={tup[1]}&navoid={tup[2]}' } 
          for tup in set([
            (item["groupTitle"], item["catoid"], item["groupNavoid"])
            for item in core if item["coreCode"] == groupCode and item["groupNavoid"] == groupNavoid
            ])
          ]
        with open(destination / f'patch-1c-coregroups-{time_ns()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/groups/{groupCode}-{groupNavoid}')
            .append('courses', 'firebase.firestore.DocumentReference', [ f'/catalog/{item["department"]} {item["catalogNumber"]}' for item in coursesForGroup ], many=True)
          ))
        with open(destination / f'patch-1d-coregroups-{time_ns()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/groups/{groupCode}-{groupNavoid}')
            .append('sources', 'object', [ item for item in groupSources ], many=True)
          ))
        bar(incr=len(coursesForGroup))
