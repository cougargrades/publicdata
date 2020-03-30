# Subjects

A map of subject abbreviations (ex: `MATH`) to the complete description (ex: `Mathematics`).

## Format

Identifier code: `com.collegescheduler.uh.subjects`


*Raw JSON data sample*
```json
[
    {
        "id": "ARCH",
        "short": "ARCH",
        "long": "ARCH (Architecture)",
        "title": "ARCH (Architecture) "
    },
    {
        "id": "FINA",
        "short": "FINA",
        "long": "FINA (Finance)",
        "title": "FINA (Finance) "
    },
    {
        "id": "CHEM",
        "short": "CHEM",
        "long": "CHEM (Chemistry)",
        "title": "CHEM (Chemistry) "
    }
```

## Data Aquisition

Subjects data is acquired from College Scheduler.

The endpoint used is: `https://uh.collegescheduler.com/api/terms/Fall%202019/subjects`

For simplified programmatic use of the College Scheduler API, the [@cougargrades/collegescheduler](https://github.com/cougargrades/collegescheduler) tool was used.

For baseline documentation of the related College Scheduler endpoints, see [@au5ton/docs](https://github.com/au5ton/docs/wiki/CollegeScheduler-(*.collegescheduler.com)).

This data was originally shared from [@cougargrades/json](https://github.com/cougargrades/json/blob/bd89efc8ca1990071b9902ea7b57408c97d72883/uh.collegescheduler.com/subjects.json).

## Manifest

- subjects.json *(as of Fall 2019)*
