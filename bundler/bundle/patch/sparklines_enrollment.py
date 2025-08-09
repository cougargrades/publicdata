# TODO: all_instructors.json
# TODO: all_courses.json


import re
import csv
import json
from pathlib import Path
from typing import List
from .patchfile import Patchfile
from . import util
from .util import zero_if_nan
from time import time_ns
import math
from alive_progress import alive_bar

_file_id_ = 0
def file_id():
  global _file_id_
  _file_id_ += 1
  return _file_id_

'''
Generates Patchfiles for the Core Curriculum
'''
def generate(source: Path, destination: Path):
  destination.mkdir(exist_ok=True)

  # Load all courses, instructors, and grade data
  # ALL_COURSES = []
  # with open(source / '..' / 'edu.uh.grade_distribution' / 'all_courses.json', 'r') as f:
  #   ALL_COURSES = json.load(f)
  # ALL_INSTRUCTORS = []
  # with open(source / '..' / 'edu.uh.grade_distribution' / 'all_instructors.json', 'r') as f:
  #   ALL_INSTRUCTORS = json.load(f)
  RECORDS = []
  with open(destination / '..' / 'edu.uh.grade_distribution' / 'records.csv', 'r') as f:
    reader = csv.DictReader(f)
    RECORDS = [row for row in reader]
  
  # calculate the domain so we can all sparklines can be uniform
  DOMAIN_LOWER = math.inf
  DOMAIN_UPPER = -math.inf
  

  # DATA
  '''
  where: dict[tuple[term_code, courseName], enrollment]
  '''
  COURSE_SPARKLINE_DATA: dict[tuple[int, str], int] = dict()
  '''
  where: dict[tuple[term_code, instructorName], enrollment]
  '''
  INSTRUCTOR_SPARKLINE_DATA: dict[tuple[int, str], int] = dict()
  '''
  where: set[(term_code, courseName, class_section)]
  we don't want to tally the same section twice if it was taught by multiple people (they do that sometimes...)
  '''
  SEEN_COURSE: set[(int, str, int)] = set()
  '''
  where: set[(term_code, instructorName, class_section)]
  we don't want to tally the same section twice if it was taught by multiple people (they do that sometimes...)
  '''
  SEEN_INSTR: set[(int, str, int)] = set()

  # try to do this all in one pass
  print(f'Computing sparkline data in one-pass records.csv...')
  with alive_bar(len(RECORDS)) as bar:
    for row in RECORDS:
      # compute some things
      termCode = util.term_code(row["TERM"])
      courseName = f'{row["SUBJECT"].strip()} {row["CATALOG NBR"].strip()}'.strip()
      instructorName = f'{row["INSTR LAST NAME"].strip()}, {row["INSTR FIRST NAME"].strip()}'.strip().lower()
      classSection = int(row["CLASS SECTION"])

      # calculate enrollment
      # export const getTotalEnrolled = (sec: Section) => sec.A + sec.B + sec.C + sec.D + sec.F + sec.NCR + sec.S + sec.W;
      # A: zero_if_nan(raw['A']),
      # B: zero_if_nan(raw['B']),
      # C: zero_if_nan(raw['C']),
      # D: zero_if_nan(raw['D']),
      # F: zero_if_nan(raw['F']),
      # SATISFACTORY: zero_if_nan(raw['SATISFACTORY']),
      # NOT_REPORTED: zero_if_nan(raw['NOT REPORTED']),
      # TOTAL_DROPPED: zero_if_nan(raw['TOTAL DROPPED']),
      # AVG_GPA: null_if_nan(raw['AVG GPA']),
      enrolled = (
        zero_if_nan(row["A"])
        + zero_if_nan(row["B"])
        + zero_if_nan(row["C"])
        + zero_if_nan(row["D"])
        + zero_if_nan(row["F"])
        + zero_if_nan(row["SATISFACTORY"])
        + zero_if_nan(row["NOT REPORTED"])
        + zero_if_nan(row["TOTAL DROPPED"])
      )

      # if this combination hasn't been measured for a course
      if (termCode, courseName, classSection) not in SEEN_COURSE:
        # mark it
        SEEN_COURSE.add((termCode, courseName, classSection))
        # record some data
        COURSE_SPARKLINE_DATA[(termCode, courseName)] = COURSE_SPARKLINE_DATA.get((termCode, courseName), 0) + enrolled
      
      # if this combination hasn't been measured for an instructor
      if (termCode, instructorName, classSection) not in SEEN_INSTR:
        # mark it
        SEEN_INSTR.add((termCode, instructorName, classSection))
        # record some data
        INSTRUCTOR_SPARKLINE_DATA[(termCode, instructorName)] = INSTRUCTOR_SPARKLINE_DATA.get((termCode, instructorName), 0) + enrolled

      # update domain
      DOMAIN_LOWER = min(termCode, DOMAIN_LOWER)
      DOMAIN_UPPER = max(termCode, DOMAIN_UPPER)

      bar()

  # using our domain stuff, we need to compute every semester between upper and lower
  FULL_DOMAIN: set[int] = set()
  x = DOMAIN_LOWER
  while x <= DOMAIN_UPPER:
    FULL_DOMAIN.add(x)
    x = util.term_code_increment(x)
  FULL_DOMAIN: list[int] = sorted(list(FULL_DOMAIN)) # defaults in ascending order (correct)

  # calculate global range so we have the option of keeping all charts on the same y-scale
  GLOBAL_COURSE_RANGE_LOWER = min(COURSE_SPARKLINE_DATA.values())
  GLOBAL_COURSE_RANGE_UPPER = max(COURSE_SPARKLINE_DATA.values())
  GLOBAL_INSTRUCTOR_RANGE_LOWER = min(INSTRUCTOR_SPARKLINE_DATA.values())
  GLOBAL_INSTRUCTOR_RANGE_UPPER = max(INSTRUCTOR_SPARKLINE_DATA.values())

  # Iterate over all courses
  
  ALL_COURSES: set[str] = set([k[1] for k in COURSE_SPARKLINE_DATA.keys()])
  print(f'Saving Course sparkline data to patchfiles...')
  with alive_bar(len(ALL_COURSES)) as bar:
    for courseName in ALL_COURSES:
      # this is what we will save to the patchfile
      sparklineData = {
        "data": [COURSE_SPARKLINE_DATA.get((termCode, courseName), 0) for termCode in FULL_DOMAIN],
        "xAxis": FULL_DOMAIN,
        "yAxis": [GLOBAL_COURSE_RANGE_LOWER, GLOBAL_COURSE_RANGE_UPPER],
      }

      # create a patchfile
      with open(destination / f'patch-7-sparklines-course-{file_id()}.json', 'w') as out:
        # Per https://github.com/cougargrades/web/issues/128, instructor names should be lowercase
        out.write(str(
          Patchfile(f'/catalog/{courseName}').merge({
            "sparklineData": sparklineData
          })
        ))
      bar()

  # Iterate over all instructors
  ALL_INSTRUCTORS: set[str] = set([k[1] for k in INSTRUCTOR_SPARKLINE_DATA.keys()])
  print(f'Saving Instructor sparkline data to patchfiles...')
  with alive_bar(len(ALL_INSTRUCTORS)) as bar:
    for instructorName in ALL_INSTRUCTORS:
      # this is what we will save to the patchfile
      sparklineData = {
        "data": [INSTRUCTOR_SPARKLINE_DATA.get((termCode, instructorName), 0) for termCode in FULL_DOMAIN],
        "xAxis": FULL_DOMAIN,
        "yAxis": [GLOBAL_INSTRUCTOR_RANGE_LOWER, GLOBAL_INSTRUCTOR_RANGE_UPPER],
      }

      # create a patchfile
      with open(destination / f'patch-7-sparklines-instructor-{file_id()}.json', 'w') as out:
        # Per https://github.com/cougargrades/web/issues/128, instructor names should be lowercase
        out.write(str(
          Patchfile(f'/instructors/{instructorName}').merge({
            "sparklineData": sparklineData
          })
        ))
      bar()

  
