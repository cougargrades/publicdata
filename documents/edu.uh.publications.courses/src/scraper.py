from urllib.parse import urlparse, parse_qs
from datetime import datetime
from bs4 import BeautifulSoup
import httpx
import time

MAX_RETRIES = 5

def getCurrentUndergraduateCatalog() -> (str, str):
  # get currently available catalog
  res = httpx.get('https://uh.edu/catalog-redirects/catalog-undergraduate')
  soup = BeautifulSoup(res.text, 'html.parser')
  # detect redirect
  redirection = soup.select_one('meta[http-equiv=refresh]')['content'] # "0;url=http://publications.uh.edu/index.php?catoid=34"
  # extract the url specifically, then process the querystring
  qs = parse_qs(urlparse(redirection[(len("0;url=")):]).query)
  CATOID = qs["catoid"][0] # "34"
  # extract the url specifically, then go to it
  res = httpx.get(redirection[(len("0;url=")):])
  soup = BeautifulSoup(res.text, 'html.parser')
  # 2019-2020 Undergraduate Catalog
  TITLE = soup.select_one('select[name=catalog] option[selected]').string
  return (CATOID, TITLE)

def getCurrentGraduateCatalog() -> (str, str):
  # get currently available catalog
  res = httpx.get('https://uh.edu/catalog-redirects/catalog-graduate')
  soup = BeautifulSoup(res.text, 'html.parser')
  # detect redirect
  redirection = soup.select_one('meta[http-equiv=refresh]')['content'] # "0;url=http://publications.uh.edu/index.php?catoid=33"
  # extract the url specifically, then process the querystring
  qs = parse_qs(urlparse(redirection[(len("0;url=")):]).query)
  CATOID = qs["catoid"][0] # "34"
  # extract the url specifically, then go to it
  res = httpx.get(redirection[(len("0;url=")):])
  soup = BeautifulSoup(res.text, 'html.parser')
  # 2019-2020 Undergraduate Catalog
  TITLE = soup.select_one('select[name=catalog] option[selected]').string
  return (CATOID, TITLE)


class CatalogIterator(object):
  def __init__(self, catoid, title):
    self.i = 0
    self.catoid = catoid
    self.title = title
    self.n = self.getPageCount()
  
  def __iter__(self):
    return self
  
  def __len__(self):
    return self.n

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
    href = parse_qs(urlparse(link).query)
    return href['coid'][0] if 'coid' in href and len(href['coid']) > 0 else None

  # Python3 compatibility
  def __next__(self):
    return self.next()

  def next(self):
    if self.i < self.n:
      self.i += 1
      # see: http://xion.io/post/code/python-retry-idiom.html
      for _ in range(MAX_RETRIES):
        try:
          # make http call for the specified page number
          res = httpx.get(self.uri(self.catoid, str(self.i)))
          soup = BeautifulSoup(res.text, 'html.parser')
          # select results
          data = soup.select('table.table_default td a[href^="preview_course_nopop.php"]')
          results = [(self.extractCoid(x['href']), x.string) for x in data]
          return results
        except Exception:
          # in the event of a failure, wait 10 seconds before trying again
          time.sleep(10)
          continue
        else:
          break
      else:
        raise Exception()
    else:
      raise StopIteration()
  
def scrapeCourse(catoid: str, coid: str, catalog_title: str) -> str:
  # course info
  # see: http://xion.io/post/code/python-retry-idiom.html
  for _ in range(MAX_RETRIES):
    try:
      res = httpx.get(f'http://publications.uh.edu/ajax/preview_course.php?catoid={catoid}&coid={coid}&show')
      soup = BeautifulSoup(res.text, 'html.parser')
      ## remove UH spam
      # <br> after the first link
      soup.select_one('a.link-open + br').decompose()
      # first link
      soup.select_one('a.link-open').decompose()
      # social media junk
      soup.select_one('.social-media-ajax').decompose()
      
      scrape_url = f'http://publications.uh.edu/preview_course_nopop.php?catoid={catoid}&coid={coid}'
      scrape_date = datetime.now()
      
      return str(BeautifulSoup(
        f'''
        <div class="edu-uh-publications-wrapper">
          <div style="display: none;" class="edu-uh-publications-metadata">
            <span title="catoid">{catoid}</span>
            <span title="coid">{coid}</span>
            <span title="catalog_title">{catalog_title}</span>
            <span title="scrape_url">{scrape_url}</span>
            <span title="scrape_date">{scrape_date.isoformat()}</span>
          </div>
          <div class="edu-uh-publications-primary-content">
            {str(soup)}
            <small><em>From: <a href="{scrape_url}">{catalog_title}</a></em></small>
            <br/>
            <small><em>Scraped: {scrape_date.strftime('%B %d, %Y @ %I:%M %p')}</em></small>
          </div>
        </div>
        ''',
        'html.parser').prettify())
    except Exception:
      # in the event of a failure, wait 10 seconds before trying again
      time.sleep(10)
      continue
    else:
      break
  else:
    raise Exception()
  
  