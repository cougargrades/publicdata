import csv
from typing import Tuple

from experiment import run_experiment
import rmp

def mapping(firstName: str, lastName: str) -> Tuple[int, str, str]:
  return (None, None, None)

run_experiment('experiment_1', mapping)
