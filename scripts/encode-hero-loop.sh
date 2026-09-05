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
# There are TWO sizes since 2026-09-04. 800-wide is the desktop pair; 480-wide
# is what a phone gets, wired up with <source media="(max-width: 767px)"> ahead
# of the desktop sources in index.html. A phone was pulling 634 KB of video to
# fill a 390px-wide column, which is most of a megabyte spent on pixels the
# device cannot resolve. The phone pair is held under 250 KB each.
#
# Budget: all four files together must stay under 3 MB (the repo is ~630 MB of
# git objects against a 1 GB soft limit).
set -euo pipefail

# Path updated 2026-09-04: the DWD tree moved event footage under
# season-1/events/<date>-<event>/source/. The old source-footage/ path is gone.
SRC="${SRC:-$HOME/iCloudDrive/Desktop/DWD/dwdPROSERIES/season-1/events/2026-07-06-summer-intensive/source/from-phone-hires/video-masters/SHOW__jazz_daisy_remi_evie_belle_yessa_adelyn.MOV}"
SS="${SS:-11.0}"          # start, seconds
DUR="${DUR:-7}"           # length, seconds
CROP="${CROP:-1400:2100:330:60}"   # w:h:x:y in the 3840x2160 master
OUT="${OUT:-video}"

vf_at() { echo "crop=${CROP},fps=24,scale=$1:-2"; }

# $1 = output width, $2 = filename suffix, $3 = x264 crf, $4 = vp9 crf.
# The smaller size is encoded HARDER, not just smaller: at 480 the artefacts
# crf 28 would leave are invisible at the size the frame is actually displayed,
# and the 250 KB ceiling is the whole point of the variant.
encode() {
  local w="$1" suffix="$2" crf264="$3" crfvp9="$4"
  ffmpeg -y -v error -ss "$SS" -t "$DUR" -i "$SRC" -an -vf "$(vf_at "$w")" \
    -c:v libx264 -crf "$crf264" -preset slow -pix_fmt yuv420p -movflags +faststart \
    "$OUT/hero-loop${suffix}.mp4"

  ffmpeg -y -v error -ss "$SS" -t "$DUR" -i "$SRC" -an -vf "$(vf_at "$w")" \
    -c:v libvpx-vp9 -crf "$crfvp9" -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
    "$OUT/hero-loop${suffix}.webm"
}

encode 800 ""     28 36   # desktop and tablet
encode 480 "-480" 32 46   # phones, the <= 767px <source>

ls -la "$OUT"/hero-loop*.mp4 "$OUT"/hero-loop*.webm
du -cb "$OUT"/hero-loop.mp4 "$OUT"/hero-loop.webm \
      "$OUT"/hero-loop-480.mp4 "$OUT"/hero-loop-480.webm \
  | tail -1 | awk '{print $1/1048576 " MB total (budget 3)"}'
