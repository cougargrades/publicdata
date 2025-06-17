#!/usr/bin/env python3
import csv
import requests
from urllib.parse import urlparse, parse_qs
from time import sleep
from bs4 import BeautifulSoup


# TODO: grab hard-coded index per catalog
'''
TODO:
- grab hard-coded index per catalog: http://publications.uh.edu/content.php?catoid=44&navoid=15948
- on index, grab links by query:  document.querySelectorAll(`a[href*="preview_entity.php?catoid={CATOID}&ent_oid"]`)
  - go to each link, grab links by query: document.querySelectorAll(`a[href*="&returnto="]:not([href$="\="])`)
    - grab first link that ends in a number and not "=" (should be factored into the query already)
    - this number should be the `groupNavoid`, use to resolve later
    - grab `groupLongTitle` by query: document.querySelectorAll(`[id="acalog-page-title"]`)
  - after solving for `navoid`, get shortName
  - after solving for `navoid`, go to: http://publications.uh.edu/ajax/preview_filter_show_hide_data.php?&show_hide=show&cat_oid=44&nav_oid=0&ent_oid=3320&type=c&link_text=this%20school/college
    - grab every course:  document.querySelectorAll(`ul li a[onclick^="showCourse"]`)

'''

# ids[catoid] => navoid
records = {
  # 2022-2023 Undergraduate (45 is Graduate)
  44: (45, 15948), # http://publications.uh.edu/content.php?catoid=44&navoid=15948,
  52: (53, 19791), # http://publications.uh.edu/content.php?catoid=52&navoid=19791,
}

# short-hand method
get_html = lambda url: BeautifulSoup(requests.get(url, verify=False).content.decode(), features='html5lib')

with open('../colleges.csv', 'w') as exportColleges, open('../courses.csv', 'w') as exportCourses:
  with open('../master_colleges.csv', 'r') as masterFileColleges, open('../master_courses.csv', 'r') as masterFileCourses:
    # declare writer
    collegeWriter = csv.DictWriter(exportColleges, csv.DictReader(masterFileColleges).fieldnames)
    courseWriter = csv.DictWriter(exportCourses, csv.DictReader(masterFileCourses).fieldnames)
    # write the header row
    collegeWriter.writeheader()
    courseWriter.writeheader()

    # iterate over catoids
    for catoid in records.keys():
      GRADUATE_CATOID = records[catoid][0]
      # get the "Courses" page for a catalog
      index_html = get_html(f'https://publications.uh.edu/content.php?catoid={catoid}&navoid={records[catoid][1]}')
      # get entoid links to colleges
      college_links = index_html.select(f'a[href*="preview_entity.php?catoid={catoid}&ent_oid"]')
      # iterate over college links
      for college_link in college_links:
        # extract ent_oid from URL in link
        entoid = parse_qs(urlparse(college_link['href']).query)['ent_oid'][0]
        # get HTML of college's overview page
        college_html = get_html(f'http://publications.uh.edu/{college_link["href"]}')
        # get longTitle from college
        groupLongTitle = college_html.select_one('h1#acalog-content, h1#acalog-page-title').text
        # get navoid from body links
        navoid_link = college_html.select_one('a[href*="&returnto="]:not([href$="\="])')
        navoid = parse_qs(urlparse(navoid_link['href']).query)['returnto'][0] if navoid_link is not None else None
        # get shortTitle from index
        try:
          groupShortTitle = index_html.select_one(f'a.navbar[href*="navoid={navoid}"]').text if navoid is not None and index_html.select_one(f'a.navbar[href*="navoid={navoid}"]') is not None else [link.text for link in index_html.select(f'a.navbar[href*="navoid"]') if link.text in groupLongTitle][0]
        except:
          groupShortTitle = None
        # preview where we're at so far with scraping
        print(f'entoid: {entoid}, navoid: {navoid}, \n\tshortTitle: {groupShortTitle}, \n\tlongTitle: {groupLongTitle}')
        college_result = dict()
        college_result["catoid"] = catoid
        college_result["groupEntoid"] = entoid
        college_result["groupNavoid"] = navoid
        college_result["groupShortTitle"] = groupShortTitle
        college_result["groupLongTitle"] = groupLongTitle
        college_result["officialCourseCount"] = 0
        # grab the HTML for all the courses within this college
        for inner_catoid in (catoid, GRADUATE_CATOID):
          print(f'\tinner_catoid: {inner_catoid}')
          course_list_html = get_html(f'https://publications.uh.edu/ajax/preview_filter_show_hide_data.php?&show_hide=show&cat_oid={inner_catoid}&nav_oid=0&ent_oid={entoid}&type=c&link_text=college')
          # grab course links
          course_links = course_list_html.select('ul li a[onclick^="showCourse"]')
          for course_link in course_links:
            #print('course link: ', course_link)
            delimiter = course_link.text.find(' - ')
            if delimiter == -1:
              continue
            courseName = course_link.text[0:delimiter].strip()
            description = course_link.text[delimiter+3:].strip()
            #(courseName, description) = course_link.text.split(' - ')
            (department, catalogNumber) = courseName.strip().split(' ')
            # department,catalogNumber,description,catoid,groupEntoid,groupNavoid,groupShortTitle,groupLongTitle
            result = dict()
            result["department"] = department.strip()
            result["catalogNumber"] = catalogNumber.strip()
            result["description"] = description.strip()
            result["catoid"] = inner_catoid
            result["groupEntoid"] = entoid
            result["groupNavoid"] = navoid
            result["groupShortTitle"] = groupShortTitle
            result["groupLongTitle"] = groupLongTitle
            courseWriter.writerow(result)
            college_result["officialCourseCount"] = college_result.get("officialCourseCount", 0) + 1
            print(f'\t\tdepartment: {department}, catalogNumber: {catalogNumber}, description: {description.strip()}')
          # delay request attempts for a moment
          sleep(1)
        # write our college
        collegeWriter.writerow(college_result)

      print(f'Done with catoid={catoid}!')