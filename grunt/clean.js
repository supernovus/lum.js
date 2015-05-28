/**
 * Clean up generated files.
 */
module.exports = function (grunt, options)
{
  return {
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
  };
}

