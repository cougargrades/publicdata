#!/usr/bin/env python3

import os
import tarfile
from time import time
from shutil import rmtree
from pathlib import Path
from bundle import grade_distribution, subjects

documents_path = Path(__file__).parent / '..' / 'documents'
exports_path = Path(__file__).parent / '..' / 'exports'
exports_path.mkdir(exist_ok=True)

export_name = exports_path / f'publicdata-bundle-{int(time())}'
export_name.mkdir(exist_ok=True)

for fmt in documents_path.iterdir():
    if(fmt.name == 'edu.uh.grade_distribution'):
        grade_distribution.process(fmt.resolve(), export_name / fmt.name)
    if(fmt.name == 'com.collegescheduler.uh.subjects'):
        subjects.process(fmt.resolve(), export_name / fmt.name)

with tarfile.open(exports_path / f'{export_name.name}.tar.gz', 'w:gz') as tar:
    for item in export_name.iterdir():
        tar.add(name=item, arcname=item.name)
rmtree(export_name)
print(exports_path.resolve() / f'{export_name.name}.tar.gz')
