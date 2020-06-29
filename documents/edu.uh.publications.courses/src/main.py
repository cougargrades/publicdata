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

# custom iterator
iterator = CatalogIterator()

# prepare some globals
Path(args.outdir).mkdir(exist_ok=True)
OUTDIR = Path(args.outdir) / iterator.catoid 
OUTDIR.mkdir(exist_ok=True)
TOTAL_ROWS = 0

print(f'{Fore.CYAN}[1 / 2]{Style.RESET_ALL} Scraping http://publications.uh.edu for all possible coid values: ')
print(f'\t{Style.DIM}=> {(OUTDIR / "index.csv")}{Style.RESET_ALL}')
with open(OUTDIR / 'index.csv', 'w') as outfile:
  writer = csv.writer(outfile)
  # write header
  writer.writerow(['catoid', 'catalog_title', 'page_number', 'coid', 'course_title']) 
  # use a progress bar CUI
  with alive_bar(len(iterator)) as bar:
    for page in iterator:
      # optional delay
      time.sleep(args.delay / 1000.0)
      for result in page:
        if result[0] != None:
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
print(f'\t{Style.DIM}Skipped{Style.RESET_ALL}')
exit(0)

# This will be skipped, for now
with open(OUTDIR / 'index.csv', 'r') as infile:
  reader = csv.DictReader(infile)
  with alive_bar(TOTAL_ROWS) as bar:
    for line in reader:
      # optional delay
      time.sleep(args.delay / 1000.0)
      # write to disk
      with open(OUTDIR / clean_filename(f'{line["coid"]}.html'), 'w') as outfile:
        outfile.write(scrapeCourse(line["catoid"], line["coid"], line["catalog_title"]))
      bar()
