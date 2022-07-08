/**
 * Default Lum.js gulpfile for gulp 4.x
 */

// Load our libraries first.

const tasks = require('lum-gulp-helper').getInstance();
const gulp = tasks.deps.gulp;
const connect = require('gulp-connect');
const transform = require('gulp-transform');
const rename = require('gulp-rename');
const jsdoc  = require('gulp-jsdoc3');
const fs = require('fs');

// Define some rules.

const js_sources   = 'src/js/**/*.js';
const css_sources  = 'src/sass/**/*.scss';
const test_sources = 'src/tests/';

const core = require('./src/core/build.json');

//console.log("setting up targets", core);

tasks.tag('es6').dest('scripts/nano/').cache().addClean().addJS(
{
  name: 'build-core-es6',
  path: core.path,
  files: core.sources,
  concat: core.script,
  cache: false,
}).addJS(
{
  name: 'build-libs-es6',
  sources: js_sources,
});

tasks.tag('es5').dest('scripts/nano-es5/').cache().addClean().addJS(
{
  name: 'build-core-es5',
  babel: true,
  path: core.path,
  files: core.sources,
  concat: core.script,
  cache: false,
}).addJS(
{
  name: 'build-libs-es5',
  babel: true,
  sources: js_sources,
});

tasks.tag('css').dest('style/nano/').cache().addClean().addCSS(
{
  sources: css_sources
});

tasks.tag('tests').dest('docs/tests/').addClean();
tasks.tag('docs').dest('docs/api/').addClean();
tasks.tag('ext-js').dest('scripts/ext').addClean();;
tasks.tag('ext-css').dest('style/ext').addClean();
tasks.tag('ext-conf').dest('conf/installed_deps.json').addClean();
tasks.tag('npm').dest(['package-lock.json','node_modules']).addClean();

tasks.parallel('clean-deps', 'clean-ext-js', 'clean-ext-css', 'clean-ext-conf');
tasks.alias('clean-js', 'clean-es6');
tasks.parallel('clean-all-js', 'clean-es5', 'clean-es6');
tasks.parallel('clean', 'clean-js', 'clean-css');
tasks.parallel('clean-all', 'clean-all-js', 'clean-css', 'clean-tests', 'clean-docs');
tasks.series('distclean', 'clean-all', 'clean-deps', 'clean-npm');

tasks.parallel('build-es6', 'build-core-es6', 'build-libs-es6');

tasks.alias('build-js', 'build-es6');

tasks.parallel('build-es5', 'build-core-es5', 'build-libs-es5');

tasks.parallel('build-all-js', 'build-es6', 'build-es5');

tasks.add('build-tests', function ()
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
      template = fs.readFileSync(test_sources+config.template, 'utf8');
      loadedTemplates[config.template] = template;
    }

    template = template.replace(/\{\{(.*?)\}\}/g, function (fullstr, varname)
    {
      varname = varname.trim();
      return varname in config ? config[varname] : fullstr;
    });

    return template;
  }

  return gulp.src(test_sources+'*.json')
    .pipe(transform('utf8', parseTemplate))
    .pipe(rename({extname: '.html'}))
    .pipe(gulp.dest(tasks.dests.tests))
    .pipe(connect.reload());
});

var server;

tasks.add('build-docs', function (done)
{ // Using gulp-jsdoc3 to build API documentation.
  const config = require('./conf/jsdoc.json');
  gulp.src(['README.md', js_sources], {read: false})
  .pipe(jsdoc(config, done));
});

tasks.parallel('build', 'build-js', 'build-css');

const build_all_tasks =
[
  'build-all-js',
  'build-css',
  'build-tests',
  'build-docs',
];
tasks.parallel('build-all', ...build_all_tasks);

tasks.series('rebuild', 'clean', 'build');
tasks.series('rebuild-all', 'clean-all', 'build-all');

tasks.add('webserver', function ()
{
  server = connect.server(
  {
    livereload: true,
    port: 8000,
    host: '0.0.0.0',
  });
});

tasks.watch('watch-js',     js_sources,       'build-js');
tasks.watch('watch-all-js', js_sources,       'build-all-js');
tasks.watch('watch-css',    css_sources,      'build-css');
tasks.watch('watch-docs',   js_sources,       'build-docs');
tasks.watch('watch-tests',  test_sources+'*', 'build-tests');

tasks.parallel('watch', 'watch-js', 'watch-css', 'watch-tests');
tasks.parallel('watch-ws', 'webserver', 'watch');
tasks.parallel('watch-docs-ws', 'webserver', 'watch-docs');

tasks.series('default', 'build-js');
