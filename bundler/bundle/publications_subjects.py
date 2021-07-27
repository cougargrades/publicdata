import shutil
from pathlib import Path

def process(source: Path, destination: Path):
  # print(source.name)
  destination.mkdir(exist_ok=True)
  shutil.copy(source / 'subjects.json', destination / 'subjects.json')
  print('\t✔')