/**
 * Compress the scripts.
 */
module.exports = function (grunt, options)
{
  return {
    options:
    {
      sourceMap: options.sourceMaps,
    },
    dist:
    {
      expand: true,
      cwd:    'src/js',
      src:    ['**/*.js'],
      dest:   'scripts/nano/',
      ext:    '.js',
      extDot: 'last',
    }
  };
}

