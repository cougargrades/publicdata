#!/usr/bin/env python3

import os
import tarfile
import argparse
from time import time
from shutil import rmtree, copyfile
from pathlib import Path
from bundle.patch import subjects, publications_courses, groups
from bundle import patch
from bundle import grade_distribution, subjects, publications_courses
from colorama import init
init()
from colorama import Fore, Back, Style

parser = argparse.ArgumentParser(description='Do stuff')
parser.add_argument('-o', dest='tarloc', type=str, required=True, help='Where to generate the tar file')
args = parser.parse_args()

# total tasks
N = 8
M = 1
documents_path = Path(__file__).parent / '..' / 'documents'
exports_path = Path(__file__).parent / '..' / 'exports'
exports_path.mkdir(exist_ok=True)

# create directory where export will be staged
export_name = Path(os.path.splitext(args.tarloc)[0])
export_name.mkdir(exist_ok=True)

# always process this first
print(f'{Fore.CYAN}[{M} / {N}] Bundling edu.uh.grade_distribution{Style.RESET_ALL}')
grade_distribution.process(documents_path / 'edu.uh.grade_distribution', export_name / 'edu.uh.grade_distribution')
M += 1

# process the raw data, generate intermediary format
for fmt in documents_path.iterdir():
  # print thing
  if(fmt.name in ['com.collegescheduler.uh.subjects', 'edu.uh.publications.courses', 'io.cougargrades.groups']):
    print(f'{Fore.CYAN}[{M} / {N}] Bundling {fmt.name}{Style.RESET_ALL}')
    M += 1
  # actually do
  if(fmt.name == 'com.collegescheduler.uh.subjects'):
    subjects.process(fmt.resolve(), export_name / fmt.name)
  if(fmt.name == 'edu.uh.publications.courses'):
    publications_courses.process(fmt.resolve(), export_name / fmt.name)
  if(fmt.name == 'io.cougargrades.groups'):
    (export_name / fmt.name).mkdir(exist_ok=True)
    copyfile(fmt / 'defaults.json', export_name / fmt.name / 'defaults.json')
    print('\t✔')
    

# generate patch files
for fmt in documents_path.iterdir():
  # print thing
  if(fmt.name in ['com.collegescheduler.uh.subjects', 'edu.uh.publications.courses', 'io.cougargrades.groups']):
    print(f'{Fore.CYAN}[{M} / {N}] Patching {fmt.name}{Style.RESET_ALL}')
    M += 1
  # actually do
  if(fmt.name == 'com.collegescheduler.uh.subjects'):
    patch.subjects.generate(export_name / fmt.name, export_name / 'io.cougargrades.publicdata.patch')
  if(fmt.name == 'edu.uh.publications.courses'):
    patch.publications_courses.generate(export_name / fmt.name, export_name / 'io.cougargrades.publicdata.patch')
  if(fmt.name == 'io.cougargrades.groups'):
    patch.groups.generate(export_name / fmt.name, export_name / 'io.cougargrades.publicdata.patch')

# generate the export file
print(f'{Fore.CYAN}[{M} / {N}] Compressing tarfile: {export_name}{Style.RESET_ALL}')
with tarfile.open(exports_path / args.tarloc, 'w:gz') as tar:
  for item in export_name.iterdir():
    tar.add(name=item, arcname=item.name)
rmtree(export_name)

print(f'{Fore.MAGENTA}Done!{Style.RESET_ALL}')
