#!/usr/bin/env python3
"""Build every still the home hero rotation needs.

The home hero is a twelve-entry rotation (2026-09-05). Nine entries are stills
and three are muted loops; a loop still needs a poster, which is also its LCP
image and its reduced-motion / no-autoplay fallback. So all twelve entries need
the same four files, and this script makes all forty-eight from the masters.

Run from the repo root:

    python scripts/build-hero-images.py

It is deliberately reproducible: the master paths live here, nothing is edited
by hand afterwards, and it writes images/photos/hero/manifest.json with the real
pixel width of every file so index.html's srcset descriptors cannot drift from
what is actually on disk.

Two shapes come out of it.
  - Photo entries are exported as the FULL frame resized to 1600 wide with no
    crop. The hero is a tall column on desktop and a short band on a phone, and
    a file cropped to either one is wrong in the other. object-fit: cover plus a
    per-entry focal point in index.html does the cropping at render time, which
    is the only place that knows the container's shape.
  - Loop posters are cut from the video master with THE SAME crop the encode
    script uses, so the poster and the first frame of the loop are the same
    picture. Anything else pops when the video fades in.

Masters are read-only. Nothing in iCloud or the catalog is ever written to.
"""

import json
import os
import subprocess
import sys
from PIL import Image, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'images', 'photos', 'hero')
HOME = os.path.expanduser('~')

LIB = HOME + '/iCloudDrive/Desktop/DWD/_library/caa-2021-2026/Seasons/Season-4/GROOVE/Groove Photos'
SI = (HOME + '/iCloudDrive/Desktop/DWD/dwdPROSERIES/season-1/events/2026-07-06-summer-intensive'
      '/source/from-phone-hires/video-masters')

# letter -> master. 'photo' entries carry a path; 'frame' entries carry the video
# master plus the ffmpeg crop and seek the encode script used for that loop.
ENTRIES = {
    'A': {'kind': 'photo', 'src': 'images/photos/high res pose — hero crop.jpeg'},
    'B': {'kind': 'frame', 'src': SI + '/SHOW__jazz_daisy_remi_evie_belle_yessa_adelyn.MOV',
          'ss': '11.0', 'crop': '1400:2100:330:60'},
    'C': {'kind': 'photo', 'src': LIB + '/John-Aura/131_Aura_10.JPG'},
    'D': {'kind': 'photo', 'src': LIB + '/John-Heart of Gold/176_Heart Of Gold_38.JPG'},
    'E': {'kind': 'photo', 'src': LIB + '/John-Aura/131_Aura_66.JPG'},
    'F': {'kind': 'photo', 'src': 'images/photos/dwdc-7I6A3762.jpg'},
    'G': {'kind': 'photo', 'src': 'images/photos/A-06-06-25~4993-Enhanced-NR.jpg'},
    'H': {'kind': 'photo', 'src': 'images/photos/opt/dwdc-amuse-08-1600.webp'},
    'I': {'kind': 'photo', 'src': 'images/photos/dwdc-7I6A3724.jpg'},
    'J': {'kind': 'photo', 'src': 'images/photos/opt/story-si-firebird-1600.webp'},
    'K': {'kind': 'frame', 'src': HOME + '/iCloudDrive/Desktop/DWD/dwdPROSERIES/library/clips/teach-05_hero-arms-wide.mp4',
          'ss': '2.75', 'crop': '720:1080:500:0',
          # ss 2.75 is where the K loop starts (see scripts/encode-hero-loop.sh
          # for the ping-pong intermediate it is actually cut from), and this is
          # the same warm-and-lift grade the loop is encoded with, so the poster
          # and the first frame of the video are the same picture.
          'grade': (1.03, 1.04)},
    'M': {'kind': 'frame', 'src': SI + '/SHOW__monotony_remi_daisy_evie_john_belle_adelyn.MOV',
          # Re-cut 2026-09-05: the first pass sat two dancers on the frame
          # edges with the folding table in the middle. This crop is the solo in
          # the purple pool, held for the full seven seconds.
          'ss': '34.5', 'crop': '900:1350:340:720'},
}

# Wide (large) and narrow (small) target widths, and the encoder quality. The
# repo ceiling for all forty-eight files together is 2.5 MB, which is what these
# numbers are tuned to: the hero column is at most ~770 CSS px, so 1600 is a 2x
# file and does not need to be pretty at 100%.
SIZES = [(1600, 'wide'), (800, 'narrow')]
WEBP_Q = {1600: 72, 800: 74}
JPEG_Q = {1600: 72, 800: 74}


def load(letter, spec):
    if spec['kind'] == 'photo':
        p = spec['src']
        if not os.path.isabs(p):
            p = os.path.join(ROOT, p)
        return Image.open(p).convert('RGB')

    tmp = os.path.join(OUT, '_frame_%s.png' % letter)
    subprocess.run(
        ['ffmpeg', '-y', '-v', 'error', '-ss', spec['ss'], '-i', spec['src'],
         '-frames:v', '1', '-vf', 'crop=' + spec['crop'], tmp],
        check=True)
    im = Image.open(tmp).convert('RGB')
    im.load()
    os.remove(tmp)
    if spec.get('grade'):
        bright, sat = spec['grade']
        im = ImageEnhance.Brightness(im).enhance(bright)
        im = ImageEnhance.Color(im).enhance(sat)
    return im


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = {}
    total = 0

    for letter in sorted(ENTRIES):
        spec = ENTRIES[letter]
        src = load(letter, spec)
        rec = {'src': spec['src'], 'files': {}}

        # A master narrower than 800 has only one useful size: the 800 variant
        # would be the same pixels at a different quality, i.e. a second file
        # for nothing. K's clip is 720 wide after its portrait crop.
        wanted = [t for t, _ in SIZES if t == 1600 or src.width > 800]

        for target in wanted:
            w = min(target, src.width)
            h = round(src.height * w / src.width)
            im = src.resize((w, h), Image.LANCZOS)

            for ext, kwargs in (
                ('webp', dict(quality=WEBP_Q[target], method=6)),
                ('jpg', dict(quality=JPEG_Q[target], optimize=True, progressive=True)),
            ):
                name = '%s-%d.%s' % (letter, target, ext)
                path = os.path.join(OUT, name)
                im.save(path, **kwargs)
                size = os.path.getsize(path)
                total += size
                rec['files'][name] = {'w': w, 'h': h, 'bytes': size}

        rec['w'] = rec['files']['%s-1600.jpg' % letter]['w']
        rec['h'] = rec['files']['%s-1600.jpg' % letter]['h']
        manifest[letter] = rec
        print('%s  %5dx%-5d  %s' % (
            letter, rec['w'], rec['h'],
            '  '.join('%s %6d' % (k.split('-', 1)[1], v['bytes'])
                      for k, v in sorted(rec['files'].items()))))

    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=1, sort_keys=True)

    mb = total / 1048576.0
    print('\ntotal %.3f MB (budget 2.5)' % mb)
    if mb > 2.5:
        print('OVER BUDGET', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
