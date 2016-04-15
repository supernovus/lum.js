#!/bin/sh

if [ -d "node_modules/grunt" ]; then
  npm install grunt-riot
fi

if [ -d "node_modules/gulp" ]; then
  npm install gulp-riot
fi

