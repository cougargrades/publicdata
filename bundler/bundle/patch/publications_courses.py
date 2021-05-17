import csv
from pathlib import Path
from .patchfile import Patchfile
from . import util
from time import time_ns
from alive_progress import alive_bar

'''
Generates Patchfiles for connections to the UH Publications official course catalog
'''
def generate(source: Path, destination: Path):
  destination.mkdir(exist_ok=True)
  with open(source / 'pairs.csv', 'r') as infile:
    with alive_bar(util.file_len((source / 'pairs.csv').resolve())-1) as bar:
      reader = csv.DictReader(infile)
      for row in reader:
        with open(destination / f'patch-1-publicationlink-{time_ns()}.json', 'w') as out:
          out.write(str(
            Patchfile(f'/catalog/{row["department"]} {row["catalogNumber"]}').append('publication', 'object', {
              "title": row["title"],
              "catoid": row["catoid"],
              "coid": row["coid"],
              "classification": row["classification"],
              "url": f'http://publications.uh.edu/preview_course_nopop.php?catoid={row["catoid"]}&coid={row["coid"]}' if row["catoid"] != None and row["coid"] != None else ""
            })
          ))
          bar()
