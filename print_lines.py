import pathlib

path = pathlib.Path('backend/index.js')
lines = path.read_text(encoding='utf-8').splitlines(True)
for i, line in enumerate(lines, start=1):
    if 160 <= i <= 200:
        print(f"{i:04d}: {line.rstrip()}")
