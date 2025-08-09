#!/usr/bin/env python3
import os
import tarfile
import argparse
from time import time
from shutil import rmtree, copyfile, move
from pathlib import Path
import bundle.grade_distribution
import bundle.patch.publications_subjects
import bundle.subjects
import bundle.publications_courses
import bundle.publications_subjects
import bundle.generate_sitemap
import bundle.publications_colleges
import bundle.patch.publications_courses
import bundle.patch.groups
import bundle.patch.publications_core
import bundle.patch.ratemyprofessors
import bundle.patch.tccns
import bundle.patch.sparklines_enrollment
from colorama import init
init()
from colorama import Fore, Back, Style

parser = argparse.ArgumentParser(description='Do stuff')
parser.add_argument('-o', dest='tarloc', type=str, required=True, help='Where to generate the tar file')
parser.add_argument('--skiptar', dest='skiptar', action='store_true', help='Should the tar file be compression be skipped')
parser.add_argument('--skipmove', dest='skipmove', action='store_true', help='Should the resulting export files be moved to the \'export\' folder or kept in their described location')
parser.add_argument('--skiprmtree', dest='skiprmtree', action='store_true', help='Should the temporary export file directory be preserved')
parser.add_argument('--testbundle', dest='testbundle', type=str, required=False, default=None, help='A Path pattern to select matching CSV files to generate a test bundle off of')
args = parser.parse_args()

# total tasks
N = 16
M = 1
documents_path = Path(__file__).parent / '..' / 'documents'
exports_path = Path(__file__).parent / '..' / 'exports'
exports_path.mkdir(exist_ok=True)

# create directory where export will be staged
export_name = Path(os.path.splitext(args.tarloc)[0])
export_name.mkdir(exist_ok=True)

# always process this first
print(f'{Fore.CYAN}[{M} / {N}] Bundling edu.uh.grade_distribution{Style.RESET_ALL}')
bundle.grade_distribution.process(documents_path / 'edu.uh.grade_distribution', export_name / 'edu.uh.grade_distribution', csv_path_pattern=args.testbundle)
M += 1

# process the raw data, generate intermediary format
for fmt in documents_path.iterdir():
  # print thing
  if(fmt.name in ['com.collegescheduler.uh.subjects', 'edu.uh.publications.courses', 'io.cougargrades.groups', 'edu.uh.publications.subjects','edu.uh.publications.core']):
    print(f'{Fore.CYAN}[{M} / {N}] Bundling {fmt.name}{Style.RESET_ALL}')
    M += 1
  # actually do
  if(fmt.name == 'com.collegescheduler.uh.subjects'):
    bundle.subjects.process(fmt.resolve(), export_name / fmt.name)
  if(fmt.name == 'edu.uh.publications.subjects'):
    bundle.publications_subjects.process(fmt.resolve(), export_name / fmt.name)
  if(fmt.name == 'edu.uh.publications.courses'):
    bundle.publications_courses.process(fmt.resolve(), export_name / fmt.name)
  if(fmt.name == 'edu.uh.publications.colleges'):
    bundle.publications_colleges.process(fmt.resolve(), export_name / fmt.name)
  if(fmt.name == 'edu.uh.publications.core'):
    (export_name / fmt.name).mkdir(exist_ok=True)
    copyfile(fmt / 'core_curriculum.json', export_name / fmt.name / 'core_curriculum.json')
    print('\t✔')
  if(fmt.name == 'io.cougargrades.groups'):
    (export_name / fmt.name).mkdir(exist_ok=True)
    copyfile(fmt / 'defaults.json', export_name / fmt.name / 'defaults.json')
    print('\t✔')
    
# generate sitemap.txt
print(f'{Fore.CYAN}[{M} / {N}] Generating io.cougargrades.sitemap{Style.RESET_ALL}')
M += 1
bundle.generate_sitemap.process(export_name / 'io.cougargrades.sitemap')
print('\t✔')

# generate patch files
for fmt in documents_path.iterdir():
  # print thing
  if(fmt.name in ['com.collegescheduler.uh.subjects', 'edu.uh.publications.courses', 'io.cougargrades.groups', 'edu.uh.publications.core', 'com.ratemyprofessors', 'edu.uh.academics.tccns', 'edu.uh.publications.subjects', 'io.cougargrades.sparklines.enrollment']):
    print(f'{Fore.CYAN}[{M} / {N}] Patching {fmt.name}{Style.RESET_ALL}')
    M += 1
  else:
    continue
  # actually do
  if(fmt.name == 'edu.uh.publications.courses'):
    bundle.patch.publications_courses.generate(export_name / fmt.name, fmt.resolve(), export_name / 'io.cougargrades.publicdata.patchfile')
  if(fmt.name == 'io.cougargrades.groups'):
    bundle.patch.groups.generate(fmt.resolve(), export_name / 'io.cougargrades.publicdata.patchfile')
  if(fmt.name == 'edu.uh.publications.core'):
    bundle.patch.publications_core.generate(fmt.resolve(), export_name / 'io.cougargrades.publicdata.patchfile')
  if(fmt.name == 'com.ratemyprofessors'):
    bundle.patch.ratemyprofessors.generate(fmt.resolve(), export_name / 'io.cougargrades.publicdata.patchfile')
  if(fmt.name == 'edu.uh.academics.tccns'):
    bundle.patch.tccns.generate(fmt.resolve(), export_name / 'io.cougargrades.publicdata.patchfile')
  if(fmt.name == 'edu.uh.publications.subjects'):
    bundle.patch.publications_subjects.generate(fmt.resolve(), export_name / 'io.cougargrades.publicdata.patchfile')
  if(fmt.name == 'io.cougargrades.sparklines.enrollment'):
    bundle.patch.sparklines_enrollment.generate(fmt.resolve(), export_name / 'io.cougargrades.publicdata.patchfile')

# generate the export file
print(f'{Fore.CYAN}[{M} / {N}] Compressing tarfile: {export_name}{Style.RESET_ALL}')
if(not args.skiptar):
  with tarfile.open(exports_path / args.tarloc, 'w:gz') as tar:
    for item in export_name.iterdir():
      tar.add(name=item, arcname=item.name)
  if(not args.skiprmtree):
    rmtree(export_name)
  else:
    print('\tSkipped rmtree')
else:
  print('\tSkipped tar.gz compression')
  if(not args.skipmove):
    move(export_name, exports_path / export_name.name)
  else:
    print('\tSkipped export move')

print(f'{Fore.MAGENTA}Done!{Style.RESET_ALL}')
