#!/bin/sh

if [ -f "node_modules/grunt" ]; then
  npm install grunt-sass
fi

if [ -f "node_modules/gulp" ]; then
  npm install gulp-sass gulp-minify-css
fi
