/**
 * Default Gruntfile for Nano.js
 *
 * Copy this into your own projects, and customize it for your own needs.
 */
module.exports = function (grunt)
{
  // Add a 'download' target. Remove for project-specific Gruntfiles.
  require("./lib/download-deps.js")(grunt);

  // We use load-grunt-tasks to load everything required.
  require("load-grunt-config")(grunt,
  {
    jitGrunt: true,
    data:
    {
      sourceMaps: true,
    },
  });
}

