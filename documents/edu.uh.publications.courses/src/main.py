#!/usr/bin/env python3

import os
import csv
import time
import argparse
from pathlib import Path
from scraper import CatalogIterator, getCurrentUndergraduateCatalog, getCurrentGraduateCatalog
from to_filename import clean_filename
from alive_progress import alive_bar
from colorama import init
init()
from colorama import Fore, Back, Style

parser = argparse.ArgumentParser(description='Do stuff')
parser.add_argument('outdir', type=str, help='Directory where you want the generated files to appear.')
parser.add_argument('--delay', type=int, default=0, help='Manually add a delay (in milliseconds) between scraping requests to prevent HTTP timeouts.')
args = parser.parse_args()

print(f'{Fore.CYAN}[1 / 3] Scraping which catalogs are current. Initializing iterators.{Style.RESET_ALL}')
with alive_bar() as bar:
  ucoid, utitle = getCurrentUndergraduateCatalog()
  bar()
  gcoid, gtitle = getCurrentGraduateCatalog()
  bar()

  undergrad = CatalogIterator(ucoid, utitle)
  bar()
  grad = CatalogIterator(gcoid, gtitle)
  bar()

# prepare some globals
OUTDIR = Path(args.outdir)
OUTDIR.mkdir(exist_ok=True)

print(f'{Fore.CYAN}[2 / 3] Scraping undergraduate coid values from http://publications.uh.edu {Style.RESET_ALL}')
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

print(f'{Fore.CYAN}[3 / 3] Scraping graduate coid values from http://publications.uh.edu {Style.RESET_ALL}')
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
