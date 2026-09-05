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

# NAME is the filename stem. The home hero is a twelve-entry rotation since
# 2026-09-05 and three of those entries are loops, so this script has to be able
# to cut more than one. NAME=hero-loop is entry B and stays byte-identical to
# what shipped; NAME=hero-k and NAME=hero-m are the other two.
NAME="${NAME:-hero-loop}"
# GRADE is an extra filter chain spliced in after the crop. Entry K is a bright
# white studio and needs warming to sit next to B's purple stage; B passes none.
GRADE="${GRADE:-}"
# CRFs are overridable because a 4K stage master and a 1080p studio clip do not
# hit the same file size at the same quality, and the per-file ceilings are hard.
CRF264_800="${CRF264_800:-28}"; CRFVP9_800="${CRFVP9_800:-36}"
CRF264_480="${CRF264_480:-32}"; CRFVP9_480="${CRFVP9_480:-46}"

# The three loops the rotation ships, for the record:
#
#   B (entry B, unchanged):
#     bash scripts/encode-hero-loop.sh
#
#   M (Summer Intensive showcase, Monotony). Re-cut 2026-09-05: the first cut
#   (SS=6.5 CROP=980:1470:920:400) put a folding table in the middle of the
#   frame with two dancers sitting on the edges. This one is the soloist in
#   the purple pool, alone and fully inside the crop for all seven seconds,
#   opening on a passe with the arm up and passing a leap mid-loop:
#     NAME=hero-m SS=34.5 DUR=7 CROP="900:1350:340:720" #     CRF264_800=33 CRFVP9_800=46 CRF264_480=37 CRFVP9_480=54 #     SRC=".../video-masters/SHOW__monotony_remi_daisy_evie_john_belle_adelyn.MOV" #     bash scripts/encode-hero-loop.sh
#
#   K (Dixon in the room). Its master runs 3.96 s and only the last ~1.2 s has
#   him arms-wide and clearly the subject, so that beat is ping-ponged into a
#   2.4 s intermediate first and the loop point becomes a reversal, not a snap:
#     ffmpeg -y -ss 2.75 -t 1.2 -i ~/iCloudDrive/Desktop/DWD/dwdPROSERIES/library/clips/teach-05_hero-arms-wide.mp4 #       -an -filter_complex "[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[o]" #       -map "[o]" -c:v libx264 -crf 14 -preset fast -pix_fmt yuv420p /tmp/K-pingpong.mp4
#     NAME=hero-k SRC=/tmp/K-pingpong.mp4 SS=0 DUR=2.41 CROP="720:1080:500:0" #     GRADE="eq=brightness=0.02:saturation=1.04,colorbalance=rm=0.03:gm=0.005:bh=-0.02,curves=all='0/0.045 0.5/0.5 1/1'" #     CRF264_800=31 CRFVP9_800=46 CRF264_480=34 CRFVP9_480=54 #     bash scripts/encode-hero-loop.sh

vf_at() {
  local chain="crop=${CROP}"
  [ -n "$GRADE" ] && chain="${chain},${GRADE}"
  echo "${chain},fps=24,scale=$1:-2"
}

# $1 = output width, $2 = filename suffix, $3 = x264 crf, $4 = vp9 crf.
# The smaller size is encoded HARDER, not just smaller: at 480 the artefacts
# crf 28 would leave are invisible at the size the frame is actually displayed,
# and the 250 KB ceiling is the whole point of the variant.
encode() {
  local w="$1" suffix="$2" crf264="$3" crfvp9="$4"
  ffmpeg -y -v error -ss "$SS" -t "$DUR" -i "$SRC" -an -vf "$(vf_at "$w")" \
    -c:v libx264 -crf "$crf264" -preset slow -pix_fmt yuv420p -movflags +faststart \
    "$OUT/${NAME}${suffix}.mp4"

  ffmpeg -y -v error -ss "$SS" -t "$DUR" -i "$SRC" -an -vf "$(vf_at "$w")" \
    -c:v libvpx-vp9 -crf "$crfvp9" -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
    "$OUT/${NAME}${suffix}.webm"
}

encode 800 ""     "$CRF264_800" "$CRFVP9_800"   # desktop and tablet
encode 480 "-480" "$CRF264_480" "$CRFVP9_480"   # phones, the <= 767px <source>

ls -la "$OUT"/${NAME}*.mp4 "$OUT"/${NAME}*.webm
du -cb "$OUT"/${NAME}.mp4 "$OUT"/${NAME}.webm \
      "$OUT"/${NAME}-480.mp4 "$OUT"/${NAME}-480.webm \
  | tail -1 | awk '{print $1/1048576 " MB total (budget 3)"}'
