## Usage

```bash
uv pip install --editable ..\..\_common\
```

### Caching

HTTP GET responses from acalog.py will be cached into [tempfile.gettempdir()](https://docs.python.org/3.12/library/tempfile.html#tempfile.gettempdir) + `/io.cougargrades.publicdata.acalog_cache/{hex(sha1_hash(request_url))}.json.gz` on your local machine.

acalog.py will consider cached files to be valid for up to `LOCAL_HTTP_CACHE_TTL` (30 days). Upon startup, acalog.py will cleanup the cache within this directory for files past the configured `LOCAL_HTTP_CACHE_TTL`. Significant usage of acalog.py could cause this folder to become large (~2GB uncompressed for every course in every catalog as of 2025-08-03).
