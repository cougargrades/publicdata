# UH Core Curriculum data

A CSV representation of UH's core curriculus by component area.

## Format

Identifier code: `edu.uh.core_by_component`

*Markdown table to help visualize the data*
| department | catalogNumber | description                                                                     | catoid | coid   | coreCode | coreArea                       |
|------------|---------------|---------------------------------------------------------------------------------|--------|--------|----------|--------------------------------|
| ENGL       | 1303          | First Year Writing I                                                            | 36     | 171247 | 10       | Communication                  |
| ENGL       | 1304          | First Year Writing II                                                           | 36     | 171248 | 10       | Communication                  |
| ENGL       | 1370          | Freshman Composition II - Honors                                                | 36     | 171251 | 10       | Communication                  |
| ENGL       | 2361          | Western World Literature II - Honors                                            | 36     | 171276 | 10       | Communication                  |
| BUSI       | 2305          | Business Statistics                                                             | 36     | 184550 | 20       | Mathematics                    |
| MATH       | 1310          | College Algebra                                                                 | 36     | 172365 | 20       | Mathematics                    |
| MATH       | 1311          | Elementary Mathematical Modeling                                                | 36     | 172366 | 20       | Mathematics                    |
| MATH       | 1312          | Introduction to Mathematical Reasoning                                          | 36     | 172367 | 20       | Mathematics                    |

*Raw CSV data sample*
```csv
department,catalogNumber,description,catoid,coid,coreCode,coreArea
ENGL,1303,First Year Writing I,36,171247,10,Communication
ENGL,1304,First Year Writing II,36,171248,10,Communication
ENGL,1370,Freshman Composition II - Honors,36,171251,10,Communication
ENGL,2361,Western World Literature II - Honors,36,171276,10,Communication
BUSI,2305,Business Statistics,36,184550,20,Mathematics
MATH,1310,College Algebra,36,172365,20,Mathematics
MATH,1311,Elementary Mathematical Modeling,36,172366,20,Mathematics
MATH,1312,Introduction to Mathematical Reasoning,36,172367,20,Mathematics
```

## Data Aquisition

Core curriculum data is manually acquired from the UH on their [website](http://publications.uh.edu/content.php?catoid=36&navoid=13119).
