import re
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
        default["keywords"] = list(set([item for sublist in [util.createKeywords(w) for w in [default["name"], default["name"].replace("&", "and"), default["identifier"]]] for item in sublist]))
        with open(destination / f'patch-0a-groupdefaults-{time_ns()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/groups/{default["identifier"]}').write(default)
          ))
          bar()
        # create "spin-off" groups from the defaults that are just for that particular catalog
        for cc in history:
          instance = dict(default)
          instance["identifier"] = f'{default["identifier"]}-{cc["groupNavoid"]}'
          instance["description"] = f'{default["description"]} Uses courses from the {cc["groupTitle"]}.'
          regex = re.compile('(\d\d\d\d)-(\d\d\d\d)')
          match = regex.search(cc["groupTitle"])
          if match:
            instance["name"] = f'{default["name"]} ({match.group(0)})'
            instance["categories"] = ['#UHCoreCurriculum', f'UH Core Curriculum ({match.group(0)})']
            with open(destination / f'patch-0b-groupdefaults-{time_ns()}.json', 'w') as out:
              out.write(str(
                Patchfile(f'/groups/{instance["identifier"]}').write(instance)
              ))
              bar()
        
        
