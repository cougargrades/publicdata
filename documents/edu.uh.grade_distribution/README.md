# Grade Distribution data

The primary data format used for CougarGrades.

## Formats

## Format (Fall 2013 - Fall 2019)

Identifier code: **not applicable**


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

### Format (Spring 2020)

Identifier code: **not applicable**

*Markdown table to help visualize the data*
| TERM        | SUBJECT | CATALOG NBR | CLASS SECTION | COURSE DESCR                   | INSTR LAST NAME | INSTR FIRST NAME | A   | B  | C  | D  | F  | SATISFACTORY | TOTAL DROPPED | AVG GPA |
| ----------- | ------- | ----------- | ------------- | ------------------------------ | --------------- | ---------------- | --- | -- | -- | -- | -- | ------------ | ------------- | ------- |
| Spring 2020 | CHEM    | 1331        | 3             | Fundamentals of Chemistry      | Kadish          | Karl             | 18  | 41 | 10 | 0  | 0  | 51           | 14            | 1.541   |
| Spring 2020 | COSC    | 1430        | 8             | Introduction to Programming    | Rincon Castro   | Carlos Alberto   | 9   | 5  | 1  | 0  | 0  | 18           | 5             | 1       |
| Spring 2020 | HIST    | 1376        | 2             | The United States To 1877      | Hopkins         | Kelly Y          | 112 | 78 | 12 | 0  | 0  | 54           | 5             | 2.426   |
| Spring 2020 | MATH    | 1314        | 3             | Calc for Bus/Life Sciences     | Assi            | Sabrine Ahmad    | 19  | 9  | 3  | 0  | 0  | 17           | 3             | 2.019   |

*Raw CSV data sample*
```csv
TERM,SUBJECT,CATALOG NBR,CLASS SECTION,COURSE DESCR,INSTR LAST NAME,INSTR FIRST NAME,A,B,C,D,F,SATISFACTORY,TOTAL DROPPED,AVG GPA
Spring 2020,CHEM,1331,3,Fundamentals of Chemistry,Kadish,Karl M,18,41,10,0,0,51,14,1.541
Spring 2020,COSC,1430,8,Introduction to Programming,Rincon Castro,Carlos Alberto,9,5,1,0,0,18,5,1
Spring 2020,HIST,1376,2,The United States To 1877,Hopkins,Kelly Y,112,78,12,0,0,54,5,2.426
Spring 2020,MATH,1314,3,Calc for Bus/Life Sciences,Assi,Sabrine Ahmad,19,9,3,0,0,17,3,2.019
```

### Format (Summer 2020 + Fall 2020)

Identifier code: `edu.uh.grade_distribution`

**This is the format that is currently in use by CougarGrades.**

*Markdown table to help visualize the data*
| TERM        	| SUBJECT 	| CATALOG NBR 	| CLASS SECTION 	| COURSE DESCR                 	| INSTR LAST NAME 	| INSTR FIRST NAME 	| A  	| B 	| C 	| D 	| F 	| SATISFACTORY 	| NOT REPORTED 	| TOTAL DROPPED 	| AVG GPA 	|
|-------------	|---------	|-------------	|---------------	|------------------------------	|-----------------	|------------------	|----	|---	|---	|---	|---	|--------------	|--------------	|---------------	|---------	|
| Summer 2020 	| SPAN    	| 2302        	| 6             	| Intermediate Spanish II      	| Torres          	| Cristina         	| 11 	| 7 	| 0 	| 0 	| 0 	| 4            	| 0            	| 2             	| 2.895   	|
| Summer 2020 	| CHEM    	| 1112        	| 3             	| Fundamentals of Chm Lab      	| Zaitsev         	| Vladimir G       	| 4  	| 6 	| 2 	| 0 	| 0 	| 3            	| 0            	| 0             	| 2.203   	|
| Summer 2020 	| ECE     	| 8398        	| 2             	| Doctoral Research            	| Han             	| Zhu              	| 0  	| 0 	| 0 	| 0 	| 0 	| 4            	| 0            	| 0             	| 0       	|
| Summer 2020 	| ELCS    	| 8398        	| 4             	| Independent Study            	| Davis           	| Bradley          	| 0  	| 0 	| 0 	| 0 	| 0 	| 2            	| 0            	| 0             	| 0       	|
| Summer 2020 	| PHYS    	| 1101        	| 4             	| General Physics Laboratory I 	| Wood            	| Lowell T         	| 9  	| 7 	| 3 	| 0 	| 0 	| 10           	| 0            	| 0             	| 2.116   	|

