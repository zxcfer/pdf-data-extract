import time
import requests
import json
from bs4 import BeautifulSoup as bs
from pathlib import Path
import requests

r = requests.get('https://www.nar.realtor/research-and-statistics/research-reports/commercial-real-estate-metro-market-reports')
soup = bs(r.content, features='lxml')

web_links = soup.find_all('a', href=True)

links = []
for l in web_links:
  href = l['href']
  if isinstance(href, str):
    if href.endswith('pdf'):
      links.append(href)
      response = requests.get(href)

      filename = href.split('/')[-1]

      print("file: " + filename)
      print("url: " + href)

      pdf = open(filename, 'wb')
      pdf.write(response.content)
      pdf.close()

      time.sleep(10)
    
# links = [web_link['href'] for web_link in web_links]

#with open('links.txt', 'w') as convert_file: 
#  convert_file.write(json.dumps(links))

