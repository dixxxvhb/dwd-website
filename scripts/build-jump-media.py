#!/usr/bin/env python3
"""Build the JUMP 2026 + drop-in media for the October 2026 site refresh.

Run from the repo root:  python scripts/build-jump-media.py <jump-dir> <wod-raw-dir> <wod-final>

  <jump-dir>     the JUMP photos pulled from the app's family-media bucket,
                 numbered 001-104 in upload order (Dixon picked from a contact
                 sheet of exactly that numbering)
  <wod-raw-dir>  the Oct 21 Wednesday WOD drop-in clips (IMG_9206-9224, Photos
                 export on the Neo)
  <wod-final>    "Wednesday WOD - 4K FINAL.mp4"

Masters are read-only. Writes images/photos/opt/jump-*.webp,
images/photos/opt/dropin-wod-*.webp and video/dropin-wod-*.mp4 (H.264 only: the VP9 pair came out larger).
"""
import os, subprocess, sys
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OPT = os.path.join(ROOT, 'images', 'photos', 'opt')
VID = os.path.join(ROOT, 'video')

# number -> slug. Faces: roster dancers and Dixon only; 102 is a parent upload
# with no faces (the team jackets on the rack).
JUMP = {
    '014': 'team', '034': 'team-b', '090': 'team-c', '044': 'first-place',
    '048': 'first-place-b', '040': 'peace', '039': 'pose', '074': 'backbend',
    '086': 'line', '001': 'mini', '057': 'backstage', '102': 'jackets',
    '019': 'solo',
}

# Stills for /schedule/: clip, second. All shot from behind or wide.
STILLS = {'reach': ('IMG_9212', 1.6), 'balance': ('IMG_9215', 2.0),
          'lunge': ('IMG_9211', 2.4), 'walkover': ('IMG_9224', 4.6)}


def save_pair(im, stem, sizes=(800, 1600)):
    for w in sizes:
        # A 1536-wide portrait still earns its 2x file; anything under 1200 does not.
        if w != sizes[0] and im.width < 1200:
            continue
        r = im.resize((min(w, im.width), round(im.height * min(w, im.width) / im.width)), Image.LANCZOS)
        r.save(os.path.join(OPT, '%s-%d.webp' % (stem, w)), quality=74, method=6)


def frame(src, t):
    tmp = os.path.join(OPT, '_f.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', src, '-frames:v', '1', tmp], check=True)
    im = Image.open(tmp).convert('RGB'); im.load(); os.remove(tmp)
    return im


def ff(*a):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)


def main(jdir, raw, final):
    for n, slug in JUMP.items():
        im = ImageOps.exif_transpose(Image.open(os.path.join(jdir, n + '.jpg'))).convert('RGB')
        save_pair(im, 'jump-' + slug)
    for slug, (clip, t) in STILLS.items():
        save_pair(frame(os.path.join(raw, clip + '.MOV'), t), 'dropin-wod-' + slug)

    # Drop-in panel loop: two backs-to-camera takes, 4:5, silent, ~7 s.
    a, b = os.path.join(raw, 'IMG_9212.MOV'), os.path.join(raw, 'IMG_9215.MOV')
    fc = ('[0:v]trim=0.2:3.3,setpts=PTS-STARTPTS[a];[1:v]trim=0:4.0,setpts=PTS-STARTPTS[b];'
          '[a][b]concat=n=2:v=1,crop=iw:iw*5/4:0:(ih-iw*5/4)*0.55,scale=%d:-2,fps=30,format=yuv420p[v]')
    for w, tag, crf in ((720, '', 30), (480, '-480', 32)):
        ff('-i', a, '-i', b, '-filter_complex', fc % w, '-map', '[v]', '-an', '-c:v', 'libx264',
           '-preset', 'slow', '-crf', str(crf), '-movflags', '+faststart', os.path.join(VID, 'dropin-wod-loop%s.mp4' % tag))
    ff('-ss', '0.2', '-i', a, '-frames:v', '1', '-vf', 'crop=iw:iw*5/4:0:(ih-iw*5/4)*0.55,scale=720:-2',
       os.path.join(OPT, 'dropin-wod-loop-poster.webp'))

    # Home featured video: the finished reel, with its sound, 720x1280.
    ff('-i', final, '-vf', 'scale=720:-2', '-c:v', 'libx264', '-preset', 'slow', '-crf', '30',
       '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', os.path.join(VID, 'wod-reel.mp4'))
    ff('-ss', '3.5', '-i', final, '-frames:v', '1', '-vf', 'scale=720:-2', os.path.join(OPT, 'wod-reel-poster.webp'))


if __name__ == '__main__':
    main(*sys.argv[1:4])
