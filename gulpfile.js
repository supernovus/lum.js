/**
 * Default Nano.js gulpfile for gulp 4.x
 */

const gulp   = require('gulp');
const babel  = require('gulp-babel');
const terser = require('gulp-terser');
const del    = require('del');
const sass   = require('gulp-sass')(require('sass'));
const cssmin = require('gulp-clean-css');
const srcmap = require('gulp-sourcemaps');
const fcache = require('gulp-file-cache');
const connect = require('gulp-connect');
const transform = require('gulp-transform');
const rename = require('gulp-rename');
const jsdoc  = require('gulp-jsdoc3');
const fs = require('fs');

const es6cfile = '.gulp-cache-es6';
const es5cfile = '.gulp-cache-es5';
const ccfile = '.gulp-cache-css';
const es6cache = new fcache(es6cfile);
const es5cache = new fcache(es5cfile);
const csscache = new fcache(ccfile);

const srcjs  = 'src/js/**/*.js';
const destes6 = 'scripts/nano/';
const destes5 = 'scripts/nano-es5/';

const srccss  = 'src/sass/**/*.scss';
const destcss = 'style/nano/';

const srctests = 'src/tests/'
const desttests = 'docs/tests/';

const downloaded_js  = 'scripts/ext';
const downloaded_css = 'style/ext';
const downloaded_conf = 'conf/installed_deps.json';

gulp.task('clean-es5', function ()
{
  es5cache.clear();
  return del([destes5,es5cfile]);
});

function clean_es6 ()
{
  es6cache.clear();
  return del([destes6, es6cfile]);
}
gulp.task('clean-es6', clean_es6);
gulp.task('clean-js',  clean_es6);

gulp.task('clean-all-js', gulp.parallel('clean-es5','clean-es6'));

gulp.task('clean-css', function ()
{
  csscache.clear();
  return del([destcss,ccfile]);
});

gulp.task('clean-tests', function ()
{
  return del(desttests);
});

gulp.task('clean-docs', function ()
{
  return del('docs/api');
});

const clean_tasks =
[
  'clean-js',
  'clean-css',
]

gulp.task('clean', gulp.parallel(clean_tasks));

const clean_all_tasks =
[
  'clean-all-js',
  'clean-css',
  'clean-tests',
  'clean-docs',
];

gulp.task('clean-all', gulp.parallel(clean_all_tasks));

gulp.task('clean-deps', function ()
{
  const cleanitems =
  [
    downloaded_js,
    downloaded_css,
    downloaded_conf,
  ];
  return del(cleanitems);
});

gulp.task('clean-npm', function ()
{
  return del(['package-lock.json','node_modules']);
});

gulp.task('distclean', gulp.series('clean-all','clean-deps','clean-npm'));

gulp.task('build-es6', function ()
{
  return gulp.src(srcjs, {since: gulp.lastRun('build-es6')})
    .pipe(es6cache.filter())
    .pipe(srcmap.init())
    .pipe(terser())
    .pipe(es6cache.cache())
    .pipe(srcmap.write('maps'))
    .pipe(gulp.dest(destes6))
    .pipe(connect.reload());
});
gulp.task('build-js', gulp.series('build-es6'));

gulp.task('build-es5', function ()
{
  return gulp.src(srcjs, {since: gulp.lastRun('build-es5')})
    .pipe(es5cache.filter())
    .pipe(srcmap.init())
    .pipe(babel({presets: ['@babel/env']}))
    .pipe(terser())
    .pipe(es5cache.cache())
    .pipe(srcmap.write('maps'))
    .pipe(gulp.dest(destes5))
    .pipe(connect.reload());
});

gulp.task('build-all-js', gulp.parallel('build-es6', 'build-es5'));

gulp.task('build-css', function ()
{
  return gulp.src(srccss, {since: gulp.lastRun('build-css')})
    .pipe(csscache.filter())
    .pipe(srcmap.init())
    .pipe(sass())
    .pipe(cssmin())
    .pipe(csscache.cache())
    .pipe(srcmap.write('maps'))
    .pipe(gulp.dest(destcss))
    .pipe(connect.reload());
});

gulp.task('build-tests', function ()
{ // I'm using a custom template engine utilizing 'transform' here.
  const loadedTemplates = {};

  function parseTemplate (content, file)
  {
    const config = JSON.parse(content);
    if (!config.template)
    {
      throw new Error("Missing 'template' in test configuration");
    }
    let template;
    if (config.template in loadedTemplates)
    {
      template = loadedTemplates[config.template];
    }
    else
    {
      template = fs.readFileSync(srctests+config.template, 'utf8');
      loadedTemplates[config.template] = template;
    }

    template = template.replace(/\{\{(.*?)\}\}/g, function (fullstr, varname)
    {
      varname = varname.trim();
      return varname in config ? config[varname] : fullstr;
    });

    return template;
  }

  return gulp.src(srctests+'*.json')
    .pipe(transform('utf8', parseTemplate))
    .pipe(rename({extname: '.html'}))
    .pipe(gulp.dest(desttests))
    .pipe(connect.reload());
});

var server;

gulp.task('build-docs', function (done)
{ // Using gulp-jsdoc3 to build API documentation.
  const config = require('./conf/jsdoc.json');
  gulp.src(['README.md', srcjs], {read: false})
  .pipe(jsdoc(config, done));
});

const build_tasks =
[
  'build-js',
  'build-css',
];

gulp.task('build', gulp.parallel(build_tasks)); 

const build_all_tasks =
[
  'build-all-js',
  'build-css',
  'build-tests',
  'build-docs',
];

gulp.task('build-all', gulp.parallel(build_all_tasks));

gulp.task('rebuild', gulp.series('clean', 'build'));

gulp.task('rebuild-all', gulp.series('clean-all', 'build-all'));

gulp.task('webserver', function ()
{
  server = connect.server(
  {
    livereload: true,
    port: 8000,
    host: '0.0.0.0',
  });
});

gulp.task('watch-js', function ()
{
  return gulp.watch(srcjs, gulp.series('build-js'));
});

gulp.task('watch-all-js', function ()
{
  return gulp.watch(srcjs, gulp.series('build-all-js'));
});

gulp.task('watch-css', function ()
{
  return gulp.watch(srccss, gulp.series('build-css'));
});

gulp.task('watch-docs', function ()
{
  return gulp.watch(srcjs, gulp.series('build-docs'));
});

gulp.task('watch-tests', function ()
{
  return gulp.watch(srctests+'*', gulp.series('build-tests'));
});

const watch_tasks =
[
  'watch-js',
  'watch-css',
  'watch-tests',
];

gulp.task('watch', gulp.parallel(watch_tasks));

const watch_ws_tasks =
[
  'webserver',
  'watch',
];

gulp.task('watch-ws', gulp.parallel(watch_ws_tasks));

const watch_docs_ws_tasks =
[
  'webserver',
  'watch-docs',
];

gulp.task('watch-docs-ws', gulp.parallel(watch_docs_ws_tasks));

gulp.task('default', gulp.series('build-js'));

