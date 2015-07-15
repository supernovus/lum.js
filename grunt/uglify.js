/**
 * Compress the output from Babel.
 */
module.exports = function (grunt, options)
{
  return {
    options:
    {
      sourceMap: options.sourceMaps,
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
      extDot: 'last',
    }
  };
}

