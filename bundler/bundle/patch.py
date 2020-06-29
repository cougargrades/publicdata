import json

'''

Generating a Patch file can be easy:
  
  str(
    Patch("catalog/CHEM 1331").add_action("merge", {"boring": True})
  )

'''

class Patch:
  '''A simple class'''
  def __init__(self, path: str, archetype="document"):
    if archetype not in ['document', 'collection']:
      raise ValueError("for constructor, parameter `archetype` must be one of: document, collection")
    self.format = 'io.cougargrades.publicdata.patch'
    self.target = {
      "archetype": archetype,
      "path": path
    }
    self.actions = []

  '''
  Add an action. Returns itself for chaining.
  '''
  def add_action(self, operation: str, payload, arrayfield=None, field=None, datatype=None):
    # check optionals
    # enforce archetype/operation pair
    if self.target["archetype"] == "document" and operation not in ['write', 'merge', 'append', 'increment']:
      raise ValueError("for archetype=`document`, operation must be one of: write, merge, append, increment")
    if self.target["archetype"] == "collection" and operation not in ['create']:
      raise ValueError("for archetype=`collection`, operation must be one of: create")
    # enforce optional parameters for specific operations
    if operation == 'append':
      if arrayfield == None or type(arrayfield) != str:
        raise ValueError("for operation=`append`, parameter `arrayfield` must be specified and of type str")
      else:
        self.actions += [{
          "operation": operation,
          "arrayfield": arrayfield,
          "datatype": datatype,
          "payload": payload
        }]
        return self
    if operation == 'increment':
      if field == None or type(field) != str:
        raise ValueError("for operation=`increment`, parameter `field` must be specified and of type str")
      else:
        self.actions += [{
          "operation": operation,
          "field": field,
          "payload": payload
        }]
        return self
    
    # add the operation
    self.actions += [{
      "operation": operation,
      "payload": payload
    }]
    return self

  def __str__(self):
    return json.dumps(self.__dict__)
  
  @staticmethod
  def DocRef():
    return 'firebase.firestore.DocumentReference'
