#!/usr/bin/env python3
import csv
import json

with open('../core_curriculum.csv', 'r') as source:
  with open('../core_curriculum.json', 'w') as dest:
    reader = csv.DictReader(source)
    dest.write(json.dumps([item for item in reader], indent=2))
