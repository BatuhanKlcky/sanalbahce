#!/usr/bin/env bash
# Sanal Bahçe — Google Play AAB üretimi (Bubblewrap TWA)
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v npx >/dev/null; then
  echo "Node/npx gerekli." >&2
  exit 1
fi

if [[ ! -f android-upload.keystore ]]; then
  echo "Upload keystore yok. İlk kez oluşturuyorum..."
  keytool -genkeypair -v \
    -keystore android-upload.keystore \
    -alias upload \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "${TWA_STORE_PASS:?TWA_STORE_PASS ayarla}" \
    -keypass "${TWA_KEY_PASS:?TWA_KEY_PASS ayarla}" \
    -dname "CN=Sanal Bahce, OU=Mobile, O=Batuhan Kilickaya, L=Istanbul, ST=Istanbul, C=TR"
fi

export BUBBLEWRAP_KEYSTORE_PASSWORD="${TWA_STORE_PASS}"
export BUBBLEWRAP_KEY_PASSWORD="${TWA_KEY_PASS}"

npx --yes @bubblewrap/cli@1.27.0 build --skipPwaValidation

echo ""
echo "AAB hazırsa app/build/outputs/bundle/release/ altında."
echo "Play Console → App integrity → App signing key SHA-256 değerini kopyala,"
echo "sonra ../.well-known/assetlinks.json içindeki REPLACE_WITH_PLAY_APP_SIGNING_SHA256 yerini doldur."
