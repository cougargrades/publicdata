#!/usr/bin/env python3

import os
import csv
import time
import argparse
from pathlib import Path
from scraper import CatalogIterator, getCurrentUndergraduateCatalog, getCurrentGraduateCatalog, scrapeCourse
from util import file_len
from to_filename import clean_filename
from alive_progress import alive_bar
from colorama import init
init()
from colorama import Fore, Back, Style

parser = argparse.ArgumentParser(description='Do stuff')
parser.add_argument('outdir', type=str, help='Directory where you want the generated files to appear.')
parser.add_argument('--overwrite-existing-html', type=bool, default=False, help='Should HTML that already exists be downloaded again?')
parser.add_argument('--delay', type=int, default=0, help='Manually add a delay (in milliseconds) between scraping requests to prevent HTTP timeouts.')
args = parser.parse_args()

print(f'{Fore.CYAN}[1 / 4] Scraping which catalogs are current. Initializing iterators.{Style.RESET_ALL}')
with alive_bar() as bar:
  ucoid, utitle = getCurrentUndergraduateCatalog()
  bar()
  gcoid, gtitle = getCurrentGraduateCatalog()
  bar()

  print(f'Current Undergraduate catalog: {utitle} [{ucoid}]')
  print(f'http://publications.uh.edu/index.php?catoid={ucoid}\n')
  print(f'Current Graduate catalog: {gtitle} [{gcoid}]')
  print(f'http://publications.uh.edu/index.php?catoid={gcoid}\n')

  if 'Not Current' in utitle:
    undergrad = []
  else:
    undergrad = CatalogIterator(ucoid, utitle)
  bar()
  if 'Not Current' in gtitle:
    grad = []
  else:
    grad = CatalogIterator(gcoid, gtitle)
  bar()

# prepare some globals
OUTDIR = Path(args.outdir)
OUTDIR.mkdir(exist_ok=True)

if type(undergrad) != list and False:
  print(f'{Fore.CYAN}[2 / 4] Scraping undergraduate coid values from http://publications.uh.edu {Style.RESET_ALL}')
  print(f'\t{Style.DIM}=> {(OUTDIR / (undergrad.catoid+".csv"))}{Style.RESET_ALL}')
  with open(OUTDIR / (undergrad.catoid+".csv"), 'w') as outfile:
    writer = csv.writer(outfile)
    # write header
    writer.writerow(['catoid', 'catalog_title', 'classification', 'page_number', 'coid', 'course_title']) 
    # use a progress bar CUI
    with alive_bar(len(undergrad)) as bar:
      for page in undergrad:
        # optional delay
        time.sleep(args.delay / 1000.0)
        for result in page:
          if result[0] != None:
            writer.writerow([
              undergrad.catoid, # catoid
              undergrad.title, # catalog_title
              'undergraduate', # classification
              undergrad.i, # page_number
              result[0], # coid
              result[1] # course_title
            ])
        # progress bar is per-page
        bar()
else:
  print(f'{Fore.CYAN}[2 / 4] Skipping outdated undergraduate ([{ucoid}] {utitle}) {Style.RESET_ALL}')

if type(grad) != list and False:
  print(f'{Fore.CYAN}[3 / 4] Scraping graduate coid values from http://publications.uh.edu {Style.RESET_ALL}')
  print(f'\t{Style.DIM}=> {(OUTDIR / (grad.catoid+".csv"))}{Style.RESET_ALL}')
  with open(OUTDIR / (grad.catoid+".csv"), 'w') as outfile:
    writer = csv.writer(outfile)
    # write header
    writer.writerow(['catoid', 'catalog_title', 'classification', 'page_number', 'coid', 'course_title']) 
    # use a progress bar CUI
    with alive_bar(len(grad)) as bar:
      for page in grad:
        # optional delay
        time.sleep(args.delay / 1000.0)
        for result in page:
          if result[0] != None:
            writer.writerow([
              grad.catoid, # catoid
              grad.title, # catalog_title
              'graduate', # classification
              grad.i, # page_number
              result[0], # coid
              result[1] # course_title
            ])
        # progress bar is per-page
        bar()
else:
  print(f'{Fore.CYAN}[3 / 4] Skipping outdated graduate ([{gcoid}] {gtitle}) {Style.RESET_ALL}')

print(f'{Fore.CYAN}[4 / 4]{Style.RESET_ALL} Downloading rich HTML by coid value: ')
for index in OUTDIR.glob('*.csv'):
  TOTAL_ROWS = file_len(index) - 1
  with open(index, 'r') as infile:
    reader = csv.DictReader(infile)
    with alive_bar(TOTAL_ROWS) as bar:
      for line in reader:
        # prepare to write to disk
        SUBDIR = OUTDIR / line["catoid"]
        SUBDIR.mkdir(exist_ok=True)
        OUTPUT_FILE = SUBDIR / clean_filename(f'{line["catoid"]}-{line["coid"]}.html')
        if OUTPUT_FILE.exists() and not args.overwrite_existing_html:
          bar()
          continue

        # optional delay
        time.sleep(args.delay / 1000.0)

        # write to disk
        with open(OUTPUT_FILE, 'w') as outfile:
          outfile.write(scrapeCourse(line["catoid"], line["coid"], line["catalog_title"]))
        bar()