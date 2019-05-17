/**
 * Default Nano.js gulpfile for gulp 4.x
 */

var gulp   = require('gulp');
var uglify = require('gulp-uglify');
var del    = require('del');
var sass   = require('gulp-sass');
var cssmin = require('gulp-clean-css');
var srcmap = require('gulp-sourcemaps');
var fcache = require('gulp-file-cache');

var jcfile = '.gulp-cache-js';
var ccfile = '.gulp-cache-css';
var jcache = new fcache(jcfile);
var ccache = new fcache(ccfile);

var srcjs  = 'src/js/**/*.js';
var destjs = 'scripts/nano/';

var srccss  = 'src/sass/**/*.scss';
var destcss = 'style/nano/';

var downloaded_js  = 'scripts/ext';
var downloaded_css = 'style/ext';

gulp.task('clean-js', function ()
{
  jcache.clear();
  return del([destjs,jcfile]);
});

gulp.task('clean-css', function ()
{
  ccache.clear();
  return del([destcss,ccfile]);
});

var clean_tasks =
[
  'clean-js',
  'clean-css',
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

gulp.task('build-js', function ()
{
  return gulp.src(srcjs, {since: gulp.lastRun('build-js')})
    .pipe(jcache.filter())
    .pipe(srcmap.init())
    .pipe(uglify())
    .pipe(jcache.cache())
    .pipe(srcmap.write('maps'))
    .pipe(gulp.dest(destjs));
});

gulp.task('build-css', function ()
{
  return gulp.src(srccss, {since: gulp.lastRun('build-css')})
    .pipe(ccache.filter())
    .pipe(srcmap.init())
    .pipe(sass())
    .pipe(cssmin())
    .pipe(ccache.cache())
    .pipe(srcmap.write('maps'))
    .pipe(gulp.dest(destcss));
});

var build_tasks =
[
  'build-js',
  'build-css',
];

gulp.task('build', gulp.parallel(build_tasks)); 

gulp.task('rebuild', gulp.series('clean', 'build'));

gulp.task('watch-js', function ()
{
  return gulp.watch(srcjs, gulp.series('build-js'));
});

gulp.task('watch-css', function ()
{
  return gulp.watch(srccss, gulp.series('build-css'));
});

var watch_tasks =
[
  'watch-js',
  'watch-css',
];

gulp.task('watch', gulp.parallel(watch_tasks));

gulp.task('default', gulp.series('build'));

