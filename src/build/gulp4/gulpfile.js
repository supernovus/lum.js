/**
 * Default Nano.js gulpfile for gulp 4.x
 */

var gulp   = require('gulp');
var uglify = require('gulp-uglify');
var del    = require('del');
//var sass   = require('gulp-sass');
//var cssmin = require('gulp-minify-css');
var srcmap = require('gulp-sourcemaps');

var srcjs  = 'src/js/**/*.js';
var destjs = 'scripts/nano/';

//var srcsass  = 'src/sass/**/*.scss';
//var destsass = 'style/nano/';

var downloaded_js  = 'scripts/ext';
var downloaded_css = 'style/ext';

gulp.task('clean', function ()
{
  var cleanitems =
  [
    destjs,
    //destsass,
  ];
  return del(cleanitems);
});

gulp.task('cleandeps', function ()
{
  var cleanitems =
  [
    downloaded_js,
    downloaded_css,
  ];
  return del(cleanitems);
});

gulp.task('distclean', gulp.parallel('clean', 'cleandeps'));

gulp.task('scripts', function ()
{
  return gulp.src(srcjs, {since: gulp.lastRun('scripts')})
    .pipe(srcmap.init())
    .pipe(uglify())
    .pipe(srcmap.write('maps'))
    .pipe(gulp.dest(destjs));
});

/*
gulp.task('styles', function ()
{
  return gulp.src(srcsass, {since: gulp.lastRun('styles')})
    .pipe(srcmap.init())
    .pipe(sass())
    .pipe(cssmin())
    .pipe(srcmap.write('maps'))
    .pipe(gulp.dest(destsass));
});
*/

var buildtasks =
[
  'scripts',
//  'styles',
];

gulp.task('build', gulp.parallel(buildtasks)); 

gulp.task('rebuild', gulp.series('clean', 'build'));

gulp.task('watch', function ()
{
  return gulp.watch(srcjs, gulp.parallel(buildtasks));
});

gulp.task('default', gulp.series('build'));

