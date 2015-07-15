/**
 * Compile the ES6 source into ES5 code in a intermediate build area.
 *
 * These intermediate files will be passed through Uglify.
 */
module.exports = function (grunt, options)
{
  return {
    options: 
    {
      sourceMap: options.sourceMaps,
      modules:   'amd',
    },
    dist: 
    {
      expand: true,
      cwd:    'src/js',
      src:    ['**/*.js'],
      dest:   'build/',
      ext:    '.js',
      extDot: 'last',
    }
  };
}

