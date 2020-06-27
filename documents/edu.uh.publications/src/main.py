#!/usr/bin/env python3

import os
import csv
import time
import argparse
from pathlib import Path
from scraper import CatalogIterator, scrapeCourse
from to_filename import clean_filename
from alive_progress import alive_bar
from colorama import init
init()
from colorama import Fore, Back, Style

parser = argparse.ArgumentParser(description='Do stuff')
parser.add_argument('outdir', type=str, help='Directory where you want the generated files to appear.')
parser.add_argument('--delay', type=int, default=0, help='Manually add a delay (in milliseconds) between scraping requests to prevent HTTP timeouts.')
args = parser.parse_args()
print(args)
exit(0)

OUTDIR = Path(args.outdir)
OUTDIR.mkdir(exist_ok=True)
TOTAL_ROWS = 111

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
      # optional delay
      time.sleep(args.delay / 1000.0)
      for result in page:
        writer.writerow([
          iterator.catoid, # catoid
          iterator.title, # catalog_title
          iterator.i, # page_number
          result[0], # coid
          result[1] # course_title
        ])
        TOTAL_ROWS += 1
      # progress bar is per-page
      bar()

print(f'{Fore.CYAN}[2 / 2]{Style.RESET_ALL} Downloading rich HTML by coid value: ')
with open(OUTDIR / 'index.csv', 'r') as infile:
  reader = csv.DictReader(infile)
  with alive_bar(TOTAL_ROWS) as bar:
    for line in reader:
      # optional delay
      time.sleep(args.delay / 1000.0)
      # create out/<catoid> - <catalog_title>/<coid> - <course_title>
      CATDIR = OUTDIR / clean_filename(f'{line["catoid"]} - {line["catalog_title"]}')
      CATDIR.mkdir(exist_ok=True)
      OUTPATH = CATDIR / clean_filename(f'{line["coid"]} - {line["course_title"]}.html')
      # write to disk
      with open(OUTPATH, 'w') as outfile:
        outfile.write(scrapeCourse(line["catoid"], line["coid"], line["catalog_title"]))
      bar()
