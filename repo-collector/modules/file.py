import requests
from dateutil.parser import parse as parsedate
from hashlib import sha256
from os import getenv, path
from datetime import datetime
from pathlib import Path
import gzip


class CachedFile:
    hash: str
    url: str

    def __init__(self, url: str):
        self.url = url
        hash = sha256()
        hash.update(url.encode())
        self.hash = hash.hexdigest()

    def probe(self) -> bool:
        r_head = requests.head(self.url)
        return r_head.status_code != 404

    def load(self, is_gzip: bool = False) -> Path:
        filepath = Path(getenv("CACHE_PATH", "cache")) / self.hash
        if path.isfile(filepath):
            r_head = requests.head(self.url)
            if "Last-Modified" in r_head.headers:
                modified_time = parsedate(r_head.headers["Last-Modified"]).astimezone()
                file_time = datetime.fromtimestamp(path.getmtime(filepath)).astimezone()
                if modified_time <= file_time:
                    return filepath
        r = requests.get(self.url)
        if is_gzip:
            _ = filepath.write_bytes(gzip.decompress(r.content))
        else:
            _ = filepath.write_bytes(r.content)
        return filepath
