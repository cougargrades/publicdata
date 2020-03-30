# UH Core Curriculum data

A CSV representation of UH's core curriculus by component area.

## Format

Identifier code: `edu.uh.core_by_component`

*Markdown table to help visualize the data*
| Department | Catalog Number | Description                          | Core Code | FA19 Component Area | Listed (DL) | FALL 2019 CHANGE | TCCN2019  |
| ---------- | -------------- | ------------------------------------ | --------- | ------------------- | ----------- | ---------------- | --------- |
| ENGL       | 1303           | First Year Writing I                 | 10        | Communication       |             |                  | ENGL 1301 |
| ENGL       | 1304           | First Year Writing II                | 10        | Communication       |             |                  | ENGL 1302 |
| ENGL       | 1370           | Freshman Composition II - Honors     | 10        | Communication       |             |                  |           |
| ENGL       | 2361           | Western World Literature II - Honors | 10        | Communication       |             |                  |           |

*Raw CSV data sample*
```csv
Department,Catalog Number,Description,"Core Code",FA19 Component Area,"Listed (DL)","FALL 2019 CHANGE",TCCN2019
ENGL,1303,First Year Writing I,10,Communication,,,ENGL 1301
ENGL,1304,First Year Writing II,10,Communication,,,ENGL 1302
ENGL,1370,Freshman Composition II - Honors,10,Communication,,,
ENGL,2361,Western World Literature II - Honors,10,Communication,,,
```

## Data Aquisition

Core curriculum data is acquired from the UH on their public [UH Core Resources page](https://uh.edu/undergraduate-committee/documents-internal/uhcoreresources/).

[Tabula](https://github.com/tabulapdf/tabula) was used to *roughly* generate CSV from the PDF, then manually editted to remove the formatting errors. [`table_formatter.py`](src/table_formatter.py) was also used to simplify this process.

This data was originally shared from [@cougargrades/json](https://github.com/cougargrades/json/blob/927d63cd4bb4436e8433df026ca0032536d415cb/uh.edu/uh-core-fall-2019-by-component-5_17_19.csv).

## Manifest

- uh-core-fall-2019-by-component-5_17_19.csv
