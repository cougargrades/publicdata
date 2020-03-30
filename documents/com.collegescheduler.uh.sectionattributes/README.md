# Section Attribute data

Includes:

- A map of sectionAttributes to the detailed name
    - Ex: `30` -> `(30) Core-Life & Physical Sciences`.
    - File(s): `manifest.json`
- A list of courses and their respective sectionAttribute.
    - Ex: `Fall 2019 10.jsonl`, `Fall 2019 20.jsonl`, ...
    - File(s): `TERM YYYY ID.jsonl`


## Format

Identifier code: `com.collegescheduler.uh.sectionattributes`


*Raw JSON data sample (manifest.json)*
```json
{
    "sectionAttributes": [
        {
            "id": "10",
            "title": "(10) Core-Communication"
        },
        {
            "id": "20",
            "title": "(20) Core-Mathematics"
        },
        {
            "id": "30",
            "title": "(30) Core-Life & Physical Sciences"
        },
        ...
    ]
}
```

*Raw JSONL data sample (FALL 2019 30.jsonl), one JSON object per line*
```json
{"id": "BIOL|1310", "subjectLong": "BIOL (Biology)", "subjectShort": "BIOL", "subjectId": "BIOL", "number": "1310", "topic": null, "displayTitle": "1310 General Biology 1", "title": "General Biology 1", "titleLong": "BIOL (Biology) 1310 - General Biology 1", "description": null, "hasTopics": false, "corequisites": null, "prerequisites": null, "sectionAttribute": "30"}
{"id": "BIOL|1361", "subjectLong": "BIOL (Biology)", "subjectShort": "BIOL", "subjectId": "BIOL", "number": "1361", "topic": null, "displayTitle": "1361 Intro To Biological Science 1", "title": "Intro To Biological Science 1", "titleLong": "BIOL (Biology) 1361 - Intro To Biological Science 1", "description": null, "hasTopics": false, "corequisites": null, "prerequisites": null, "sectionAttribute": "30"}
{"id": "CHEM|1301", "subjectLong": "CHEM (Chemistry)", "subjectShort": "CHEM", "subjectId": "CHEM", "number": "1301", "topic": null, "displayTitle": "1301 Foundations of Chem", "title": "Foundations of Chem", "titleLong": "CHEM (Chemistry) 1301 - Foundations of Chem", "description": null, "hasTopics": false, "corequisites": null, "prerequisites": null, "sectionAttribute": "30"}
```

*Raw JSON data sample of one model (Fall 2019 30.jsonl)*
```json
{
    "id": "BIOL|1310",
    "subjectLong": "BIOL (Biology)",
    "subjectShort": "BIOL",
    "subjectId": "BIOL",
    "number": "1310",
    "topic": null,
    "displayTitle": "1310 General Biology 1",
    "title": "General Biology 1",
    "titleLong": "BIOL (Biology) 1310 - General Biology 1",
    "description": null,
    "hasTopics": false,
    "corequisites": null,
    "prerequisites": null,
    "sectionAttribute": "30"
}
```

## Data Aquisition

Section attribute data is acquired from College Scheduler.

These tools were used to generate this data:
- [@cougargrades/collegescheduler](https://github.com/cougargrades/collegescheduler): to consistently access the API and handle authentication.
- [sectionattributes.py](src/README.md): to scrape and save the data to disk

For baseline documentation of the related College Scheduler endpoints, see [@au5ton/docs](https://github.com/au5ton/docs/wiki/CollegeScheduler-(*.collegescheduler.com)).

This data was originally shared from [@cougargrades/json](https://github.com/cougargrades/json/tree/bd89efc8ca1990071b9902ea7b57408c97d72883/uh.collegescheduler.com/corecurriculum/sectionattributes/src).

## Manifest

- manifest.json
- Fall 2019 10.jsonl
- Fall 2019 20.jsonl
- Fall 2019 30.jsonl
- Fall 2019 40.jsonl
- Fall 2019 50.jsonl
- Fall 2019 60.jsonl
- Fall 2019 70.jsonl
- Fall 2019 80.jsonl
- Fall 2019 81.jsonl
- Fall 2019 90.jsonl
- Fall 2019 D.jsonl
- Fall 2019 DR.jsonl
- Fall 2019 FR.jsonl
- Fall 2019 JR.jsonl
- Fall 2019 K.jsonl
- Fall 2019 LA.jsonl
- Fall 2019 M.jsonl
- Fall 2019 MS.jsonl
- Fall 2019 NB.jsonl
- Fall 2019 O.jsonl
- Fall 2019 OP.jsonl
- Fall 2019 PH.jsonl
- Fall 2019 RECO.jsonl
- Fall 2019 REQO.jsonl
- Fall 2019 SO.jsonl
- Fall 2019 SR.jsonl
- Fall 2019 WEEKENDU.jsonl
- Fall 2019 W.jsonl
- Summer 2019 10.jsonl
- Summer 2019 20.jsonl
- Summer 2019 30.jsonl
- Summer 2019 40.jsonl
- Summer 2019 50.jsonl
- Summer 2019 60.jsonl
- Summer 2019 70.jsonl
- Summer 2019 80.jsonl
- Summer 2019 81.jsonl
- Summer 2019 90.jsonl
- Summer 2019 D.jsonl
- Summer 2019 DR.jsonl
- Summer 2019 FR.jsonl
- Summer 2019 JR.jsonl
- Summer 2019 LA.jsonl
- Summer 2019 M.jsonl
- Summer 2019 MS.jsonl
- Summer 2019 NB.jsonl
- Summer 2019 O.jsonl
- Summer 2019 OP.jsonl
- Summer 2019 PH.jsonl
- Summer 2019 REQO.jsonl
- Summer 2019 SO.jsonl
- Summer 2019 SR.jsonl

