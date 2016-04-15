#!/bin/sh

if [ -d "node_modules/grunt" ]; then
  npm install grunt-sass
fi

if [ -d "node_modules/gulp" ]; then
  npm install gulp-sass gulp-minify-css
fi

