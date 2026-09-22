#!/bin/bash
# Renders one Stitch slide to a PNG at 16:9. Brave is Chromium, so the headless
# screenshot path is the same; --virtual-time-budget waits for the CDN CSS and
# webfonts to land before the capture.
set -e
brave-browser --headless --disable-gpu --no-sandbox \
  --window-size=1920,1080 --screenshot="$2" \
  --virtual-time-budget=8000 --hide-scrollbars \
  --force-device-scale-factor=2 "$1" >/dev/null 2>&1
