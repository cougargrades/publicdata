
import re
import csv
import json
from pathlib import Path
from typing import List
from .patchfile import Patchfile
from . import util
from .util import zero_if_nan
from time import time_ns
import shutil
import math
import statistics
from alive_progress import alive_bar


def generate(source: Path, destination: Path):
  destination.mkdir(exist_ok=True)

  searchable_destination = destination / '..' / 'io.cougargrades.searchable'
  searchable_destination.mkdir(exist_ok=True)

  '''
  Copy 'searchable' files into the 'database' via patchfiles
  '''
  for file in searchable_destination.glob('*.json'):
    with open(file.absolute(), 'r') as f:
      with open(destination / f'patch-8-searchable-{file.stem}.json', 'w') as out:
        out.write(str(
          Patchfile(f'/searchable/{file.stem}')
            .write(f.read())
        ))


  
