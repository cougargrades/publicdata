#!/usr/bin/env python3
import csv
import requests
import argparse
import urllib.parse
from urllib.parse import urlparse, parse_qs
from time import sleep
from bs4 import BeautifulSoup
from colorama import init
init()
from colorama import Fore, Back, Style

parser = argparse.ArgumentParser(description='Pull data from the UH Acalog API for human analysis')
parser.add_argument('--page', type=str, help='The page detailing info about the UH Core Curriculum for a particular catalog. Example: https://publications.uh.edu/content.php?catoid=52&navoid=20440')
args = parser.parse_args()

# Get catalog information by its legacy_id (catoid)
def get_catalog(legacy_catalog_id: int) -> any:
  res = requests.get(f'https://uh.catalog.acalog.com/widget-api/catalogs/?legacy-id={legacy_catalog_id}')
  matching_catalogs = res.json()
  return matching_catalogs['catalog-list'][0] if matching_catalogs['count'] >= 1 else None

# Get extended catalog information by its API ID
def get_catalog_ext(catalog_id: int) -> any:
  res = requests.get(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/')
  if res.ok:
    return res.json()
  else:
    return None

# Get page information by its legacy_id (navoid)
def get_page(catalog_id: int, legacy_page_id: int) -> any:
  res = requests.get(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/pages/?legacy-id={legacy_page_id}')
  matching_pages = res.json()
  return matching_pages['page-list'][0] if matching_pages['count'] >= 1 else None

# Get extended page information by its API ID
def get_page_ext(catalog_id: int, page_id: int) -> any:
  res = requests.get(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/page/{page_id}/')
  if res.ok:
    return res.json()
  else:
    return None
  
# Get extended program information by its API ID
def get_program_ext(catalog_id: int, program_id: int) -> any:
  res = requests.get(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/program/{program_id}/')
  if res.ok:
    return res.json()
  else:
    return None
  
def get_core(catalog_id: int, core_id: int) -> any:
  res = requests.get(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/core/{core_id}/')
  if res.ok:
    return res.json()
  else:
    return None

# Get all courses in a program (including children)
def get_core_courses(catalog_id: int, core_id: int) -> list[any]:
  res = requests.get(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/core/{core_id}/')
  if res.ok:
    data = res.json()
    result = data["courses"]
    for child in data["children"]:
      result += child["courses"]
    return result
  else:
    return None

# allows above functions to be re-used without running the code below every time
if __name__ == "__main__":

  # Run it
  parsed_url = urllib.parse.urlparse(args.page)
  if parsed_url.path.lower() != '/content.php':
    print(f'{Fore.RED}Unexpected page: {args.page}{Style.RESET_ALL}')
    exit(1)
  parsed_qs = urllib.parse.parse_qs(parsed_url.query)
  if 'catoid' not in parsed_qs or 'navoid' not in parsed_qs or len(parsed_qs['catoid']) < 1 or len(parsed_qs['navoid']) < 1:
    print(f'{Fore.RED}Expected `catoid` and `navoid` in querystring, but got: `{parsed_url.query}`{Style.RESET_ALL}')
    exit(1)

  catoid = int(parsed_qs['catoid'][0])
  navoid = int(parsed_qs['navoid'][0])
  print(f'{Fore.LIGHTBLACK_EX}Extracted from URL: catoid={catoid} navoid={navoid}{Style.RESET_ALL}')

  shallow_catalog = get_catalog(catoid)
  if shallow_catalog is None:
    print(f'Shallow catalog could not be fetched with catoid={catoid}')
    exit(1)
  catalog_id = shallow_catalog["id"]
  print(f'{Fore.LIGHTBLACK_EX}Fetched shallow catalog: catalog_id={shallow_catalog["id"]} / {shallow_catalog["name"]}{Style.RESET_ALL}')


  shallow_page = get_page(catalog_id, navoid)
  if shallow_page is None:
    print(f'Shallow page could not be fetched with catalog_id={catalog_id} + navoid={navoid}')
    exit(1)
  page_id = shallow_page["id"]
  print(f'{Fore.LIGHTBLACK_EX}Fetched shallow page: page_id={shallow_page["id"]} / {shallow_page["name"]}{Style.RESET_ALL}')

  deep_page = get_page_ext(catalog_id, page_id)
  if deep_page is None:
    print(f'{Fore.RED}Deep page could not be fetched: catalog_id={catalog_id}, page_id={page_id}{Style.RESET_ALL}')
    exit(1)

  # This should be an HTML snippet that triggers either a server-side or client-side rewriting of the HTML to embed a dynamic document
  # However, we can directly fetch the data that would power the document ourselves
  page_content_html = BeautifulSoup(deep_page["content"], features='html5lib')
  '''
  Ex:
  <a class="permalink" data-anchor_text="" data-display_type="inline" data-from_id="14481"
    data-from_type="content" data-legacy_id="13089" data-link_text="" data-permalink_id="506255"
    data-show_title="1" data-signature="026c60b6aab1f85a944509c8a1e2aa78" data-to_id="12003"
    data-to_legacy_id="18049" data-to_type="program" data-to_url="/api/uh/catalog/55/program/12003/" href="#">
    University Core Curriculum Requirements
  </a>
  '''
  program_link = page_content_html.select_one('a.permalink[data-to_type=\"program\"]')
  program_id = int(program_link.attrs["data-to_id"])

  deep_program = get_program_ext(catalog_id, program_id)
  program_id = deep_program["id"]
  print(f'{Fore.LIGHTBLACK_EX}Fetched program: program_id={deep_program["id"]} / {deep_program["name"]}{Style.RESET_ALL}')

  # Loop over each area of core curriculum
  for core in deep_program["cores"]:
    IS_ACTIVE = core["status"]["active"] == True and core["status"]["visible"] == True
    ACTIVITY_TXT = 'ACTIVE' if IS_ACTIVE else 'INACTIVE'
    flattened_courses = get_core_courses(catalog_id, core["id"])
    # flattened_courses = core["courses"]
    # for child in core["children"]:
    #   flattened_courses += child["courses"]
    HAS_COURSES = len(flattened_courses) > 0
    if HAS_COURSES == False:
      continue
    print(f'{Fore.LIGHTBLACK_EX}[{ACTIVITY_TXT}][Core#{core["id"]}]{Style.RESET_ALL} {Fore.CYAN}{core["name"]} - ({len(flattened_courses)} course(s)){Style.RESET_ALL}')

    # Try to print the description
    try:
      core_desc_html = BeautifulSoup(core["description"], features='html5lib')
      print(f'{core_desc_html.get_text().strip()}')
    except:
      'do nothing'
    
    # iterate over courses
    for i in range(0, len(flattened_courses)):
      course = flattened_courses[i]
      if i >= 10:
        print(f'\t {Fore.LIGHTBLACK_EX}... and {len(flattened_courses) - 10} more courses ... {Style.RESET_ALL}')
        break
      print(f'\t- {Fore.LIGHTBLACK_EX}[Course#{course["id"]}]{Style.RESET_ALL} {course["title"]}')
    
    # Explicit newline
    print('\n', end='')

  exit(0)
