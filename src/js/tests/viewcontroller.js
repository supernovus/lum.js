(function()
{
  "use strict";

  if (window.Nano === undefined || Nano.Tests === undefined || Nano.ViewController === undefined)
  {
    throw new Error("Missing required libraries");
  }

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('viewcontroller');
  let modelSet = testSuite.getSet('modelapi');

  testSet.setHandler(function (test)
  {
    test.plan(0);

    let Model = modelSet.createModelClass();
    let peopleEl = modelSet.makePeopleElement(true);

    let modelConf =
    {
      sources:
      {
        people:
        {
          type: 'json',
          element: '#modelapi_test_people',
        }
      }
    }

    let promise = new Nano.Promise();

    let viewc = new Nano.ViewController();
    viewc.add(function (api)
    {
      console.log("In test handler for ViewController");
      test.ok(api instanceof Nano.ModelAPI, 'api instance is correct');
      peopleEl.remove();
      promise.resolve();
    });
    viewc.start(Model, modelConf);

    return promise;
  });

})();