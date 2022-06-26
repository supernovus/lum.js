/**
 * A helper for my project gulpfiles.
 */

const deps = {};

function req(lib, name)
{
  name = name || lib;
  return deps[name] = require(lib);
}

const gulp = req('gulp');
const del = req('del');
const connect = req('gulp-connect', 'connect');
const terser = req('gulp-terser', 'terser');
const sass = deps.sass = require('gulp-sass')(require('sass'));
const cssmin = req('gulp-clean-css', 'cssmin');
const srcmap = req('gulp-sourcemaps', 'srcmap');
const concat = req('gulp-concat', 'concat');
const FileCache = req('gulp-file-cache', 'FileCache');

let globalInstance = null;

class GulpHelper
{
  constructor()
  {
    this.tasks  = {};
    this.caches = {};
    this.dests  = {};
    this.babel  = null;
    this.$curId = null;
  }

  static getInstance()
  {
    if (globalInstance === null)
    {
      globalInstance = new GulpHelper();
    }
    return globalInstance;
  }

  get deps()
  {
    return deps;
  }

  useBabel(babel)
  {
    if (babel !== undefined)
    {
      this.babel = babel;
    }
    else if (this.babel === null)
    {
      this.babel = req('gulp-babel', 'babel');
    }
    return this;
  }

  tag(id)
  {
    this.$curId = id;
    return this;
  }

  cache(filename)
  {
    const id = this.$curId;
    filename = filename || '.gulp-cache-'+id;
    const cache = this.caches[id] = new FileCache(filename);
    cache.file = filename;
    return this;
  }

  dest(path)
  {
    const id = this.$curId;
    this.dests[id] = path;
    return this;
  }

  cleanTask(id)
  {
    const remove = [];
    if (this.caches[id])
    {
      const cache = this.caches[id];
      cache.clear();
      remove.push(cache.file);
    }

    if (this.dests[id])
    {
      const out = this.dests[id];
      if (Array.isArray(out))
        remove.push(...out);
      else
        remove.push(out);
    }

    return del(remove);
  } // cleanTask()

  jsTask(id, name, opts)
  {
    const sources = opts.sources;

    const maps = opts.maps ?? 'maps';

    const rules = opts.rules ?? {since: gulp.lastRun(name)};

    const cache = this.caches[id];
    const dest  = this.dests[id];

    const useBabel  = opts.babel ?? null;
    const babelOpts 
      = (typeof useBabel === 'object')
      ? useBabel
      : {presets:['@babel/env']};
    
    let stream = gulp.src(sources, rules);

    if (cache)
      stream = stream.pipe(cache.filter());

    stream = stream.pipe(srcmap.init());

    if (useBabel && this.babel)
      stream = stream.pipe(this.babel(babelOpts));

    stream = stream.pipe(terser());

    if (cache)
      stream = stream.pipe(cache.cache());

    stream = stream.pipe(srcmap.write(maps))
      .pipe(gulp.dest(dest))
      .pipe(connect.reload());

    return stream;
  }

  jsConcatTask(id, name, opts)
  {
    const srcpath = opts.path;
    const files = opts.files;
    const script = opts.script;
    
    const ext = opts.ext || '.js';

    const maps = opts.maps ?? 'maps';

    const rules = opts.rules ?? {};
    const dest  = this.dests[id];

    const useBabel  = opts.babel ?? null;
    const babelOpts 
      = (typeof useBabel === 'object')
      ? useBabel
      : {presets:['@babel/env']};
    
    const srcfiles = files.map(value => srcpath+value+ext);

    let stream = gulp.src(srcfiles, rules)
      .pipe(srcmap.init())
      .pipe(concat(script));

    if (useBabel && this.babel)
      stream = stream.pipe(this.babel(babelOpts));

    stream = stream.pipe(terser())
      .pipe(srcmap.write(maps))
      .pipe(gulp.dest(dest))
      .pipe(connect.reload());

    return stream;
  }

  cssTask(id, name, opts)
  {
    const sources = opts.sources;

    const maps = opts.maps ?? 'maps';

    const rules = opts.rules ?? {since: gulp.lastRun(name)};

    const cache = this.caches[id];
    const dest  = this.dests[id];

    let stream = gulp.src(sources, rules);

    if (cache)
      stream = stream.pipe(cache.filter());

    stream = stream.pipe(srcmap.init())
      .pipe(sass())
      .pipe(cssmin());

    if (cache)
      stream = stream.pipe(cache.cache());

    stream = stream.pipe(srcmap.write(maps))
      .pipe(gulp.dest(dest))
      .pipe(connect.reload());

    return stream;
  }

  add(name, def)
  {
    this.tasks[name] = def;
    gulp.task(name, def);
    return this;
  }

  addClean(name)
  {
    const id = this.$curId;
    name = name || 'clean-'+id;
    return this.add(name, () => this.cleanTask(id));
  }

  addCSS(opts={})
  {
    const id = opts.id ?? this.$curId;
    const name = opts.name || 'build-'+id;

    return this.add(name, () => this.cssTask(id, name, opts));
  }

  addJS(opts={})
  {
    const id = opts.id ?? this.$curId;
    const name = opts.name || 'build-'+id;

    let handler;

    if (opts.sources)
    {
      handler = () => this.jsTask(id, name, opts);
    }
    else if (opts.path && opts.files && opts.script)
    {
      handler = () => this.jsConcatTask(id, name, opts);
    }
    else 
    {
      throw new Error("No valid options for addJS found");
    }

    return this.add(name, handler);
  }

  parallel(name, ...tasks)
  {
    return this.add(name, gulp.parallel(...tasks));
  }

  series(name, ...tasks)
  {
    return this.add(name, gulp.series(...tasks));
  }

  alias(alias, existing)
  {
    if (this.tasks[existing] !== undefined)
    {
      this.tasks[alias] = this.tasks[existing];
      gulp.task(alias, this.tasks[existing]);
    }
    else 
    {
      console.warn("No such task", existing);
    }
  }

  watch(name, sources, task)
  {
    return this.add(name, function()
    {
      gulp.watch(sources, gulp.series(task));
    });
  }

}

module.exports = GulpHelper;
