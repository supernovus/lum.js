(function()
{
  /**
   * In this file, we register all of our current test sets.
   *
   * They aren't loaded immediately, but instead will be loaded on demand.
   *
   * Because of the nature of this script, it needs to be loaded AFTER we
   * have initialized the Nano.Tests instance. The default test templates will
   * do this automatically.
   */

  if (window.Nano === undefined || Nano.Tests === undefined)
  {
    throw new Error("Must load and initialize Nano.Tests before registration");
  }

  let testSuite = Nano.Tests.getInstance();

  // Expression library.
  testSuite.addSet('expression', 'Expression', 
  [
    '@expression.js',
    '@tests/expression.js',
  ]);

  // TODO: flesh this out with more tests.

})();