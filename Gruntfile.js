/**
 * Default Gruntfile for Nano.js
 *
 * Copy this into your own projects, and customize it for your own needs.
 */
module.exports = function (grunt)
{
  // We use load-grunt-tasks to load everything required.
  require("load-grunt-tasks")(grunt);
 
  // Add a 'download' target. Remove for project-specific Gruntfiles.
  require("./lib/download-deps.js")(grunt);

  var sourceMaps = true;

  grunt.initConfig({
    // We are using ES6 source files, compile them to ES5.
    "babel": 
    {
      options: 
      {
        sourceMap: sourceMaps,
        modules:   'amd',
      },
      dist: 
      {
        expand: true,
        cwd:    'src/js',
        src:    ['**/*.js'],
        dest:   'build/',
        ext:    '.js'
      }
    },
    // Now let's compress our output.
    "uglify":
    {
      options:
      {
        sourceMap: sourceMaps,
        sourceMapIn: function (src)
        {
          return src + '.map';
        },
      },
      dist:
      {
        expand: true,
        cwd:    'build',
        src:    ['**/*.js'],
        dest:   'scripts/nano/',
        ext:    '.js',
      }
    },
    /**
     * If your project uses Riot.js 2.x templates, use this rule.
     */
    "riot":
    {
      options:
      {
        type:    'es6',
        modular: 'amd',
      },
      dist: 
      {
        expand: true,
        cwd:    'src/riot',
        src:    ['**/*.tag'],
        dest:   'scripts/tags/nano/',
        ext:    '.js',
      }
    },
    /**
     * If your project uses SCSS stylesheets, use this rule.
     */
    "sass":
    {
      options:
      {
        sourceMap: sourceMaps
      },
      dist:
      {
        expand: true,
        cwd:    'src/sass',
        src:    ['**/*.scss'],
        dest:   'style/nano/',
        ext:    '.css'
      }
    },
    /**
     * Clean up generated files.
     */
    "clean":
    {
      /**
       * Clean intermediate files.
       */
      build:
      {
        src: ["build/*.js", "build/*.map"]
      },
      /**
       * Clean distribution files.
       */
      release:
      {
        src: 
        [
          "scripts/nano/*.js", 
          "scripts/nano/*.map",
          "scripts/tags/nano/*.js",
          "style/nano/*.css",
          "style/nano/*.map",
        ]
      },
      downloads:
      {
        src: ["scripts/ext/*.js"]
      }
    }
  });
  
  var tasks =
  [
    "newer:babel:dist",
    "newer:uglify:dist",
  //  "newer:riot:dist",
  //  "nweer:sass:dist",
  ];
  
  grunt.registerTask("default", tasks);
}

