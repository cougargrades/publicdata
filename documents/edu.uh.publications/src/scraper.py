from urllib.parse import urlparse, parse_qs
from bs4 import BeautifulSoup
import httpx

class CatalogIterator(object):
  def __init__(self):
    self.i = 0
    self.catoid = self.getCurrentCatalogId()
    self.n = self.getPageCount()
    self.title = self.getCurrentCatalogTitle()
  
  def __iter__(self):
    return self
  
  def __len__(self):
    return self.n

  # get the currently active catalogId
  def getCurrentCatalogId(self) -> str:
    # get currently available catalog
    res = httpx.get('https://uh.edu/catalog-redirects/catalog-undergraduate')
    soup = BeautifulSoup(res.text, 'html.parser')
    # detect redirect
    redirection = soup.select_one('meta[http-equiv=refresh]')['content'] # "0;url=http://publications.uh.edu/index.php?catoid=34"
    # extract the url specifically, then process the querystring
    qs = parse_qs(urlparse(redirection[(len("0;url=")):]).query)
    return qs["catoid"][0] # "34"

  def getCurrentCatalogTitle(self) -> str:
    # get currently available catalog
    res = httpx.get('https://uh.edu/catalog-redirects/catalog-undergraduate')
    soup = BeautifulSoup(res.text, 'html.parser')
    # detect redirect
    redirection = soup.select_one('meta[http-equiv=refresh]')['content'] # "0;url=http://publications.uh.edu/index.php?catoid=34"
    # extract the url specifically, then go to it
    res = httpx.get(redirection[(len("0;url=")):])
    soup = BeautifulSoup(res.text, 'html.parser')
    # 2019-2020 Undergraduate Catalog
    return soup.select_one('select[name=catalog] option[selected]').string

  # determine the number of pages to process
  def getPageCount(self) -> int:
    res = httpx.get(self.uri(self.catoid, '1'))
    soup = BeautifulSoup(res.text, 'html.parser')
    # "Page: 1 | 2 | 3 | 4 | 5 | 6 | 7 … Forward 6 -> 416"
    elem = soup.select_one('table.table_default td > a[href^="/search_advanced.php"]:last-child')
    return int(elem.string)

  # shorthand for generating the necessary url
  def uri(self, catoid: str, cpage: str):
    return f'http://publications.uh.edu/search_advanced.php?cur_cat_oid={catoid}&search_database=Search&search_db=Search&cpage={cpage}&location=3&filter[keyword]='
  
  # extract the "coid" querystring from the link
  def extractCoid(self, link: str) -> str:
    # http://publications.uh.edu/preview_course_nopop.php?catoid=34&coid=165991
    return parse_qs(urlparse(link).query)['coid'][0]

  # Python3 compatibility
  def __next__(self):
    return self.next()

  def next(self):
    if self.i <= self.n:
      self.i += 1
      # make http call for the specified page number
      res = httpx.get(self.uri(self.catoid, str(self.i)))
      soup = BeautifulSoup(res.text, 'html.parser')
      # select results
      data = soup.select('table.table_default td a[href^="preview_course_nopop.php"]')
      results = [(self.extractCoid(x['href']), x.string) for x in data]
      return results
    else:
      raise StopIteration()


