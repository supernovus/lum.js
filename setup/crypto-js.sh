#!/bin/bash
# Setup crypto-js to be compatible with the pre-canned dist we used before.
# This must be run from the main directory: ./setup/crypto-js.sh

NODEMODS=./node_modules
TERSER=$NODEMODS/.bin/terser
INDIR=$NODEMODS/crypto-js
OUTDIR=$INDIR/components

[ ! -d "$INDIR" ] && echo "run 'npm install' first" && exit 1

mkdir -p $OUTDIR

for INFILE in $INDIR/*.js; do
  FILENAME="$(basename $INFILE .js)"
  OUTFILE="$OUTDIR/$FILENAME-min.js"
  OUTLINK="$OUTDIR/$FILENAME.js"
  LINKDEST="../$FILENAME.js"
  echo "-- $FILENAME"
  ln -sf $LINKDEST $OUTLINK
  $TERSER $INFILE > $OUTFILE
done
