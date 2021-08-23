import csv
from pathlib import Path
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
  with open(generated / 'pairs.csv', 'r') as infile:
    with alive_bar(util.file_len((generated / 'pairs.csv').resolve())-1) as bar:
      reader = csv.DictReader(infile)
      for row in reader:
        with open(destination / f'patch_3_publicationlink_{time_ns()}.json', 'w') as out:
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

            out.write(str(
              Patchfile(f'/catalog/{row["department"]} {row["catalogNumber"]}').append('publications', 'object', {
                "title": row["title"],
                "catoid": row["catoid"],
                "coid": row["coid"],
                "classification": row["classification"],
                "url": f'http://publications.uh.edu/preview_course_nopop.php?catoid={row["catoid"]}&coid={row["coid"]}' if row["catoid"] != None and row["coid"] != None else "",
                "scrapeDate": scrapeDate,
                "content": html_minify(bleach.clean(content, tags=bleach.sanitizer.ALLOWED_TAGS + ["br","span","p"]))
              })
            ))
            bar()
