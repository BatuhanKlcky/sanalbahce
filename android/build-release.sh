#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_WWW="$ROOT/android/app/src/main/assets/www"

mkdir -p "$APP_WWW/js" "$APP_WWW/vendor"
cp "$ROOT/index.html" "$ROOT/gizlilik.html" "$ROOT/manifest.json" \
  "$ROOT/icon-192.png" "$ROOT/icon-512.png" "$ROOT/icon-maskable-512.png" \
  "$ROOT/sw.js" "$APP_WWW/"
cp "$ROOT/js/"*.js "$APP_WWW/js/"

# Prefer packaged vendor copies for offline play.
if [[ ! -f "$APP_WWW/vendor/three.min.js" ]]; then
  curl -fsSL 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js' -o "$APP_WWW/vendor/three.min.js"
fi
if [[ ! -f "$APP_WWW/vendor/supabase.js" ]]; then
  curl -fsSL 'https://unpkg.com/@supabase/supabase-js@2.42.5/dist/umd/supabase.js' -o "$APP_WWW/vendor/supabase.js"
fi

python3 - <<'PY'
from pathlib import Path
p = Path("android/app/src/main/assets/www/index.html")
t = p.read_text()
t = t.replace(
    "https://unpkg.com/@supabase/supabase-js@2.42.5/dist/umd/supabase.js",
    "vendor/supabase.js",
).replace(
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    "vendor/three.min.js",
)
p.write_text(t)
scene = Path("android/app/src/main/assets/www/js/scene.js")
s = scene.read_text()
old = "if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}"
new = "if('serviceWorker' in navigator && location.protocol!=='file:'){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}"
if old in s:
    scene.write_text(s.replace(old, new))
PY

cd "$ROOT/android"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > local.properties
./gradlew :app:bundleRelease :app:assembleRelease

mkdir -p "$ROOT/android/dist" /opt/cursor/artifacts/play-store
cp app/build/outputs/bundle/release/app-release.aab "$ROOT/android/dist/sanalbahce-2.1.1.aab"
cp app/build/outputs/apk/release/app-release.apk "$ROOT/android/dist/sanalbahce-2.1.1.apk"
cp "$ROOT/android/dist/sanalbahce-2.1.1.aab" /opt/cursor/artifacts/play-store/
cp "$ROOT/android/dist/sanalbahce-2.1.1.apk" /opt/cursor/artifacts/play-store/
echo "Built:"
ls -lh "$ROOT/android/dist"
