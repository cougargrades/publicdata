#!/usr/bin/env python3

import os
import tarfile
import argparse
from time import time
from shutil import rmtree
from pathlib import Path
from bundle import grade_distribution, subjects, publications_courses
from colorama import init
init()
from colorama import Fore, Back, Style

parser = argparse.ArgumentParser(description='Do stuff')
parser.add_argument('-o', dest='tarloc', type=str, required=True, help='Where to generate the tar file')
args = parser.parse_args()

documents_path = Path(__file__).parent / '..' / 'documents'
exports_path = Path(__file__).parent / '..' / 'exports'
exports_path.mkdir(exist_ok=True)

# create directory where export will be staged
export_name = Path(os.path.splitext(args.tarloc)[0])
export_name.mkdir(exist_ok=True)

# always process this first
print(f'{Fore.CYAN}[1 / 4] Bundling edu.uh.grade_distribution{Style.RESET_ALL}')
grade_distribution.process(documents_path / 'edu.uh.grade_distribution', export_name / 'edu.uh.grade_distribution')

for fmt in documents_path.iterdir():
  if(fmt.name == 'com.collegescheduler.uh.subjects'):
    print(f'{Fore.CYAN}[? / 4] Bundling {fmt.name}{Style.RESET_ALL}')
    subjects.process(fmt.resolve(), export_name / fmt.name)
  if(fmt.name == 'edu.uh.publications.courses'):
    print(f'{Fore.CYAN}[? / 4] Bundling {fmt.name}{Style.RESET_ALL}')
    publications_courses.process(fmt.resolve(), export_name / fmt.name)

print(f'{Fore.CYAN}[4 / 4] Compressing tarfile: {export_name}{Style.RESET_ALL}')
with tarfile.open(exports_path / args.tarloc, 'w:gz') as tar:
  for item in export_name.iterdir():
    tar.add(name=item, arcname=item.name)
rmtree(export_name)

print(f'{Fore.MAGENTA}Done!{Style.RESET_ALL}')
