from typing import Tuple

from experiment import run_experiment
import rmp

'''
For this experiment:
- concatenate the firstName and lastName
- search with the result
- if results not empty, return the first result
- otherwise, return None

measured 11.81% success rate (471 of 3987)
'''
def mapping(firstName: str, lastName: str) -> Tuple[int, str, str]:
  query = f'{firstName} {lastName}'
  res = rmp.instructor_search(query, schoolID=rmp.UH_SCHOOL_ID)
  if len(res) > 0:
    return (res[0].legacyId, res[0].firstName, res[0].lastName)
  else:
    return (None, None, None)

if __name__ == '__main__':
  run_experiment('../experiment_1', mapping, delay=0)
