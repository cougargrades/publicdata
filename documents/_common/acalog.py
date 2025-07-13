#!/usr/bin/env python3

import urllib.request
from urllib.request import *
import urllib.parse
# urlencode({"hello": "world", "age": 22}, doseq=False) => 'hello=world&age=22'
from urllib.parse import urlparse, parse_qs, urlencode
from typing import Generic, TypeVar, Union
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

# Get catalog information by its legacy_id (catoid)
def get_catalog(legacy_catalog_id: int) -> any:
  matching_catalogs = http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalogs/?legacy-id={legacy_catalog_id}')
  return matching_catalogs['catalog-list'][0] if matching_catalogs['count'] >= 1 else None

# Get extended catalog information by its API ID
def get_catalog_ext(catalog_id: int) -> any:
  res = http_request(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/')
  if is_ok(res):
    return json.load(res)
  else:
    return None

# Get page information by its legacy_id (navoid)
def get_page(catalog_id: int, legacy_page_id: int) -> any:
  matching_pages = http_request_json(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/pages/?legacy-id={legacy_page_id}')
  return matching_pages['page-list'][0] if matching_pages['count'] >= 1 else None

# Get extended page information by its API ID
def get_page_ext(catalog_id: int, page_id: int) -> any:
  res = http_request(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/page/{page_id}/')
  if is_ok(res):
    return json.load(res)
  else:
    return None
  
# Get extended program information by its API ID
def get_program_ext(catalog_id: int, program_id: int) -> any:
  res = http_request(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/program/{program_id}/')
  if is_ok(res):
    return json.load(res)
  else:
    return None
  
def get_core(catalog_id: int, core_id: int) -> any:
  res = http_request(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/core/{core_id}/')
  if is_ok(res):
    return json.load(res)
  else:
    return None

def get_course(catalog_id: int, course_id: int) -> any:
  res = http_request(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/course/{course_id}/')
  if is_ok(res):
    return json.load(res)
  else:
    return None

# Get all courses in a program (including children)
def get_core_courses(catalog_id: int, core_id: int) -> list[any]:
  res = http_request(f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/core/{core_id}/')
  if is_ok(res):
    data = json.load(res)
    result = data["courses"]
    for child in data["children"]:
      result += child["courses"]
    return result
  else:
    return None

class PaginationIterator(Generic[TypeVar('T')]):
  def __init__(self, base_url: str, result_field: str, page_size = 20):
    self.i = 0
    self.page = 1
    self.base_url = base_url
    self.result_field = result_field
    self.page_size = page_size
    self.n = self.getTotalResultCount()
    self.max_page = math.ceil(float(self.n) / self.page_size)
    self.cache = []
  
  def __iter__(self):
    return self
  
  def __len__(self):
    return self.n

  # determine the number of pages to process
  def getTotalResultCount(self) -> int:
    data = http_request_json(f'{self.uri(page_size=1, page=1)}')
    return int(data["count"])

  # shorthand for generating the necessary url
  def uri(self, **params: any) -> str:
    url = urlparse(self.base_url)
    query = parse_qs(url.query)
    for (k,v) in params.items():
      query[k.replace('_', '-')] = v
    url._replace(query=urlencode(query, doseq=False))
    #url.query = urlencode(query, doseq=False)
    return url.geturl()
  
  # extract the "coid" querystring from the link
  def extractCoid(self, link: str) -> str:
    # http://publications.uh.edu/preview_course_nopop.php?catoid=34&coid=165991
    href = parse_qs(urlparse(link).query)
    return href['coid'][0] if 'coid' in href and len(href['coid']) > 0 else None

  # Python3 compatibility
  def __next__(self):
    return self.next()

  ## FIX THIS

  def next(self):
    if self.i < self.n:
      if len(self.cache) > 0:
        self.i += 1
        return self.cache.pop(0)
      else:
        data = http_request_json(self.uri(page_size=self.page_size, page=self.page))
        items = data[self.result_field]
        if len(items) > 0:
          self.page += 1
        else:
          raise StopIteration()
        for item in items:
          self.cache.append(item)
        return self.cache.pop(0)
    else:
      raise StopIteration()

def get_courses(catalog_id: int) -> PaginationIterator:
  iterator = PaginationIterator(
    base_url=f'https://uh.catalog.acalog.com/widget-api/catalog/{catalog_id}/courses/',
    result_field="course-list"
  )
  return iterator


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
