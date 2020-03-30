#!/usr/bin/env python3

import argparse
import requests
import json
from halo import Halo

parser = argparse.ArgumentParser(description='Scrapes UH CollegeScheduler API to enumerate all courses by section attributes.')
parser.add_argument('apiUrl', metavar='API_URL', type=str,
                    help='The API URL used. No trailing slash. Ex: http://uh.collegescheduler.com')

args = parser.parse_args()
HOST = args.apiUrl

catalog_data = {}

try:
    spinner = Halo(text=f'Testing API access', spinner='dots')
    spinner.start()
    res = requests.get(f'{HOST}/api/terms')
    if res.status_code == 200 and 'studentCareers' in res.json()[0].keys():
        spinner.succeed(text=f'API access confirmed')
    else:
        spinner.fail(text=f'API access failed')
except Exception as err:
    spinner.fail(text=f'API access failed with an Exception: {err}')

try:
    spinner = Halo(text=f'Enumerating available terms', spinner='dots')
    spinner.start()
    res = requests.get(f'{HOST}/api/terms')
    catalog_data["terms"] = [x["id"] for x in res.json()]
    spinner.succeed()
    print(f'\t{catalog_data["terms"]}')
except Exception as err:
    spinner.fail()
    print(err)

try:
    spinner = Halo(text=f'Enumerating section attributes', spinner='dots')
    spinnertxt = spinner.text
    n = 0
    spinner.start()
    
    catalog_data["sectionAttributes"] = []
    # for every term currently accessible
    for term in catalog_data["terms"]:
        res = requests.get(f'{HOST}/api/terms/{term}/sectionattributes')
        # for every attribute
        catalog_data["sectionAttributes"] += [{ "id": x["id"], "title": x["attrTitle"] } for x in res.json()]
    deduped = []
    for i in catalog_data["sectionAttributes"]:
        if i not in deduped:
            deduped.append(i)
    catalog_data["sectionAttributes"] = deduped
    spinner.succeed()
    print(f'\t{[x["id"] for x in catalog_data["sectionAttributes"]]}')
except Exception as err:
    spinner.fail()
    print(err)

try:
    spinner = Halo(text=f'Computing total course count', spinner='dots')
    spinner.start()

    # for every term currently accessible
    total = 0
    for term in catalog_data["terms"]:
        res = requests.get(f'{HOST}/api/terms/{term}/courses')
        total += len(res.json())
    spinner.succeed(f'{total} total courses found from accessible terms.')
except Exception as err:
    spinner.fail()
    print(err)

try:
    spinner = Halo(text=f'Enumerating courses by subject, by section attributes, by term', spinner='dots')
    spinnertxt = spinner.text
    n = 0
    spinner.start()
    
    # for every term currently accessible
    for term in catalog_data["terms"]:
        res = requests.get(f'{HOST}/api/terms/{term}/sectionattributes')
        # for every attribute
        attributes = [x["id"] for x in res.json()]
        for attr in attributes:
            res = requests.get(f'{HOST}/api/terms/{term}/sectionattributevalues/{attr}/subjects')
            attributed_courses = []
            subjects = [x["id"] for x in res.json()]
            # for every subject
            for sub in subjects:
                res = requests.get(f'{HOST}/api/terms/{term}/sectionattributevalues/{attr}/subjects/{sub}/courses')
                courses = [x for x in res.json()]
                for item in courses:
                    item["sectionAttribute"] = attr
                    spinner.text = f'{spinnertxt}: {n} courses observed, generating `{term} {attr}.jsonl`'
                    n += 1
                attributed_courses += courses
            with open(f'{term} {attr}.jsonl', 'w') as f:
                for item in attributed_courses:
                    f.write(f'{json.dumps(item)}\n')
    spinner.succeed()
    print(f'Files were written')
except Exception as err:
    spinner.fail()
    print(err)

# write manifest.json
with open(f'manifest.json', 'w') as f:
    f.write(f'{json.dumps(catalog_data, indent=4, sort_keys=True)}\n')
