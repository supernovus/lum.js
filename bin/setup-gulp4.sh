#!/bin/sh

if [ "$1" = "-g" ]; then
  shift;
  if [ "$1" = "-u" ]; then
    sudo npm uninstall -g gulp-cli
  fi
  sudo npm install -g "gulpjs/gulp-cli#4.0"
fi

if [ "$1" = "-u" ]; then
  npm uninstall gulp
fi

npm install "gulpjs/gulp#4.0" gulp-rename gulp-uglify gulp-sourcemaps gulp-if del

cp src/build/gulp4/gulpfile.js .

