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

  // For most Nano libraries, this will work.
  function test (lib, name, deps=[])
  {
    deps.push('@'+lib+'.js');
    deps.push('@tests/'+lib+'.js');
    testSuite.addSet(lib, name, deps);
  }

  test('coreutils',  'Core Utils');
  test('arrayutils', 'Array Utils');
  test('expression', 'Expression');

  // TODO: flesh this out with more tests.

})();