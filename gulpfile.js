var gulp   = require('gulp');
var newer  = require('gulp-newer');
var uglify = require('gulp-uglify');
var del    = require('del');
//var srcmap = require('gulp-sourcemaps');

var srcjs  = 'src/js/**/*.js';
var destjs = 'scripts/nano/';

gulp.task('clean', function ()
{
  return del([destjs]);
});

gulp.task('build', function ()
{
  return gulp.src(srcjs)
    .pipe(newer(destjs))
//    .pipe(sourcemaps.init())
    .pipe(uglify())
//    .pipe(sourcemaps.write('.map'))
    .pipe(gulp.dest(destjs));
});

gulp.task('watch', function ()
{
  gulp.watch(srcjs, ['build']);
});

gulp.task('default', ['build']);
