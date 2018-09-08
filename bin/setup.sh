#!/bin/sh

if [ "$#" -lt 1 ]; then
  echo "usage: $0 <buildsystem> [-g]"
  echo
  echo "Build systems:"
  echo
  echo " gulp4"
  echo " gulp3"
  echo " grunt"
  echo
  echo "If you use -g as the second parameter, the build system command line"
  echo "tool will be installed globally."
  echo
  exit 1
fi

PKGS="http-request uglify-js uglify-es yargs compare-versions"

if [ "$1" = "gulp4" ]; then
  if [ "$2" = "-g" ]; then
    sudo npm install -g gulp-cli
  fi
  PKGS="$PKGS gulpjs/gulp#4.0 gulp-uglify gulp-sourcemaps gulp-file-cache del gulp-sass gulp-clean-css"
  cp src/build/gulp4/gulpfile.js .
elif [ "$1" = "gulp3" ]; then
  if [ "$2" = "-g" ]; then
    sudo npm install -g gulp-cli
  fi
  PKGS="$PKGS gulp@^3.9.0 gulp-uglify gulp-sourcemaps gulp-file-cache del run-sequence gulp-sass gulp-clean-css"
  cp src/build/gulp3/gulpfile.js .
elif [ "$1" = "grunt" ]; then
  PKGS="$PKGS grunt grunt-contrib-clean grunt-contrib-uglify grunt-newer load-grunt-config grunt-sass"
  cp src/build/grunt/Gruntfile.js .
  mkdir grunt
  cp src/build/grunt/tasks/aliases.js ./grunt
  cp src/build/grunt/tasks/uglify.js ./grunt
  cp src/build/grunt/tasks/sass.js ./grunt
  cp src/build/grunt/tasks/clean.js ./grunt
else
  echo "unknown build system specified."
  exit 1
fi

npm install --no-save $PKGS
