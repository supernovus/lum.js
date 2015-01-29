#!/bin/sh

VER=`node -pe "require('./riot_package.json').version"`

sed -i "s/VERSION/$VER/" riot.prefix.inc
