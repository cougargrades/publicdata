# UH Instructor RateMyProfessors mapping

A table of UH instructors and their estimated IDs on RateMyProfessors

## Format

Identifier code: `edu.ratemyprofessors`

*Markdown table to help visualize the data*
| sourceFirstName 	| sourceLastName 	| rmpId   	| rmpFirstName 	| rmpLastName 	|
|-----------------	|----------------	|---------	|--------------	|-------------	|
| Aaminah O       	| Durrani        	|         	|              	|             	|
| Aaron E         	| Reynolds       	| 96685   	| Aaron        	| Reynolds    	|
| Aaron Frederick 	| Ott            	| 1904392 	| Aaron        	| Ott         	|
| Aaron James     	| Corsi          	| 1779627 	| Aaron        	| Corsi       	|
| Aaron Mathew    	| Duplantier     	|         	|              	|             	|

*Raw CSV data sample*
```csv
sourceFirstName,sourceLastName,rmpId,rmpFirstName,rmpLastName
Aaminah O,Durrani,,,
Aaron E,Reynolds,96685,Aaron,Reynolds
Aaron Frederick,Ott,1904392,Aaron,Ott
Aaron James,Corsi,1779627,Aaron,Corsi
Aaron Mathew,Duplantier,,,
```

## Data Aquisition

Data was acquired via the use of the Python program available at `src/scrape.py`.

It was executed like so: `./scrape.py`
