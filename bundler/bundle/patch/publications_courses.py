import csv
from pathlib import Path
from .patchfile import Patchfile
from . import util
from time import time_ns
from alive_progress import alive_bar
from htmlmin.minify import html_minify
from bs4 import BeautifulSoup

'''
Generates Patchfiles for connections to the UH Publications official course catalog
'''
def generate(generated: Path, source: Path, destination: Path):
  destination.mkdir(exist_ok=True)
  with open(generated / 'pairs.csv', 'r') as infile:
    with alive_bar(util.file_len((generated / 'pairs.csv').resolve())-1) as bar:
      reader = csv.DictReader(infile)
      for row in reader:
        with open(destination / f'patch-1-publicationlink-{time_ns()}.json', 'w') as out:
          with open(source / row["catoid"] / f'{row["catoid"]}-{row["coid"]}.html') as htmlFile:
            out.write(str(
              Patchfile(f'/catalog/{row["department"]} {row["catalogNumber"]}').append('publications', 'object', {
                "title": row["title"],
                "catoid": row["catoid"],
                "coid": row["coid"],
                "classification": row["classification"],
                "url": f'http://publications.uh.edu/preview_course_nopop.php?catoid={row["catoid"]}&coid={row["coid"]}' if row["catoid"] != None and row["coid"] != None else "",
                "content": html_minify(BeautifulSoup(htmlFile.read()).select('div.edu-uh-publications-primary-content')[0].decode_contents().strip())
              })
            ))
            bar()
