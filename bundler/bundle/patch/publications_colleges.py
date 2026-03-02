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
  
  curated_colleges: list[dict[str, str]] = open_json(source / 'curated_colleges_globbed.json')
  #counts: dict[str, any] = open_json(source / '..' / 'edu.uh.grade_distribution' / 'counts.json')

  with alive_bar(total=len(curated_colleges)) as bar:
    x = 0

    for college in curated_colleges:
      with open(destination / f'patch-0h-college-groups-{x:03d}.json', 'w') as out:
        group = dict()
        group["identifier"] = college["identifier"]
        group["name"] = college["groupLongTitle"]
        group["shortName"] = college["groupShortTitle"]
        NAME_STARTS_WITH_THE = college["groupLongTitle"].lower().strip().startswith('the')
        group["description"] = f'Every Subject available in {(college["groupLongTitle"] if NAME_STARTS_WITH_THE else f'the {college["groupLongTitle"]}')}.'
        group["courses"] = []
        group["sections"] = []
        
        # For each collect, link the subjects under it.
        # "FSDR://" is recognized by the Firestore uploader.
        # See: https://github.com/cougargrades/deployment/blob/5e872577aa746ac9cfbd835a368d7405a4e849db/src/_firestoreFS.ts#L223
        group["relatedGroups"] = [ f'FSDR:///groups/{subj}' for subj in college["subjects"] ]
        group["keywords"] = []
        group["categories"] = ['Colleges/Schools', '#ShowInSidebar', '#layout:RelatedGroupList']
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
          Patchfile(f'/groups/{group["identifier"]}')
            .write(group)
        ))
      
      bar()
      x += 1

