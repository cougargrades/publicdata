import csv
from pathlib import Path
from typing import Dict, List, Tuple
from urllib.parse import quote
from .patchfile import Patchfile
from . import util
from time import time_ns
from alive_progress import alive_bar
from htmlmin.minify import html_minify
from bs4 import BeautifulSoup
import bleach

'''
Generates Patchfiles for connections to the UH Publications official course catalog
'''
def generate(generated: Path, source: Path, destination: Path):
  destination.mkdir(exist_ok=True)
  
  # courses[]
  courses: Dict[Tuple[str, str], List[Dict[str,str]]] = dict()

  # loading
  print('\tLoading pairs.csv...')
  with open(generated / 'pairs.csv', 'r') as infile:
    reader = csv.DictReader(infile)
    for row in reader:
      key = (row['department'], row['catalogNumber'])
      if key not in courses:
        courses[key] = []
      courses[key] += [row]
  print('\tDone')
  
  with alive_bar(len(courses.keys())) as bar:
    for (department, catalogNumber) in courses.keys():
      with open(destination / f'patch-3-publicationlink-{time_ns()}.json', 'w') as out:
        key = (department, catalogNumber)
        patchfile = Patchfile(f'/catalog/{department} {catalogNumber}')
        insertions = []
        # sort the publication infos in descending order by the year (new first)
        sorted_pairs_of_course = sorted(courses[key], key=lambda d: d['title'], reverse=True)
        # only make patchfiles concerning the latest 3
        for row in sorted_pairs_of_course[:3]:
          with open(source / row["catoid"] / f'{row["catoid"]}-{row["coid"]}.html') as htmlFile:
            # get primary content area
            html = BeautifulSoup(htmlFile.read(), features='html5lib')
            scrapeDate = html.select('span[title=scrape_date]')[0].decode_contents().strip()
            # compute content
            content = ""
            h3 = html.select_one('.coursepadding div h3')
            afterElems = []
            for item in h3.next_siblings:
              # change URLs that point to other courses to a CougarGrades URL
              if item.name == 'a' and item['href'] != None and item['href'].startswith('preview_course_nopop.php'):
                item.attrs.clear()
                item['href'] = quote(f'/c/{item.string.strip()}')
              # skip spammy tooltip divs
              if item.name != None and item.name != '' and item.has_attr('style') and item['style'] != None and 'display:none' in "".join(item['style'].split()).lower():
                continue
              # replace the <hr /> with <br />
              if item.name == 'hr':
                item.name = 'br'
              # add to list
              afterElems += [ item ]

            # convert elements to a single single
            content = ''.join([ str(item) for item in afterElems ]).strip()

            insertions.append({
              "title": row["title"],
              "catoid": row["catoid"],
              "coid": row["coid"],
              "classification": row["classification"],
              "url": f'http://publications.uh.edu/preview_course_nopop.php?catoid={row["catoid"]}&coid={row["coid"]}' if row["catoid"] != None and row["coid"] != None else "",
              "scrapeDate": scrapeDate,
              "content": html_minify(bleach.clean(content, tags=bleach.sanitizer.ALLOWED_TAGS + ["br","span","p"]))
            })
        patchfile.append('publications', 'object', insertions, many=True)
        out.write(str(patchfile))
      bar()
