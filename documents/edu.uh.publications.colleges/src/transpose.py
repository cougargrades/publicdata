#!/usr/bin/env python3
import csv
import json

with open('../colleges.csv', 'r') as source:
  with open('../colleges.json', 'w') as dest:
    reader = csv.DictReader(source)
    dest.write(json.dumps([item for item in reader], indent=2))
