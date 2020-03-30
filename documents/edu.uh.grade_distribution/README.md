# Grade Distribution data

The primary data format used for CougarGrades.

## Format

Identifier code: `edu.uh.grade_distribution`


*Markdown table to help visualize the data*
| TERM      | SUBJECT | CATALOG NBR | CLASS SECTION | COURSE DESCR                   | INSTR LAST NAME | INSTR FIRST NAME | A   | B   | C  | D  | F  | TOTAL DROPPED | AVG GPA |
| --------- | ------- | ----------- | ------------- | ------------------------------ | --------------- | ---------------- | --- | --- | -- | -- | -- | ------------- | ------- |
| Fall 2019 | MARK    | 3336        | 3             | Introduction to Marketing      | Ahearne         | Michael          | 236 | 156 | 28 | 1  | 3  | 5             | 3.427   |
| Fall 2019 | ECE     | 3366        | 1             | Intro To Digital Signal Proc   | Sheth           | Bhavin R.        | 14  | 8   | 2  | 0  | 0  | 0             | 3.459   |
| Fall 2019 | SOCW    | 7397        | 2             | Selected Topics in Social Work | Boyd            | Reiko K          | 28  | 2   | 0  | 0  | 0  | 0             | 3.911   |
| Fall 2019 | MATH    | 1431        | 5             | Calculus I                     | Constante       | Beatrice         | 181 | 100 | 77 | 42 | 67 | 31            | 2.606   |

*Raw CSV data sample*
```csv
TERM,SUBJECT,"CATALOG NBR","CLASS SECTION","COURSE DESCR","INSTR LAST NAME","INSTR FIRST NAME",A,B,C,D,F,"TOTAL DROPPED","AVG GPA"
"Fall 2019",MARK,3336,3,"Introduction to Marketing",Ahearne,Michael,236,156,28,1,3,5,3.427
"Fall 2019",ECE,3366,1,"Intro To Digital Signal Proc",Sheth,"Bhavin R.",14,8,2,0,0,0,3.459
"Fall 2019",SOCW,7397,2,"Selected Topics in Social Work",Boyd,"Reiko K",28,2,0,0,0,0,3.911
"Fall 2019",MATH,1431,5,"Calculus I",Constante,Beatrice,181,100,77,42,67,31,2.606
```

## Data Aquisition

Grade Distribution data is acquired through the use of FOIA/TPIA requests directed to the [UH Public Information Officer](http://www.uh.edu/legal-affairs/general-counsel/texas-public-information/).

## Manifest

- [FOIA-IR06296](https://github.com/cougargrades/FOIA-IR06296) *(Fall 2019)*
    - IR06296 Responsive Information.csv

- [FOIA-IR06046](https://github.com/cougargrades/FOIA-IR06046) *(Summer 2019)*
    - Grade Distribution_Summer 2019.csv

- [FOIA-IR05921](https://github.com/cougargrades/FOIA-IR05921) *(Spring 2019)*
    - Grade Distribution_Spring 2019.csv

- [FOIA-IR05873](https://github.com/cougargrades/FOIA-IR05873) *(Fall 2013 - Fall 2018)*
    - PICK-A-PROF-UH_Summer 2017.xls.csv
    - PICK-A-PROF-UH_Fall 2014.xls.csv
    - PICK-A-PROF-UH_Fall 2017.xls.csv
    - PICK-A-PROF-UH_Spring 2015.xls.csv
    - PICK-A-PROF-UH_Summer 2016.xls.csv
    - PICK-A-PROF-UH_Fall 2018.xls.csv
    - PICK-A-PROF-UH_Spring 2018.xls.csv
    - PICK-A-PROF-UH_Spring 2016.xls.csv
    - PICK-A-PROF-UH_Spring 2017.xls.csv
    - PICK-A-PROF-UH_Summer 2018.xls.csv
    - PICK-A-PROF-UH_Fall 2016.xls.csv
    - PICK-A-PROF-UH_Fall 2015.xls.csv
    - PICK-A-PROF-UH_Fall 2013.xls.csv
    - PICK-A-PROF-UH_Spring 2014.xls.csv
    - PICK-A-PROF-UH_Summer 2014.xls.csv
    - PICK-A-PROF-UH_Summer 2015.xls.csv
