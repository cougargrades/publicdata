# UH Publications Catalog data

A CSV + HTML representation of UH's entire catalog. `index.csv` shows a manifest of which `catoid` and `coid` values correspond with which courses. The HTML files are the contents of the corresponding catalog entry.

Example catalog entry: [http://publications.uh.edu/preview_course_nopop.php?catoid=34&coid=164989](http://publications.uh.edu/preview_course_nopop.php?catoid=34&coid=164989)

## Format

Identifier code: `edu.uh.publications.courses`

*Markdown table to help visualize the data*

| catoid | catalog_title | page_number                          | coid | course_title |
| ---------- | ---------- | ----------                          | ---------- | ---------- |
| 34 | 2019-2020 Undergraduate Catalog | 1 | 164989 | ACCT 2331 -  Accounting Principles 1 - Financial |
| 34 | 2019-2020 Undergraduate Catalog | 1 | 164990 | ACCT 2332 -  Accounting Principles 2 -Managerial |
| 34 | 2019-2020 Undergraduate Catalog | 1 | 164991 | ACCT 3377 -  Cost Accounting |

*Raw CSV data sample*
```csv
catoid,catalog_title,page_number,coid,course_title
34,2019-2020 Undergraduate Catalog,1,164989,ACCT 2331 -  Accounting Principles 1 - Financial
34,2019-2020 Undergraduate Catalog,1,164990,ACCT 2332 -  Accounting Principles 2 -Managerial
34,2019-2020 Undergraduate Catalog,1,164991,ACCT 3377 -  Cost Accounting
```

## Data Aquisition

Data was acquired via the use of the Python program available at `src/main.py`.

It was executed like so: `./main.py ../raw --delay 1000`

## Manifest

- `34/` => _2019-2020 Undergraduate Catalog_
