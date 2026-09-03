#!/usr/bin/env bash
# Re-encode the home hero loop (item 2.1). Run on the PC, never the Neo:
# ffmpeg on a fanless 8GB A18 is not the tool for a 4K master.
#
# To change the clip, edit SRC / SS / DUR / CROP and re-run.
#
# The crop is PORTRAIT on purpose. The home hero photo is a tall column, not a
# band: it measures roughly 0.65:1 at 1280 and 0.93:1 at 390, and is only ever
# wide at the 900px breakpoint. A landscape loop dropped in there gets 70% of
# itself thrown away by object-fit: cover and the composition goes with it.
# 2:3 out of the 3840x2160 master fits the real container and still punches in
# far enough that the dancers read at hero scale.
#
# Budget: the two files together must stay under 3 MB (the repo is ~630 MB of
# git objects against a 1 GB soft limit). Today they are 1.46 MB.
set -euo pipefail

SRC="${SRC:-$HOME/iCloudDrive/Desktop/DWD/dwdPROSERIES/source-footage/summer-intensive-jul-2026/from-phone-hires/video-masters/SHOW__jazz_daisy_remi_evie_belle_yessa_adelyn.MOV}"
SS="${SS:-11.0}"          # start, seconds
DUR="${DUR:-7}"           # length, seconds
CROP="${CROP:-1400:2100:330:60}"   # w:h:x:y in the 3840x2160 master
OUT="${OUT:-video}"

VF="crop=${CROP},fps=24,scale=800:-2"

ffmpeg -y -v error -ss "$SS" -t "$DUR" -i "$SRC" -an -vf "$VF" \
  -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart \
  "$OUT/hero-loop.mp4"

ffmpeg -y -v error -ss "$SS" -t "$DUR" -i "$SRC" -an -vf "$VF" \
  -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
  "$OUT/hero-loop.webm"

ls -la "$OUT"/hero-loop.*
du -cb "$OUT"/hero-loop.mp4 "$OUT"/hero-loop.webm | tail -1 | awk '{print $1/1048576 " MB total (budget 3)"}'
