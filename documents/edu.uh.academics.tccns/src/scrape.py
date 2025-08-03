
from pathlib import Path
import re
import csv
import json
from datetime import datetime
from typing import Dict, Set, Tuple
from concurrent.futures import ThreadPoolExecutor
from models import TCCNSUpdate, FIELD_FORMERLY, extract_course_name, DISABLED_CATALOGS
import acalog # From: `../../_common/`

import argparse
parser = argparse.ArgumentParser()
parser.add_argument('--concurrency', dest='concurrency', type=int, default=4)
args = parser.parse_args()

print(f'Concurrency: {args.concurrency}')


# prepare the files
with (
    open('../tccns_updates_manual_2021.csv', 'r') as legacyFile,
    open('../master.csv', 'r') as masterFile,
    open('../tccns_updates.csv', 'w', newline='') as export
):
    # declare writer
    master = csv.DictReader(masterFile)
    writer = csv.DictWriter(export, master.fieldnames)
    
    # write the header row
    writer.writeheader()

    '''
    these are pairs based on the "formerly" field
    where the [0] is the old name and [1] is the new name
    keep track of these to prevent duplicates
    '''
    seen_former_pairs: Set[Tuple[str, str]] = set()
    '''
    For a TCCNS number, list of: (UH Course Name, catalog_id, course_id)
    '''
    tccns2uh: Dict[str, set[Tuple[str, int, int]]] = dict()

    cache_catalog_id2legacy: Dict[int, int] = dict()
    cache_course_id2legacy: Dict[Tuple[int, int], int] = dict()


    # write legacy data into the output
    print(f'--- (Legacy scrape data) ---')
    for item in csv.DictReader(legacyFile):
        row = TCCNSUpdate(dict_data=item)
        row.Acquisition = "Manual"
        writer.writerow(row.to_dict())
    print(f'--- (done) ---')
    export.flush()

    # get the shallow catalogs, order chronologically in ascending order (oldest first)
    shallow_catalogs = sorted(
        list(acalog.get_catalogs(type="Undergraduate")),
        key=lambda c: datetime.fromisoformat(c[0]["created"]),
        reverse=False # False => Oldest first, True => Newest first
    )

    # iterate over all acalog catalogs
    for catalog_i in range(0, len(shallow_catalogs)):
        # for progress bars
        cat_i = catalog_i
        cat_n = len(shallow_catalogs)
        
        # # this will be relevant for confirming the existence of past courses
        # past_catalogs = shallow_catalogs[:catalog_i]

        (shallow_catalog, _, _) = shallow_catalogs[catalog_i]
        catalog_id = shallow_catalog["id"]
        catalogName = shallow_catalog["name"]
        catalog_url = acalog.compose_url_for_catalog(legacy_catalog_id=shallow_catalog["legacy-id"])

        # cache some stuff
        cache_catalog_id2legacy[shallow_catalog["id"]] = shallow_catalog["legacy-id"]

        print(f'--- Catalog [{cat_i+1}/{cat_n}]  / \'{catalogName}\' / {catalog_url}  ---')
        
        will_skip = False
        for disabled_catalog in DISABLED_CATALOGS:
            if disabled_catalog in catalogName:
                print(f'--- SKIPPED ---')
                will_skip = True
                break
        if will_skip:
            continue        

        # catalog_effective_term_code = acalog.read_effective_term_code_for_catalog(shallow_catalog=shallow_catalog)
        # #print(f'Term Code? {catalog_effective_term_code}')

        print(f'-- Fetching all shallow courses ... --')
        shallow_courses = []
        for tup in acalog.get_courses(catalog_id):
            (sc, i, n) = tup
            print(f'-- Loaded [{i+1}/{n}] --', end='\r')
            
            # cache some stuff
            cache_course_id2legacy[(catalog_id, sc["id"])] = sc["legacy-id"]

            shallow_courses.append(tup)
        # shallow_courses = list(acalog.get_courses(catalog_id))
        print(f'-- Done --')

        # Do processing for each course in the catalog concurrently
        with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
            def iterate(tup: Tuple[any, int, int]):
                (shallow_course, course_i, course_n) = tup
                if course_i == 0 or course_i == (course_n - 1) or course_i % 10 == 0:
                    print(f'- Catalog [{cat_i+1} / {cat_n}] / Course [{course_i+1} / {course_n}] -')

                # get deep course data
                deep_course = acalog.get_course(catalog_id=catalog_id, course_id=shallow_course["id"])
                course_name = f'{deep_course["prefix"]} {deep_course["code"]}'
                course_description = deep_course["name"]

                # extract the former name for this course, if there is any
                former_course = acalog.read_field_for_deep_course(deep_course=deep_course, field_names=FIELD_FORMERLY)
                extracted_former_course = extract_course_name(former_course.content)
                # confirm that the extraction worked and that we haven't already logged this pair
                # (THIS MAKES A BIG ASSUMPTION THAT A FORMER COURSE DOESN'T BECOME THE REPLACEMENT MORE THAN ONCE)
                if extracted_former_course != None and (extracted_former_course, course_name) not in seen_former_pairs:
                    # mark this combination as seen
                    seen_former_pairs.add((extracted_former_course, course_name))
                    
                    # compose result
                    row = TCCNSUpdate()
                    row.Acquisition = "FormerlyField"
                    row.SemesterEffective = 0
                    row.FormerUHCourseNumber = extracted_former_course
                    row.FormerUHCourseTitle = ""
                    row.ReplacementUHCourseNumber = course_name
                    row.ReplacementUHCourseTitle = course_description
                    row.Reference = acalog.compose_url_for_course(
                        legacy_catalog_id=shallow_catalog["legacy-id"],
                        legacy_course_id=shallow_course["legacy-id"]
                    )

                    # write output
                    writer.writerow(row.to_dict())
                    export.flush()

                    print(f'{row.ReplacementUHCourseNumber} was formerly known as {row.FormerUHCourseNumber} / {row.Reference}')

                # TODO: What the fuck do we do about TCCNS? 

                # # extract the TCCNS equivalent for this course, if there is any
                # tccns_equivalent = acalog.read_field_for_deep_course(deep_course=deep_course, field_names=FIELD_TCCNS_EQUIVALENT)
                # extracted_tccns_equivalent = extract_course_name(tccns_equivalent.content)
                # # confirm that extraction worked and log the (course name, catalog_id, course_id)
                # if extracted_tccns_equivalent != None:
                #     existing = tccns2uh.get(extracted_tccns_equivalent, set())
                #     existing.add((course_name, catalog_id, shallow_course["id"]))
                #     tccns2uh[extracted_tccns_equivalent] = existing


            # run them all ()
            # This will break CTRL+C on Windows, you'll need to use CTRL+Pause/Break
            # This may break CTRL+C on POSIX, you would need to use CTRL+Z or CTRL+\
            executor.map(iterate, shallow_courses)


            




            




