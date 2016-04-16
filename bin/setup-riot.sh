#!/bin/sh

if [ -d "node_modules/grunt" ]; then
  npm install grunt-riot
fi

if [ -d "grunt" ]; then
  cp src/build/grunt/tasks/riot.js ./grunt
fi

if [ -d "node_modules/gulp" ]; then
  npm install gulp-riot
fi

