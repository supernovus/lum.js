/**
 * Use if you have Riot.js templates to compile.
 */
module.exports = function (grunt, options)
{
  return {
    options:
    {
//      type:    'es6',
      modular: 
      {
        type: 'amd',
        deps:
        [
          'riot',
          {'jquery': '$'},
        ],
      }
    },
    dist: 
    {
      expand: true,
      cwd:    'src/riot',
      src:    ['**/*.tag'],
      dest:   'scripts/tags/nano/',
      ext:    '.js',
      extDot: 'last',
    }
  };
}

