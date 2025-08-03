
import re
from typing import Union

# The 2012-2013 catalog was the first year of the Acalog system and there's disclaimers all over the place
DISABLED_CATALOGS = set(['2012-2013'])

FIELD_TCCNS_EQUIVALENT = set([
    "TCCNS Equivalent:",
    "tccns_equivalent",
    "tccns_equivalent:",
    "tccn_equivalent"
])

FIELD_FORMERLY = set([
    "Formerly",
    "formerly"
])

def extract_course_name(value: Union[str, None]) -> Union[str, None]:
    '''
    From `value`, extract the first instance that matches `\\w{3,4}\\ {1}\\d{4}` and cleanup string
    '''

    if value == None:
        return None
    
    pattern_course_name = r'\w{3,4}\ {0,1}\d{4}'

    matches = re.findall(pattern_course_name, value)
    if len(matches) > 0:
        # either: 'HIST3325' OR 'HIST 3325'
        # use first match only (UH didn't follow the former for these custom fields consistently)
        cn = f'{matches[0]}'.upper().strip()
        
        # 'HIST 3325'
        if re.match(r'\w{3,4}\ {0}\d{4}', cn) == None:
            return cn
        # 'HIST3325'
        else:
            for i in range(0, len(cn)):
                if cn[i].isdigit():
                    return f'{cn[:i]} {cn[i:]}'.strip()
            return cn
    
    return None

class TCCNSUpdate:
    '''
    '''

    def __init__(self, dict_data: any = None):
        if type(dict_data) == dict:
            self.Acquisition = dict_data.get("Acquisition", "")
            self.SemesterEffective = dict_data.get("SemesterEffective", "")
            self.FormerUHCourseNumber = dict_data.get("FormerUHCourseNumber", "")
            self.FormerUHCourseTitle = dict_data.get("FormerUHCourseTitle", "")
            self.ReplacementUHCourseNumber = dict_data.get("ReplacementUHCourseNumber", "")
            self.ReplacementUHCourseTitle = dict_data.get("ReplacementUHCourseTitle", "")
            self.Reference = dict_data.get("Reference", "")
        else:
            self.Acquisition = ""
            self.SemesterEffective = 0
            self.FormerUHCourseNumber = ""
            self.FormerUHCourseTitle = ""
            self.ReplacementUHCourseNumber = ""
            self.ReplacementUHCourseTitle = ""
            self.Reference = ""
        return
    
    def to_dict(self) -> dict:
        return self.__dict__

    Acquisition: str = ""
    '''
    One of: `Manual`, `FormerlyField`
    '''

    SemesterEffective: int = 0
    '''
    TermCode (Ex: 202103)
    '''

    FormerUHCourseNumber: str = ""
    '''
    Ex: ANTH 1300
    '''

    FormerUHCourseTitle: str = ""
    '''
    Ex: Introduction to Anthropology
    '''

    ReplacementUHCourseNumber: str = ""
    '''
    Ex: ANTH 2346
    '''
    
    ReplacementUHCourseTitle: str = ""
    '''
    Ex: Introduction to Anthropology
    '''

    Reference: str = ""
    '''
    Url to appear as a source for the change happening (Ex: https://...) 
    '''





