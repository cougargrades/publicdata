# Interim Undergraduate Grade Policy

The CSV data here contains data that isn't normally included in the `edu.uh.grade_distribution` format. As per the [Interim Undergraduate Grade Policy](https://uh.edu/provost/policies-resources/student/interim-undergraduate-grade-policy/index), this includes the "SATISFACTORY" column which has the number of students that received a grade of "Satisfactory" for that course. As of July 15, 2020, this was exclusively applied to the Spring 2020 and Summer 2020 semesters in response to the COVID-19 health crisis.

## Format (Spring 2020)

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

## Format (Summer 2020)

Identifier code: **not applicable**

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