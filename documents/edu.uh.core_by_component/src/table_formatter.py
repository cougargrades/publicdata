#!/usr/bin/env python3

import os
import csv
import argparse

parser = argparse.ArgumentParser(description="Do stuff")
parser.add_argument('csvfile', type=str)
parser.add_argument('outfile', type=str)
args = parser.parse_args()

with open(args.csvfile, 'r') as csvfile:
    with open(args.outfile, 'w') as outfile:
        writer = csv.writer(outfile)
        reader = csv.reader(csvfile)
        next(reader) # skips header row

        for row in reader:
            # row => ['MATH 4388: History of Mathematics', '81',
            #         'Writing in the Disciplines', '', '', '']
            # alternatively:
            #        ['BIOL 2315 - Biology of Food', '30', 
            #         'Life & Physical Sciences', '', 'New Fall 2019', '']
            prepended = []
            # original table had unnecessary newlines that tabula preserved
            r = row[0]
            x = r.replace('\n', ' ').split(' ') # ['MATH', '4388:', 'History', 'of', 'Mathematics']
            prepended += [ x[0] ] # 'MATH'
            prepended += [ x[1].replace(':','').strip() ] # '4388'
            # substring of everything after the colon (`:`) and strip whitespace
            idx = r.index(':') if ':' in r else r.index('-') # sometimes they dont use colons, but dashes (`-`)
            prepended += [ r[idx + 1:].strip() ] # 'History of Mathematics'
            row.pop(0) # removes 'MATH 4388: History of Mathematics'
            writer.writerow(prepended + row)
