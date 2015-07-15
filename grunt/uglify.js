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
    },
    conf:
    {
      options: 
      {
        sourceMapIn: undefined,
      },
      expand: true,
      cwd:    'src/js',
      src:    'config.js',
      dest:   'scripts/nano/',
      ext:    '.js',
      extDot: 'last',
    }
  };
}

