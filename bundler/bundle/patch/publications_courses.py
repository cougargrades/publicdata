from pathlib import Path

def generate(source: Path, destination: Path):
    print(source.name)
    # destination.mkdir(exist_ok=True)
    # with open(source / 'subjects.json', 'r') as f:
    #     data = json.loads(f.read())
    #     entries = [unwrap(s) for s in data]
    #     results = dict()
    #     for e in entries:
    #         results[e['abbreviation']] = e['description']
    #     with open(destination / 'entries.json', 'w') as ex:
    #         ex.write(json.dumps(entries))
    #     with open(destination / 'dictionary.json', 'w') as ex:
    #         ex.write(json.dumps(results))