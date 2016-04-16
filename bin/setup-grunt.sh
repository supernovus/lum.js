#!/bin/sh

npm install grunt grunt-contrib-clean grunt-contrib-uglify grunt-newer load-grunt-config

cp  src/build/grunt/Gruntfile.js .
mkdir grunt
cp src/build/grunt/tasks/aliases.js ./grunt
cp src/build/grunt/tasks/uglify.js ./grunt
cp src/build/grunt/tasks/clean.js ./grunt

