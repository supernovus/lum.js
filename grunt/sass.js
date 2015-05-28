/**
 * Process Sass/SCSS stylesheets into CSS.
 */
module.exports = function (grunt, options)
{
  return {
    options:
    {
      sourceMap: options.sourceMaps
    },
    dist:
    {
      expand: true,
      cwd:    'src/sass',
      src:    ['**/*.scss'],
      dest:   'style/nano/',
      ext:    '.css'
    }
  };
}

