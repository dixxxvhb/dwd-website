"""Hero + link-preview images for /merch/.

The hero is the back of the black tour hoodie cropped to the print, so it reads
as a tour poster on the page's dark ground. Source: the store's own product
shot (2000px). Re-run when the print changes (a new tour stop, a new name):

  python scripts/build-merch-images.py

Writes images/merch/tour-back-{640,1040}.webp and images/og/merch.jpg.
"""
import io, json, urllib.request
from PIL import Image

data = json.load(open('data/merch.json', encoding='utf-8'))
# Every hoodie's back is the same print, but only some products carry the flat
# shot (others show the back on a model against a wall, which crops badly).
# This one is flat; if it ever leaves the store, pick another flat one by eye.
FLAT_BACK = '26-27-proseries-tour-hoody-elite-audrey-haylie-prep-marilynn'
back = next(h['back'] for h in data['hoodies'] if h['handle'] == FLAT_BACK)
front = next(c['img'] for h in data['hoodies'] if h['group'] == 'staff' and h['label'] == 'Ms Tori'
             for c in h['colors'] if c['name'] == 'Black')

def get(url):
    req = urllib.request.Request(url + '?width=2000', headers={'User-Agent': 'Mozilla/5.0'})
    return Image.open(io.BytesIO(urllib.request.urlopen(req).read())).convert('RGB')

b = get(back)
W, H = b.size
print('back', back.split('/')[-1], b.size)
# The print sits in the middle of the garment body: all fabric, no white ground.
crop = b.crop((int(W * .30), int(H * .315), int(W * .70), int(H * .80)))
# Guard: a corner that is not fabric means the crop slid onto the white ground.
for xy in ((2, 2), (crop.width - 3, 2), (2, crop.height - 3), (crop.width - 3, crop.height - 3)):
    assert max(crop.getpixel(xy)) < 60, f'crop corner {xy} is not black fabric: {crop.getpixel(xy)}'
print('hero crop', crop.size)
for w in (640, 1040):
    im = crop.resize((w, round(w * crop.height / crop.width)), Image.LANCZOS)
    im.save(f'images/merch/tour-back-{w}.webp', quality=82, method=6)

# Link preview: the poster crop on the left edge of a black card, front on the right.
og = Image.new('RGB', (1200, 630), (11, 11, 11))
p = crop.resize((round(630 * crop.width / crop.height), 630), Image.LANCZOS)
og.paste(p, (90, 0))
f = get(front)
fw = 560
fc = f.crop((int(f.width * .14), int(f.height * .16), int(f.width * .86), int(f.height * .88)))
fc = fc.resize((fw, fw), Image.LANCZOS)
og.paste(fc, (600, 35))
og.save('images/og/merch.jpg', quality=86)
print('og', og.size)
