
# see: https://stackoverflow.com/q/845058
def file_len(fname):
  with open(fname) as f:
    for i, l in enumerate(f):
      pass
  return i + 1