*Raw CSV data sample*
```csv
TERM,SUBJECT,CATALOG NBR,CLASS SECTION,COURSE DESCR,INSTR LAST NAME,INSTR FIRST NAME,A,B,C,D,F,SATISFACTORY,NOT REPORTED,TOTAL DROPPED,AVG GPA
Summer 2020,SPAN,2302,6,Intermediate Spanish II,Torres,Cristina,11,7,0,0,0,4,0,2,2.895
Summer 2020,CHEM,1112,3,Fundamentals of Chm Lab,Zaitsev,Vladimir G,4,6,2,0,0,3,0,0,2.203
Summer 2020,ECE,8398,2,Doctoral Research,Han,Zhu,0,0,0,0,0,4,0,0,0
Summer 2020,ELCS,8398,4,Independent Study,Davis,Bradley,0,0,0,0,0,2,0,0,0
Summer 2020,PHYS,1101,4,General Physics Laboratory I,Wood,Lowell T,9,7,3,0,0,10,0,0,2.116
```

### Format (Spring 2021)

Identifier code: **not applicable**

*Markdown table to help visualize the data*
| TERM        | SUBJECT | CATALOG NBR | CLASS SECTION | CLASS NUMBER | COURSE DESCR                   | INSTR LAST NAME             | INSTR FIRST NAME        | A   | B  | C  | D | F | SATISFACTORY | NOT REPORTED | TOTAL DROPPED | AVG GPA |
|-------------|---------|-------------|---------------|--------------|--------------------------------|-----------------------------|-------------------------|-----|----|----|---|---|--------------|--------------|---------------|---------|
| Spring 2021 | LAW     | 5136        | 1             | 16227        | Interscholastic Moot Ct Retro  | Lawrence                    | Jim E                   | 0   | 0  | 0  | 0 | 0 | 8            | 0            | 0             | 0       |
| Spring 2021 | BIOL    | 6315        | 2             | 27362        | Neuroscience                   | Ziburkus                    | Jokubas                 | 10  | 0  | 0  | 0 | 0 | 0            | 0            | 0             | 3.967   |
| Spring 2021 | PHYS    | 8399        | 29            | 15931        | Doctoral Dissertation          | Ren                         | Zhifeng                 | 0   | 0  | 0  | 0 | 0 | 2            | 0            | 0             | 0       |
| Spring 2021 | MANA    | 4347        | 2             | 24479        | Ethics and Corp Soc Respon.    | Im                          | Taehoon                 | 26  | 16 | 1  | 0 | 0 | 5            | 0            | 0             | 3.188   |
| Spring 2021 | ECON    | 4373        | 1             | 24259        | Economics of Financial Crises  | Paluszynski                 | Radoslaw                | 8   | 6  | 2  | 0 | 0 | 17           | 0            | 1             | 1.227   |
| Spring 2021 | CIVE    | 3434        | 3             | 20513        | Fluid Mech and Hydraulic Engr  | Momen                       | Mostafa                 | 19  | 24 | 1  | 0 | 0 | 11           | 0            | 0             | 2.643   |

*Raw CSV data sample*
```csv
TERM,SUBJECT,CATALOG NBR,CLASS SECTION,CLASS NUMBER,COURSE DESCR,INSTR LAST NAME,INSTR FIRST NAME,A,B,C,D,F,SATISFACTORY,NOT REPORTED,TOTAL DROPPED,AVG GPA
Spring 2021,LAW,5136,1,16227,Interscholastic Moot Ct Retro,Lawrence,Jim E,0,0,0,0,0,8,0,0,0
Spring 2021,BIOL,6315,2,27362,Neuroscience,Ziburkus,Jokubas,10,0,0,0,0,0,0,0,3.967
Spring 2021,PHYS,8399,29,15931,Doctoral Dissertation,Ren,Zhifeng,0,0,0,0,0,2,0,0,0
Spring 2021,MANA,4347,2,24479,Ethics and Corp Soc Respon.,Im,Taehoon,26,16,1,0,0,5,0,0,3.188
Spring 2021,ECON,4373,1,24259,Economics of Financial Crises,Paluszynski,Radoslaw,8,6,2,0,0,17,0,1,1.227
Spring 2021,CIVE,3434,3,20513,Fluid Mech and Hydraulic Engr,Momen,Mostafa,19,24,1,0,0,11,0,0,2.643
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
