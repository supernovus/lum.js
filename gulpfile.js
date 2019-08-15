/**
 * Default Nano.js gulpfile for gulp 4.x
 */

var gulp   = require('gulp');
var babel  = require('gulp-babel');
var uglify = require('gulp-uglify');
var terser = require('gulp-terser');
var del    = require('del');
//var sass   = require('gulp-sass');
//var cssmin = require('gulp-clean-css');
var srcmap = require('gulp-sourcemaps');
var fcache = require('gulp-file-cache');

var es6cfile = '.gulp-cache-es6';
var es5cfile = '.gulp-cache-es5';
var ccfile = '.gulp-cache-css';
var es6cache = new fcache(es6cfile);
var es5cache = new fcache(es5cfile);
var csscache = new fcache(ccfile);

var srcjs  = 'src/js/**/*.js';
var destes6 = 'scripts/nano/';
var destes5 = 'scripts/nano-es5/';

//var srccss  = 'src/sass/**/*.scss';
//var destcss = 'style/nano/';

var downloaded_js  = 'scripts/ext';
var downloaded_css = 'style/ext';

gulp.task('clean-es5', function ()
{
  es5cache.clear();
  return del([destes5,es5cfile]);
});

gulp.task('clean-es6', function ()
{
  es6cache.clear();
  return del([destes6, es6cfile]);
});

gulp.task('clean-js', gulp.parallel('clean-es5','clean-es6'));

/*
gulp.task('clean-css', function ()
{
  csscache.clear();
  return del([destcss,ccfile]);
});
*/

var clean_tasks =
[
  'clean-js',
//  'clean-css',
]

gulp.task('clean', gulp.parallel(clean_tasks));

gulp.task('clean-deps', function ()
{
  var cleanitems =
  [
    downloaded_js,
    downloaded_css,
  ];
  return del(cleanitems);
});

gulp.task('distclean', gulp.parallel('clean', 'clean-deps'));

gulp.task('build-es6', function ()
{
  return gulp.src(srcjs, {since: gulp.lastRun('build-es6')})
    .pipe(es6cache.filter())
    .pipe(srcmap.init())
    .pipe(terser())
    .pipe(es6cache.cache())
    .pipe(srcmap.write('maps'))
    .pipe(gulp.dest(destes6));
});

gulp.task('build-es5', function ()
{
  return gulp.src(srcjs, {since: gulp.lastRun('build-es5')})
    .pipe(es5cache.filter())
    .pipe(srcmap.init())
    .pipe(babel())
    .pipe(uglify())
    .pipe(es5cache.cache())
    .pipe(srcmap.write('maps'))
    .pipe(gulp.dest(destes5));
});

gulp.task('build-js', gulp.parallel('build-es6', 'build-es5'));

/*
gulp.task('build-css', function ()
{
  return gulp.src(srccss, {since: gulp.lastRun('build-css')})
    .pipe(csscache.filter())
    .pipe(srcmap.init())
    .pipe(sass())
    .pipe(cssmin())
    .pipe(csscache.cache())
    .pipe(srcmap.write('maps'))
    .pipe(gulp.dest(destcss));
});
*/

var build_tasks =
[
  'build-js',
//  'build-css',
];

gulp.task('build', gulp.parallel(build_tasks)); 

gulp.task('rebuild', gulp.series('clean', 'build'));

gulp.task('watch-js', function ()
{
  return gulp.watch(srcjs, gulp.series('build-js'));
});

/*
gulp.task('watch-css', function ()
{
  return gulp.watch(srccss, gulp.series('build-css'));
});
*/

var watch_tasks =
[
  'watch-js',
//  'watch-css',
];

gulp.task('watch', gulp.parallel(watch_tasks));

gulp.task('default', gulp.series('build'));

