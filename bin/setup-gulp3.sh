#!/bin/sh

if [ "$1" = "-g" ]; then
  shift;
  if [ "$1" = "-u" ]; then
    sudo npm uninstall -g gulp-cli
  fi
  sudo npm install -g gulp-cli
fi

if [ "$1" = "-u" ]; then
  npm uninstall gulp
fi

npm install gulp@^3.9.0 gulp-rename gulp-uglify gulp-sourcemaps gulp-newer gulp-if del run-sequence

cp src/build/gulp3/gulpfile.js .

