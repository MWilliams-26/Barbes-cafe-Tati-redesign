#!/usr/bin/env bash
# Rebuilds public/assets/img from the restaurants' own published photography.
# Sources and licensing status for every file: RESEARCH.md > Asset record.
# Needs curl and ImageMagick 7 (`magick`).
set -euo pipefail
cd "$(dirname "$0")/.."
out=public/assets/img
src=$(mktemp -d)
trap 'rm -rf "$src"' EXIT
mkdir -p "$out/barbes" "$out/tati"

# Barbès: photography published on barbesrestaurant.com (client-owned).
barbes_base="https://www.barbesrestaurant.com/_next/static/immutable/media"
barbes=(
	"bar bartender-pouring.3yh6wmcxdr571.jpg 700,1200"
	"storefront hero.063tsdyzef702.jpg 800,1284"
	"tagines tagine-spread-overhead.424yawini898s.jpg 900,1800"
	"moules moules-mariniere.3xs15yk_-0kr0.jpg 600,1000"
	"tagine-lid shrimp-tagine-lid-lift.0nmfwcp2c2xo2.jpg 600,1000"
	"coupe cocktail-barbes.1rnkqt3-fgnwy.jpg 600,1000"
	"cocktail green-cocktail.22s63sk84b7c6.jpg 600,1000"
	"wine pinot-noir-bottle.11ltp0dgnl2tz.jpg 600,1000"
	"wedding wedding-embrace.30_8a27-o3oas.jpg 600,1000"
	"logo logo.2pwi1yvy85xzb.jpg 160,320"
)
for row in "${barbes[@]}"; do
	read -r name file widths <<<"$row"
	curl -sfL -A "Mozilla/5.0" "$barbes_base/$file" -o "$src/$file"
	for w in ${widths//,/ }; do
		magick "$src/$file" -auto-orient -resize "${w}x>" -strip -quality 78 "$out/barbes/$name-$w.webp"
	done
	echo "barbes/$name done"
done

# Café Tati, Google listing photos as mirrored on joe.coffee (uploader not confirmed; see RESEARCH.md).
joe="https://pub-ba1a74be17d7442a9f2541946eb9510e.r2.dev/shops/483cbb2d-966d-49b2-adc7-c2bbb46b71c5"
tati_joe=("exterior 0" "brunch 1" "counter 3" "croque 4")
for row in "${tati_joe[@]}"; do
	read -r name n <<<"$row"
	curl -sfL "$joe/$n.jpg" -o "$src/joe-$n.jpg"
	magick "$src/joe-$n.jpg" -auto-orient -strip -quality 80 "$out/tati/$name-800.webp"
	echo "tati/$name done"
done

# Café Tati, frames from the café's own Instagram posts (client-owned; 640px previews only).
# name  post-id  crop (WxH+X+Y on the 360x640 preview)
tati_ig=(
	"bears DXP0OhOCLv9 361x250+0+0"
	"tagine DW9ypc5Df_B 361x290+0+345"
	"copper DXcsL4XDP5F 361x250+0+0"
)
for row in "${tati_ig[@]}"; do
	read -r name id crop <<<"$row"
	url=$(curl -sL -A "facebookexternalhit/1.1" "https://www.instagram.com/p/$id/" |
		grep -oE 'og:image" content="[^"]+"' | head -1 | sed 's/og:image" content="//;s/"$//;s/&amp;/\&/g')
	curl -sfL "$url" -o "$src/$id.jpg"
	magick "$src/$id.jpg" -crop "$crop" +repage -strip -quality 82 "$out/tati/$name-360.webp"
	echo "tati/$name done"
done

# Social preview cards (1200x630).
magick "$src/tagine-spread-overhead.424yawini898s.jpg" -resize 1200x630^ -gravity center -extent 1200x630 -strip -quality 82 "$out/og-barbes.jpg"
magick "$src/joe-0.jpg" -resize 1200x630^ -gravity center -extent 1200x630 -strip -quality 82 "$out/og-tati.jpg"
magick \( "$src/joe-0.jpg" -resize 600x630^ -gravity center -extent 600x630 \) \
	\( "$src/bartender-pouring.3yh6wmcxdr571.jpg" -resize 600x630^ -gravity center -extent 600x630 \) \
	+append -strip -quality 82 "$out/og-famille.jpg"
echo "og cards done"
