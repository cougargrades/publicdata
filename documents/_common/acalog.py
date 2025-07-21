#!/usr/bin/env python3

import urllib.request
from urllib.request import *
import urllib.parse
from urllib.parse import urlparse, parse_qs, urlencode
from typing import Generator, Generic, TypeVar, Union
import http.client
import json
import math
import os
import time

'''
HTTP REQUEST HELPERS
'''

IS_DEBUGGING = "DEBUG" in os.environ and f'{os.environ["DEBUG"]}'.lower() == "true"

def http_request(req: Union[Request, str]) -> http.client.HTTPResponse:
  method = req.method if type(req) == Request else 'GET'
  url = req.get_full_url() if type(req) == Request else req
  if IS_DEBUGGING:
    print(f'HTTP {method} -> {url}')
  res = urlopen(req)
  # if type(res) == http.client.HTTPResponse:
  #   res.ok = res.status < 400
  if IS_DEBUGGING:
    print(f'HTTP {res.status} <- {url}')
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
  #urlopen(req) as
  with res:
    if type(res) == http.client.HTTPResponse:
      return json.load(res)
    else:
      return None

'''
DOMAIN-SPECIFIC FUNCTIONS
'''

def get_catalogs(legacy_id: int = None, type: str = None, name: str = None) -> Generator[any, None, None]:
  '''
  Get all courses in a catalog (results will be yielded as they are found)
  :param legacy_id: Acalog legacy ID visible in the website
  :param type: Ex: "Undergraduate", exact math
  :param name: Ex: "2024-2025 Undergraduate Catalog", exact match
  '''
  i = 0
  query = {
    "page": 1,
    "legacy-id": legacy_id,
    "type": type,
    "name": name,
  }
  # remove keys with "None"
  for k in list(query.keys()):
    if query[k] == None:
      query.pop(k)
  data = http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalogs/?page-size=100&{urlencode(query)}')
  n = data["count"]

  # This endpoint has completely broken pagination, so we're not doing that
  for item in data["catalog-list"]:
    yield (item, i, n)
    i += 1
  
  return

  # Loop until the API returns no more data
  # while len(data["catalog-list"]) > 0:
  #   for item in data["catalog-list"]:
  #     yield (item, i, n)
  #     i += 1
  #   query["page"] += 1
  #   data = http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalogs/?page-size=100&{urlencode(query)}')

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

def get_courses(catalog_id: int, legacy_id: int = None, type: str = None, prefix: str = None, code: str = None, name: str = None) -> Generator[any, None, None]:
  '''
  Get all courses in a catalog (results will be yielded as they are found)
  :param legacy_id: Acalog legacy ID visible in the website
  :param type: Ex: "Asian American Studies", exact math
  :param prefix: Ex: "MATH", exact match
  :param code: Ex: "1100", exact match
  :param name: Ex: "Introduction to Asian American Studies", exact match
  '''

  i = 0
  query = {
    "page": 1,
    "legacy-id": legacy_id,
    "type": type,
    "prefix": prefix,
    "code": code,
    "name": name,
  }
  # remove keys with "None"
  for k in list(query.keys()):
    if query[k] == None:
      query.pop(k)
  data = http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/courses/?page-size=100&{urlencode(query)}')
  n = data["count"]
  
  # Loop until the API returns no more data
  while len(data["course-list"]) > 0:
    for item in data["course-list"]:
      yield (item, i, n)
      i += 1
    query["page"] += 1
    data = http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/courses/?page-size=100&{urlencode(query)}')


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
  # print(f'catalog? {shallow_catalog}')
  catalogs = [shallow_catalog for (shallow_catalog, i, n) in get_catalogs(type="Undergraduate")]

  for catalog in catalogs:
    for (shallow_course, i, n) in get_courses(catalog["id"]):
      deep_course = get_course(catalog_id=catalog["id"], course_id=shallow_course["id"])
      with open(f'./temp/{catalog["id"]}-{shallow_course["id"]}.json', 'w') as f:
        f.write(json.dumps(deep_course))
      print(f'{i} / {n}')

  # for (shallow_catalog, i, n) in get_catalogs(type="Undergraduate"):
  #   print(f'Catalog ID#{shallow_catalog["id"]} \t`{shallow_catalog["catalog-type"]["name"]}`\t -> {shallow_catalog["name"]}')
  #for (shallow_course, i, n) in get_courses(55, prefix="ENGL", code="1301")
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
