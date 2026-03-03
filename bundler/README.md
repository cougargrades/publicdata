
Setup:

```bash
uv venv
./.venv/Scripts/activate
uv pip install -r requirements.txt
uv pip install --upgrade debugpy


```

Run:

```bash

#python ./bundler/bundle.py --skiptar --skipmove -o "./exports"
python -m debugpy --listen 5678 --wait-for-client ./bundler/bundle.py --skiptar --skipmove -o "./exports"
```
