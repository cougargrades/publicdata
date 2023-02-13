import shutil
from pathlib import Path

def process(source: Path, destination: Path):
  # print(source.name)
  destination.mkdir(exist_ok=True)
  files = [
    'colleges.json',
    'curated_colleges_globbed.json',
    'curated_colleges_globbed_minified.json'
  ]
  for file in files:
    shutil.copy(source / file, destination / file)
  print('\t✔')