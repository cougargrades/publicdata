from typing import Tuple
import re
import string

string.punctuation

from experiment import run_experiment
import rmp

'''
For this experiment:
- same as experiment_1
- [EC 1] if a middle initial is provided in the first or last name, remove it
- [EC 2] remove punctuation, except hyphens and apostrophes
- [EC 3] remove common suffixes (Jr, PhD, II, III, IV)
- [EC 4] only search using the first "segment" of firstName and lastName (["AA BB", "CC DD"] => "AA CC")

measured 50.79% success rate (2025 of 3987)
'''
def mapping(firstName: str, lastName: str) -> Tuple[int, str, str]:
  res = use_first_search_result(f'{firstName} {lastName}')
  #res = (None, None, None)
  if res != (None, None, None):
    return res
  
  # if('Cooper' in lastName):
  #   print(f'before: {firstName} {lastName}')
  
  # [EC 2] remove punctuation, except hyphens and apostrophes
  firstName = remove_punctuation(firstName)
  lastName = remove_punctuation(lastName)
  # [EC 1] if a middle initial is provided in the first or last name, remove it
  firstName = remove_initials(firstName)
  lastName = remove_initials(lastName)
  # [EC 3] remove common suffixes (Jr, PhD, II, III, IV)
  firstName = remove_suffixes(firstName)
  lastName = remove_suffixes(lastName)

  # try with EC 1-3
  res = use_first_search_result(f'{firstName} {lastName}')
  if res != (None, None, None):
    return res

  # [EC 4] only search using the first "segment" of firstName and lastName (["AA BB", "CC DD"] => "AA CC")
  res = use_first_search_result(f'{only_first_segment(firstName)} {only_first_segment(lastName)}')
  if res != (None, None, None):
    return res

  # match wasn't found
  return res

def use_first_search_result(query: str) -> Tuple[int, str, str]:
  #print(f'query: {query}')
  res = rmp.instructor_search(query, schoolID=rmp.UH_SCHOOL_ID)
  if len(res) > 0:
    return (res[0].legacyId, res[0].firstName, res[0].lastName)
  else:
    return (None, None, None)

def remove_initials(s: str) -> str:
  return ' '.join([segment for segment in s.split(' ') if len(segment) > 1])

# From: https://stackoverflow.com/a/266162
def remove_punctuation(x: str) -> str:
  # some punctuation can be important to names
  # so we keep `-\'`
  return str_without(x, str_without(string.punctuation, '-\''))

def str_without(s: str, without: str) -> str:
  regex = re.compile('[%s]' % re.escape(without))
  return regex.sub('', s)

def remove_suffixes(s: str) -> str:
  return ' '.join([segment for segment in s.split(' ') if segment not in SUFFIXES])

def only_first_segment(s: str) -> str:
  return s.split(' ')[0]

SUFFIXES = ['PhD', 'Jr', 'II', 'III', 'IV']

run_experiment('experiment_3', mapping, delay=0)
