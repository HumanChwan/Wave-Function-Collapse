#!/bin/bash

circuit_images=("bridge" "component" "connection" "corner" "dskew" "skew" "substrate" "t" "track" "transition" "turn" "viad" "vias" "wire")
knot_images=("corner" "cross" "empty" "line" "t")
summer_images=("cliff" "cliffcorner" "cliffturn" "grass" "grasscorner" "road" "roadturn" "water_a" "water_b" "water_c" "watercorner" "waterside" "waterturn") 


for image in ${summer_images[@]}; do
	curl -s "https://raw.githubusercontent.com/mxgmn/WaveFunctionCollapse/master/samples/Summer/$image%200.png" -o $image.png
done
