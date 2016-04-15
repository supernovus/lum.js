var gulp   = require('gulp');
var newer  = require('gulp-newer');
var uglify = require('gulp-uglify');
var del    = require('del');
//var sass   = require('gulp-sass');
//var cssmin = require('gulp-minify-css');
var srcmap = require('gulp-sourcemaps');
var runseq = require('run-sequence');

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

gulp.task('distclean', ['clean', 'cleandeps']);

gulp.task('scripts', function ()
{
  return gulp.src(srcjs)
    .pipe(newer(destjs))
    .pipe(srcmap.init())
    .pipe(uglify())
    .pipe(srcmap.write('maps'))
    .pipe(gulp.dest(destjs));
});

/*
gulp.task('styles', function ()
{
  return gulp.src(srcsass)
    .pipe(newer(destsass))
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

gulp.task('build', buildtasks); 

gulp.task('rebuild', function ()
{
  runseq('clean', 'build');
});

gulp.task('watch', function ()
{
  gulp.watch(srcjs, ['scripts']);
  //gulp.watch(srcsass, ['styles']);
});

gulp.task('default', ['build']);
