#!/bin/bash

images=("bridge" "component" "connection" "corner" "dskew" "skew" "substrate" "t" "track" "transition" "turn" "viad" "vias" "wire")

for image in ${images[@]}; do
	curl -s "https://raw.githubusercontent.com/mxgmn/WaveFunctionCollapse/master/samples/Circuit/$image.png" -o $image.png
done
