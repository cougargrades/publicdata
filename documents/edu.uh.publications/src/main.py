#!/usr/bin/env python3

import os
import csv
import argparse
from pathlib import Path
from scraper import CatalogIterator
from alive_progress import alive_bar
from colorama import init
init()
from colorama import Fore, Back, Style

parser = argparse.ArgumentParser(description='Do stuff')
parser.add_argument('outdir', type=str, help='Directory where you want the generated files to appear.')
args = parser.parse_args()

OUTDIR = Path(args.outdir)
OUTDIR.mkdir(exist_ok=True)

print(f'{Fore.CYAN}[1 / 2]{Style.RESET_ALL} Scraping http://publications.uh.edu for all possible coid values: ')
print(f'\t{Style.DIM}=> {(OUTDIR / "index.csv")}{Style.RESET_ALL}')
with open(OUTDIR / 'index.csv', 'w') as outfile:
  writer = csv.writer(outfile)
  # write header
  writer.writerow(['catoid', 'catalog_title', 'page_number', 'coid', 'course_title'])
  # custom iterator
  iterator = CatalogIterator()
  # use a progress bar CUI
  with alive_bar(len(iterator)) as bar:
    for page in iterator:
      for result in page:
        writer.writerow([
          iterator.catoid, # catoid
          iterator.title, # catalog_title
          iterator.i, # page_number
          result[0], # coid
          result[1] # course_title
        ])
      # progress bar is per-page
      bar()
