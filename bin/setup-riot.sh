#!/bin/sh

if [ -f "node_modules/grunt" ]; then
  npm install grunt-riot
fi

if [ -f "node_modules/gulp" ]; then
  npm install gulp-riot
fi
