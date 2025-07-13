#!/usr/bin/env python3

import urllib.request
from urllib.request import *
import urllib.parse
from urllib.parse import urlparse, parse_qs, urlencode
from typing import Generator, Generic, TypeVar, Union
import http.client
import json
import math

'''
HTTP REQUEST HELPERS
'''

def http_request(req: Request) -> http.client.HTTPResponse:
  res = urlopen(req)
  # if type(res) == http.client.HTTPResponse:
  #   res.ok = res.status < 400
  return res

def is_ok(res: http.client.HTTPResponse) -> bool:
  return res.status < 400

def http_request_json(req: Union[Request, str]) -> any:
  '''
  Accepts an `urllib.request.Request` or a string, gets the HTTP response, and decodes the JSON
  '''
  if type(req) == str:
    req = Request(method='GET', url=req)
  res = http_request(req)
  with urlopen(req) as res:
    if type(res) == http.client.HTTPResponse:
      return json.load(res)
    else:
      return None

'''
DOMAIN-SPECIFIC FUNCTIONS
'''

def get_catalog(legacy_catalog_id: int) -> any:
  '''
  Get catalog information by its legacy_id (catoid)
  '''
  matching_catalogs = http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalogs/?legacy-id={legacy_catalog_id}')
  return matching_catalogs['catalog-list'][0] if matching_catalogs['count'] >= 1 else None

def get_catalog_ext(catalog_id: int) -> any:
  '''
  Get extended catalog information by its API ID
  '''
  res = http_request(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/')
  if is_ok(res):
    return json.load(res)
  else:
    return None

def get_page(catalog_id: int, legacy_page_id: int) -> any:
  '''
  Get page information by its legacy_id (navoid)
  '''
  matching_pages = http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/pages/?legacy-id={legacy_page_id}')
  return matching_pages['page-list'][0] if matching_pages['count'] >= 1 else None

def get_page_ext(catalog_id: int, page_id: int) -> any:
  '''
  Get extended page information by its API ID
  '''
  res = http_request(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/page/{page_id}/')
  if is_ok(res):
    return json.load(res)
  else:
    return None
  
def get_program_ext(catalog_id: int, program_id: int) -> any:
  '''
  Get extended program information by its API ID
  '''
  res = http_request(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/program/{program_id}/')
  if is_ok(res):
    return json.load(res)
  else:
    return None
  
def get_core(catalog_id: int, core_id: int) -> any:
  '''
  '''
  res = http_request(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/core/{core_id}/')
  if is_ok(res):
    return json.load(res)
  else:
    return None

def get_course(catalog_id: int, course_id: int) -> any:
  '''
  '''
  res = http_request(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/course/{course_id}/')
  if is_ok(res):
    return json.load(res)
  else:
    return None

def get_core_courses(catalog_id: int, core_id: int) -> list[any]:
  '''
  Get all courses in a program (including children)
  '''
  res = http_request(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/core/{core_id}/')
  if is_ok(res):
    data = json.load(res)
    result = data["courses"]
    for child in data["children"]:
      result += child["courses"]
    return result
  else:
    return None

def get_courses(catalog_id: int) -> Generator[any, None, None]:
  '''
  Get all courses in a catalog (results will be yielded as they are found)
  '''
  i = 0
  page = 1
  data = http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/courses/?page-size=20&page={page}')
  n = data["count"]
  
  # Loop until the API returns no more data
  while len(data["course-list"]) > 0:
    for item in data["course-list"]:
      yield (item, i, n)
      i += 1 
    page += 1
    data = http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/courses/?page-size=20&page={page}')


# '''
# Testing out stuff
# '''

import argparse
parser = argparse.ArgumentParser(description='Pull data from the UH Acalog API for human analysis')
#parser.add_argument('--page', type=str, help='The page detailing info about the UH Core Curriculum for a particular catalog. Example: https://publications.uh.edu/content.php?catoid=52&navoid=20440')
args = parser.parse_args()

# allows above functions to be re-used without running the code below every time
if __name__ == "__main__":
  # Run it

  # shallow_catalog = get_catalog(55)
  # if shallow_catalog is None:
  #   print(f'Shallow catalog could not be fetched with catoid={catoid}')
  #   exit(1)
  # catalog_id = shallow_catalog["id"]
  # print(f'Fetched shallow catalog: catalog_id={shallow_catalog["id"]} / {shallow_catalog["name"]}')


  # shallow_page = get_page(catalog_id, navoid)
  # if shallow_page is None:
  #   print(f'Shallow page could not be fetched with catalog_id={catalog_id} + navoid={navoid}')
  #   exit(1)
  # page_id = shallow_page["id"]
  # print(f'Fetched shallow page: page_id={shallow_page["id"]} / {shallow_page["name"]}')

  # deep_page = get_page_ext(catalog_id, page_id)
  # if deep_page is None:
  #   print(f'Deep page could not be fetched: catalog_id={catalog_id}, page_id={page_id}')
  #   exit(1)

  # print(deep_page["content"])

  exit(0)
