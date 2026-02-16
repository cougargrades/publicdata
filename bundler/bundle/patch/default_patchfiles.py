
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

'''
Generates Patchfiles for the Core Curriculum
'''
def generate(source: Path, destination: Path):
  destination.mkdir(exist_ok=True)

  for file in source.iterdir():
    base_file = file.relative_to(source)
    shutil.copy(file, destination / base_file)

  
