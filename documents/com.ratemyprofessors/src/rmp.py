#!/usr/bin/env python3
import json
import requests

def get_graphql_key():
  res = requests.get('https://www.ratemyprofessors.com/')
  if res.status_code == 200:
    html = res.content.decode()
    search = f'''"REACT_APP_GRAPHQL_AUTH":"'''
    i = html.find(search) + len(search)
    j = html.find('\"', i)
    return html[i:j]

GRAPHQL_KEY = get_graphql_key()
UH_SCHOOL_ID = 'U2Nob29sLTExMDk='

def graphQL(query: str, variables: dict):
  res = requests.post('https://www.ratemyprofessors.com/graphql', headers={
    "Authorization": f'Basic {GRAPHQL_KEY}'
  }, json={
    "query": query,
    "variables": variables,
  }, timeout=10)
  if res.status_code == 200:
    return json.loads(res.content.decode())

class SchoolSearchNode:
  city: str
  id: str
  legacyId: str
  name: str
  state: str
  def __init__(self, data):
    self.city = data['city']
    self.id = data['id']
    self.legacyId = data['legacyId']
    self.name = data['name']
    self.state = data['state']
  def __str__(self):
    return json.dumps(self.__dict__)
  def __repr__(self) -> str:
    return self.__str__()

def school_search(text: str) -> list[SchoolSearchNode]:
  res = graphQL('''
    query NewSearchSchoolsQuery(
      $query: SchoolSearchQuery!
    ) {
      newSearch {
        schools(query: $query) {
          edges {
            cursor
            node {
              id
              legacyId
              name
              city
              state
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }''', {
    "query": {
      "text": text
    }
  })
  base = res['data']['newSearch']['schools']['edges']
  return [SchoolSearchNode(item['node']) for item in base]

class InstructorSearchNode:
  department: str
  firstName: str
  id: str
  lastName: str
  legacyId: int
  #query: str
  def __init__(self, data: dict):
    self.department = data['department']
    self.firstName = data['firstName']
    self.id = data['id']
    self.lastName = data['lastName']
    self.legacyId = data['legacyId']
    #self.query = query
  def __str__(self):
    return json.dumps(self.__dict__)
  def __repr__(self) -> str:
    return self.__str__()

def instructor_search(text: str, schoolID: str) -> list[InstructorSearchNode]:
  res = graphQL('''
    query NewSearchTeachersQuery(
      $query: TeacherSearchQuery!
    ) {
      newSearch {
        teachers(query: $query) {
          edges {
            cursor
            node {
              id
              legacyId
              firstName
              lastName
              school {
                name
                id
              }
              department
            }
          }
        }
      }
    }''', {
    "query": {
      "schoolID": schoolID,
      "text": text
    }
  })
  base = res['data']['newSearch']['teachers']['edges']
  return [InstructorSearchNode(item['node']) for item in base]

# example:
if __name__ == '__main__':
  print(instructor_search('Kevin Long', schoolID='U2Nob29sLTExMDk='))