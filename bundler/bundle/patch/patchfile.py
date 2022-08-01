import json

'''

Generating a Patch file can be easy:
  
  str(
    Patch("catalog/CHEM 1331").add_action("merge", {"boring": True})
  )

'''

class Patchfile:
  '''A simple class'''
  def __init__(self, path: str, archetype='document'):
    if archetype not in ['document', 'collection']:
      raise ValueError("for constructor, parameter `archetype` must be one of: document, collection")
    self.format = 'io.cougargrades.publicdata.patch'
    self.target = {
      "archetype": archetype,
      "path": path
    }
    self.actions = []

  def add_action(self, operation: str, payload, arrayfield=None, field=None, datatype=None, many=None):
    '''
    Add an action. Returns itself for chaining.
    '''
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
          "many": many,
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

  def write(self, payload):
    '''
    Shorthand for add_action(operation='write')
    
    Overwrites the Firestore document with the provided payload (destructive).
    '''
    return self.add_action(operation='write', payload=payload)
  
  def merge(self, payload):
    '''
    Shorthand for add_action(operation='merge')
    
    Merges the Firestore document with the provided payload.
    Only the provided fields are replaced, the rest of the document is kept intact.
    '''
    return self.add_action(operation='merge', payload=payload)
  
  def append(self, arrayfield, datatype, payload, many=False):
    '''
    Shorthand for add_action(operation='append')
    
    Adds the payload to the end of the an array within an existing Document

    Valid datatypes: 'number' | 'string' | 'object' | 'boolean' | 'firebase.firestore.DocumentReference'
    '''
    return self.add_action(operation='append', payload=payload, arrayfield=arrayfield, datatype=datatype, many=many)

  def increment(self, field: str, payload):
    '''
    Shorthand for add_action(operation='increment')
    
    Updates the value of a numeric type on an existing Document
    '''
    return self.add_action(operation='increment', payload=payload, field=field)
  
  def create(self, payload):
    '''
    Shorthand for add_action(operation='create')
    
    Creates a document with a generated, unique identifier that contains the properties of the payload.
    '''
    return self.add_action(operation='create', payload=payload)

  def __str__(self):
    return json.dumps(self.__dict__)
  
  @staticmethod
  def DocRef():
    return 'firebase.firestore.DocumentReference'
