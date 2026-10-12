"""Download the original public archive and verify events.csv before analysis."""
from pathlib import Path
import urllib.request
import zipfile
from analyze import digest
SOURCE='https://www.kaggle.com/api/v1/datasets/download/retailrocket/ecommerce-dataset'
EXPECTED='3745aa83238b1e6d44d8fda209807899f420084398f94ddf745f3cbcfecbf9e7'

def main():
    root=Path(__file__).resolve().parent/'data/raw';root.mkdir(exist_ok=True)
    archive=root/'source.zip';target=root/'events.csv'
    if target.exists() and digest(target)==EXPECTED:
        print('Verified existing events.csv');return
    request=urllib.request.Request(SOURCE,headers={'User-Agent':'commerce-conversion-research/1.0'})
    with urllib.request.urlopen(request,timeout=120) as response,archive.open('wb') as out:
        for b in iter(lambda:response.read(1024*1024),b''):out.write(b)
    with zipfile.ZipFile(archive) as z, z.open('events.csv') as src,target.open('wb') as out:
        for b in iter(lambda:src.read(1024*1024),b''):out.write(b)
    if digest(target)!=EXPECTED:raise ValueError('Source changed; review new data before accepting it')
    archive.unlink();print('Verified original events.csv')

if __name__=='__main__':main()
