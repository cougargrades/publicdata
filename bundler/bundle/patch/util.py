
# see: https://stackoverflow.com/q/845058
def file_len(fname):
  with open(fname) as f:
    for i, l in enumerate(f):
      pass
  return i + 1

import itertools

# inspired by: https://medium.com/@ken11zer01/firebase-firestore-text-search-and-pagination-91a0df8131ef
def createKeywords(a_string):
    result = []
    partialWord = ''
    for letter in a_string:
        partialWord += letter.lower()
        result += [ partialWord ]
    return result

# except from original python: https://github.com/cougargrades/importer-python/blob/5c4995ebad68ca28f8c00a43a6faf3d7d69f75e5/cougargrades/util.py