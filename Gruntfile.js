require("load-grunt-tasks")(grunt);

grunt.initConfig({
  "babel": 
  {
    options: 
    {
      sourceMap: true
    },
    dist: 
    {
      expand: true,
      cwd: 'src/',
      src: ['**/*.js'],
      dest: 'scripts/nano/',
      ext: '.js'
    }
  },
  // TODO: write an uglify routine.
  /**
  "uglify":
  {
  },
  */
  // Enable the following if we're using riot tags
  /*
  "riot":
  {
    options:
    {
      type: 'es6'
    },
    dist: 
    {
      expand: true,
      // TODO: finish me
    }
  }
  */
});

grunt.registerTask("default", ["babel"]);

