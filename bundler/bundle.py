#!/usr/bin/env python3

import os
from time import time
from pathlib import Path
from bundle import grade_distribution, subjects

documents_path = Path(__file__).parent / '..' / 'documents'
exports_path = Path(__file__).parent / '..' / 'exports'

export_name = exports_path / f'bundle-{int(time())}'
export_name.mkdir(exist_ok=True)

for fmt in documents_path.iterdir():
    if(fmt.name == 'edu.uh.grade_distribution'):
        grade_distribution.process(fmt.resolve(), export_name / fmt.name)
    if(fmt.name == 'com.collegescheduler.uh.subjects'):
        subjects.process(fmt.resolve(), export_name / fmt.name)
