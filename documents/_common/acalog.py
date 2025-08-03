#!/usr/bin/env python3

import urllib.request
from urllib.request import *
import urllib.parse
from urllib.parse import urlparse, parse_qs, urlencode
from typing import Generator, Generic, Set, Tuple, TypeVar, Union
import http.client
from datetime import datetime, timedelta, timezone
from pathlib import Path
import tempfile
import hashlib
import gzip
import json
import math
import os
import re
import time

'''
HTTP REQUEST HELPERS
'''

LOCAL_HTTP_CACHE_TTL = timedelta(days=30)
LOCAL_HTTP_CACHE_DIR = Path(tempfile.gettempdir()) / 'io.cougargrades.publicdata.acalog_cache'
LOCAL_TZ = datetime.now(timezone.utc).astimezone().tzinfo

# cleanup expired cached files
for cached_file in LOCAL_HTTP_CACHE_DIR.iterdir():
  age: timedelta = datetime.now(LOCAL_TZ) - datetime.fromtimestamp(cached_file.stat().st_mtime, tz=timezone.utc)
  # check if expired
  if age > LOCAL_HTTP_CACHE_TTL:
    cached_file.unlink()

# --------------------------------------------------------

def debug_check_env_flag(flagName: str) -> bool:
  return flagName in os.environ and f'{os.environ[flagName]}'.lower() == "true"

IS_DEBUGGING: bool = debug_check_env_flag("DEBUG")
CACHE_DISABLED: bool = debug_check_env_flag("DEBUG_CACHE_DISABLED")

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

  # do some cache prep
  # should be a 40 character sha1 hash (chosen to minimize file length)
  req_url_hash = hashlib.sha1(req.get_full_url().encode('utf-8')).hexdigest()
  LOCAL_HTTP_CACHE_DIR.mkdir(exist_ok=True)
  cached_file_path = LOCAL_HTTP_CACHE_DIR / f'{req_url_hash}.json.gz'

  # check if request is eligible to cache
  if req.method == 'GET':
    cache_hit: bool = False
    # check if cache is allowed and a file was found
    if CACHE_DISABLED == False and cached_file_path.exists():
      age: timedelta = datetime.now(LOCAL_TZ) - datetime.fromtimestamp(cached_file_path.stat().st_mtime, tz=timezone.utc)
      # check if cached file is still valid (age < TTL)
      cache_hit = age < LOCAL_HTTP_CACHE_TTL
      
      if cache_hit:
        if IS_DEBUGGING:
          print(f'[CACHE {('HIT' if cache_hit else 'MISS')}] HTTP {req.method} <-> {req.get_full_url()} / {cached_file_path.name}')
        # cache is still valid
        # open, decompress gzip, parse json, return
        with open(cached_file_path, 'rb') as f:
          return json.loads(gzip.decompress(f.read()))
      else:
        # cache is invalid, so we delete it
        cached_file_path.unlink()
    
    if IS_DEBUGGING:
      print(f'[CACHE {('HIT' if cache_hit else 'MISS')}] HTTP {req.method} <-> {req.get_full_url()} / {cached_file_path.name}')
    
  # request wasn't cached, so we do the real thing
  res = http_request(req)
  if is_ok(res):  
    with res:
      if type(res) == http.client.HTTPResponse:
        result = json.load(res)
        if CACHE_DISABLED == False:
          with open(cached_file_path, 'wb') as f:
            f.write(gzip.compress(json.dumps(result).encode('utf-8')))
        return result
      else:
        return None
  else:
    return None

'''
DOMAIN-SPECIFIC FUNCTIONS
'''

def get_catalogs(legacy_id: int = None, type: str = None, name: str = None) -> Generator[Tuple[any, int, int], None, None]:
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
  return http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/')

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
  return http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/page/{page_id}/')
  
def get_program_ext(catalog_id: int, program_id: int) -> any:
  '''
  Get extended program information by its API ID
  '''
  return http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/program/{program_id}/')
  
def get_core(catalog_id: int, core_id: int) -> any:
  '''
  '''
  return http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/core/{core_id}/')

def get_course(catalog_id: int, course_id: int) -> any:
  '''
  '''
  http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/course/{course_id}/')

def get_core_courses(catalog_id: int, core_id: int) -> list[any]:
  '''
  Get all courses in a program (including children)
  '''
  data = http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/core/{core_id}/')
  if data != None:
    result = data["courses"]
    for child in data["children"]:
      result += child["courses"]
    return result
  else:
    return None

def get_courses(catalog_id: int, legacy_id: int = None, type: str = None, prefix: str = None, code: str = None, name: str = None) -> Generator[Tuple[any, int, int], None, None]:
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

def compose_url_for_catalog(legacy_catalog_id: int) -> str:
  return f'https://publications.uh.edu/index.php?catoid={legacy_catalog_id}'

def compose_url_for_course(legacy_catalog_id: int, legacy_course_id: int) -> str:
  return f'https://publications.uh.edu/preview_course_nopop.php?catoid={legacy_catalog_id}&coid={legacy_course_id}'

def read_effective_term_code_for_catalog(shallow_catalog: any) -> Union[int, None]:
  '''
  Based on a catalog's `name` field and the "20XX-20XX" pattern, return a term_code in the Fall of the starting year
  '''
  catalog_name = shallow_catalog["name"]
  matches = re.findall(r'\d{4}\-\d{4}', catalog_name)
  if len(matches) > 0:
    # '2013-2014'
    year_range = matches[0]
    # ['2013', '2024']
    year_parts = re.findall(r'\d{4}', year_range)
    if len(year_parts) > 0:
      # The first part of the year range is always Fall, so concat `03` and parse as an int
      try:
        return int(f'{year_parts[0]}03')
      except:
        return None
  return None

class AcalogCustomFieldValue():
  content = ""
  category = ""
  modified = datetime.min
  created = datetime.min

def read_field_for_deep_course(deep_course: any, field_names: Set[str]) -> Union[AcalogCustomFieldValue, None]:
  '''
  Iterates over the `fields` property and returns the value of one that matches the names in `field_names`
  '''
  if "fields" not in deep_course:
    return None
  
   # look over every field
  for field in deep_course["fields"]:
    # create a list of all the names this field has and has ever had
    all_field_names = set([field["custom_field"]["name"]] + [item for item in field["custom_field"]["name-history"]])

    # if any of the names we provided match at least one in the entire history, return the value
    if len(field_names.intersection(all_field_names)):
      # extract value
      value = str(field["content"]) if "content" in field else None
      
      result = AcalogCustomFieldValue()
      result.content = value
      result.category = field["custom_field"]["category"]
      result.modified = datetime.fromisoformat(field["modified"])
      result.created = datetime.fromisoformat(field["created"])
      return result
  
  # otherwise, return `None` because nothing could be found
  return None



# ----------------------------------------------------------------------------------------------------------------------------------------------------------------

# '''
# Testing out stuff
# '''

# allows above functions to be re-used without running the code below every time
if __name__ == "__main__":

  import argparse
  parser = argparse.ArgumentParser(description='Pull data from the UH Acalog API for human analysis')
  #parser.add_argument('--page', type=str, help='The page detailing info about the UH Core Curriculum for a particular catalog. Example: https://publications.uh.edu/content.php?catoid=52&navoid=20440')
  args = parser.parse_args()

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
