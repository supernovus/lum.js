#!/bin/sh

if [ -d "node_modules/grunt" ]; then
  npm install grunt-sass
fi

if [ -d "grunt" ]; then
  cp src/build/grunt/tasks/sass.js ./grunt
fi

if [ -d "node_modules/gulp" ]; then
  npm install gulp-sass gulp-clean-css
fi

