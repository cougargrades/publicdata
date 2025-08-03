# UH TCCNS Updates

A CSV representation of changes to course numbers at UH

## Format

Identifier code: `edu.uh.academics.tccns`

*Markdown table to help visualize the data*
| SemesterEffective 	| FormerUHCourseNumber 	| FormerUHCourseTitle                             	| ReplacementUHCourseNumber 	| ReplacementUHCourseTitle                             	| Reference                                                                                                              	|
|-------------------	|----------------------	|-------------------------------------------------	|---------------------------	|------------------------------------------------------	|------------------------------------------------------------------------------------------------------------------------	|
| 202103            	| BIOL 1134            	| Human Anatomy & Physiology Laboratory I         	| BIOL 2101                 	| Anatomy & Physiology Laboratory I (lab)              	| https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php 	|
| 202103            	| BIOL 1144            	| Human Anatomy & Physiology Laboratory II        	| BIOL 2102                 	| Anatomy & Physiology Laboratory II (lab)             	| https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php 	|
| 202103            	| BIOL 1153            	| Prenursing Microbiology Laboratory              	| BIOL 2120                 	| Microbiology for Non-Science Majors Laboratory (lab) 	| https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php 	|
| 202103            	| BIOL 1161            	| Introduction to Biological Science Laboratory 1 	| BIOL 1106                 	| Biology for Science Majors I (lab)                   	| https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php 	|
| 202103            	| BIOL 1162            	| Introduction to Biological Science Laboratory 2 	| BIOL 1107                 	| Biology for Science Majors II (lab)                  	| https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php 	|
| 202103            	| BIOL 1309            	| Human Genetics and Society                      	| BIOL 1319                 	| Human Genetics and Society                           	| https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php 	|
| 202103            	| BIOL 1310            	| General Biology 1                               	| BIOL 1308                 	| Biology for Non-Science Majors I (lecture)           	| https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php 	|
| 202103            	| BIOL 1320            	| General Biology 2                               	| BIOL 1309                 	| Biology for Non-Science Majors II (lecture)          	| https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php 	|

*Raw CSV data sample*
```csv
SemesterEffective,FormerUHCourseNumber,FormerUHCourseTitle,ReplacementUHCourseNumber,ReplacementUHCourseTitle,Reference
202103,BIOL 1134,Human Anatomy & Physiology Laboratory I,BIOL 2101,Anatomy & Physiology Laboratory I (lab),https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php
202103,BIOL 1144,Human Anatomy & Physiology Laboratory II,BIOL 2102,Anatomy & Physiology Laboratory II (lab),https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php
202103,BIOL 1153,Prenursing Microbiology Laboratory,BIOL 2120,Microbiology for Non-Science Majors Laboratory (lab),https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php
202103,BIOL 1161,Introduction to Biological Science Laboratory 1,BIOL 1106,Biology for Science Majors I (lab),https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php
202103,BIOL 1162,Introduction to Biological Science Laboratory 2,BIOL 1107,Biology for Science Majors II (lab),https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php
202103,BIOL 1309,Human Genetics and Society,BIOL 1319   ,Human Genetics and Society   ,https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php
202103,BIOL 1310,General Biology 1,BIOL 1308,Biology for Non-Science Majors I (lecture),https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php
202103,BIOL 1320,General Biology 2,BIOL 1309,Biology for Non-Science Majors II (lecture),https://web.archive.org/web/20210415084338/https://uh.edu/academics/courses-enrollment/course-number-updates/index.php
```

## Data Aquisition

- Entries where the "Acquisition" is "Manual" are from: https://web.archive.org/web/20250717171033/https://www.uh.edu/enrollment-services/registrar/courses-enrollment/course-number-updates/index.php
- Entries where the "Acquisition" is "FormerlyField", the "formerly" custom field from the Acalog API is used. See scraping source code in `src/scrape.py`
    - Research about this field was conducted here: https://github.com/cougargrades/publicdata/issues/49
