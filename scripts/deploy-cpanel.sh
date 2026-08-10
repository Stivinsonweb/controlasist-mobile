#!/usr/bin/env bash
# Actualiza la rama deploy-cpanel con un build de producción nuevo, SIN tocar la
# rama de código fuente (web-main) ni el working directory del proyecto — todo el
# trabajo sucio ocurre en una copia temporal aislada.
#
# Uso: bash scripts/deploy-cpanel.sh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_URL="https://github.com/Stivinsonweb/controlasist-mobile.git"
BUILD_OUT="$PROJECT_DIR/dist/controlasist-web/browser"
TMP_DIR="$(mktemp -d)"

echo "==> Generando build de producción..."
cd "$PROJECT_DIR"
npx ng build

if [ ! -f "$BUILD_OUT/.htaccess" ]; then
  echo "ERROR: no se encontró .htaccess en $BUILD_OUT — revisa que public/.htaccess exista." >&2
  exit 1
fi

echo "==> Copiando build a carpeta temporal aislada ($TMP_DIR)..."
cp -r "$BUILD_OUT/." "$TMP_DIR/"

echo "==> Empaquetando y subiendo a deploy-cpanel..."
cd "$TMP_DIR"
git init -q
git checkout -b deploy-cpanel -q
git remote add origin "$REMOTE_URL"
git add -A
git commit -q -m "Build de producción para cPanel ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
git push -f origin deploy-cpanel

echo "==> Limpiando carpeta temporal..."
rm -rf "$TMP_DIR"

echo "==> Listo. deploy-cpanel actualizada. Rama de código fuente del proyecto (web-main) no fue tocada."
