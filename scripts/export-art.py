"""Compress rendered source assets. Run from the repository with Python + Pillow."""
from pathlib import Path
from sys import argv
from PIL import Image, ImageOps
source=Path('art-source-renders');out=Path('public/art')
out.mkdir(parents=True,exist_ok=True)
for name in argv[1:] or ['arena-stage','blind','morris','auction','point','remove','knight','hex','rectangles','mancala','cubes','bagh','secret','grass1','grass3','exile','divine','equations','codeLock','pyramid','fragments','spot','scale','fence','tower']:
    image=Image.open(source/(name+'.png')).convert('RGB')
    image.save(out/(name+'.webp'),quality=80 if name=='arena-stage' else 74,method=6)
    if name=='arena-stage':
        ImageOps.fit(image,(1200,630)).save(out/'social.jpg',quality=85,optimize=True,progressive=True)
