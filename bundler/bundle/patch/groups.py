import re
import csv
import json
from pathlib import Path
from typing import List
from .patchfile import Patchfile
from . import util
from time import time_ns
from alive_progress import alive_bar

'''
All this does is do `util.createKeywords()` for each element of root_keywords 
into 1 flattened list that is deduplicated
'''
def create_deduped_sorted_keywords_set(root_keywords: List[str]) -> List[str]:
  return sorted(list(set([item for sublist in [util.createKeywords(w) for w in root_keywords] for item in sublist])))

'''
Generates Patchfiles for the Core Curriculum
'''
def generate(source: Path, destination: Path):
  destination.mkdir(exist_ok=True)
  with open(source / '..' / 'edu.uh.publications.core' / 'core_curriculum.csv', 'r') as f:
    reader = csv.DictReader(f)
    core = [ row for row in reader ]
    # coreCode,groupNavoid,groupTitle
    core_curriculum_by_catalog = [
        {"coreCode": tup[0], "groupNavoid": tup[1], "groupTitle": tup[2]} 
        for tup in set([ 
          (row["coreCode"], row["groupNavoid"], row["groupTitle"]) for row in core
        ])
      ]
  with open(source / 'defaults.json', 'r') as f:
    data = json.loads(f.read())
    with alive_bar(total=None) as bar:
      for default in data:
        # get history of coreCode
        history = [ ccc for ccc in core_curriculum_by_catalog if ccc["coreCode"] == default["identifier"] ]
        # initialize keywords
        # root_keywords = [
        #   default["name"],
        #   default["identifier"],
        #   "Core Curriculum"
        # ] + util.generatePermutations(util.cleanSentenceForPermutations(default["name"]))

        # perform initial write for Core Group
        with open(destination / f'patch-0a-groupdefaults-{time_ns()}.json', 'w') as out:
          dInstance = dict(default)
          dInstance["name"] = f'{default["name"]} (All) (Core)'
          dInstance["description"] = f'Courses which satisfied the "{default["name"]}" component in the UH Core Curriculum at some point. Includes Undergraduate Catalogs from multiple different academic years. To see which catalogs are included, see the "Sources" below.'
          #dInstance["keywords"] = create_deduped_sorted_keywords_set(root_keywords)
          dInstance["keywords"] = []
          dInstance["relatedGroups"] = []
          out.write(str(
            Patchfile(f'/groups/{default["identifier"]}')
              .write(dInstance)
          ))
          bar()
        
        # perform append that needs to be in a separate patchfile to function correctly
        with open(destination / f'patch-0c-groupdefaults-{time_ns()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/groups/{default["identifier"]}')
              .append('relatedGroups', 'firebase.firestore.DocumentReference', [ f'{default["identifier"]}-{cc["groupNavoid"]}' for cc in history ], many=True)
          ))
          bar()

        # create "spin-off" groups from the defaults that are just for that particular catalog
        for cc in history:
          instance = dict(default)
          instance["identifier"] = f'{default["identifier"]}-{cc["groupNavoid"]}'
          instance["description"] = f'Courses which satisfy the "{default["name"]}" component in the UH Core Curriculum for the {cc["groupTitle"]}.'
          regex = re.compile('(\d\d\d\d)-(\d\d\d\d)')
          match = regex.search(cc["groupTitle"])
          if match:
            year2year = match.group(0) # '2022-2023', guranteed to be in this format due to check above
            instance["name"] = f'{default["name"]} ({year2year}) (Core)'
            instance["categories"] = ['#UHCoreCurriculum', f'UH Core Curriculum ({year2year})']
            #instance["keywords"] = create_deduped_sorted_keywords_set(root_keywords + [year2year] + year2year.split('-'))
            instance["keywords"] = []
            dInstance["relatedGroups"] = []
            with open(destination / f'patch-0b-groupdefaults-{time_ns()}.json', 'w') as out:
              out.write(str(
                Patchfile(f'/groups/{instance["identifier"]}')
                  .write(instance)
              ))
              bar()
        
        # perform append for "spin-off" groups
        for cc in history:
          GROUP_ID = f'{default["identifier"]}-{cc["groupNavoid"]}'
          regex = re.compile('(\d\d\d\d)-(\d\d\d\d)')
          match = regex.search(cc["groupTitle"])
          if match:
            with open(destination / f'patch-0d-groupdefaults-{time_ns()}.json', 'w') as out:
              out.write(str(
                Patchfile(f'/groups/{GROUP_ID}')
                  .append('relatedGroups', 'firebase.firestore.DocumentReference', [ f'{default["identifier"]}-{cc2["groupNavoid"]}' for cc2 in history if cc2["groupNavoid"] != cc["groupNavoid"] ], many=True)
              ))
              bar()
        
        
