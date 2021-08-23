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
  with open(source / 'defaults.json', 'r') as f:
    data = json.loads(f.read())
    with alive_bar(len(data)) as bar:
      for item in data:
        item["keywords"] = list(set([item for sublist in [util.createKeywords(w) for w in [item["name"], item["name"].replace("&", "and"), item["identifier"]]] for item in sublist]))
        with open(destination / f'patch-0-groupdefaults-{time_ns()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/groups/{item["identifier"]}').write(item)
          ))
          bar()
