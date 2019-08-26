(function()
{
  "use strict";

  if (window.Nano === undefined || Nano.Tests === undefined || Nano.oQuery === undefined)
  {
    throw new Error("Missing required libraries");
  }

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('oquery');

  testSet.setHandler(function (test)
  {
    test.plan(22);

    let oq = Nano.oQuery;

    let dataset =
    [
      {
        id: 100,
        type: 1,
        props:
        {
          name: 'Bob',
          age: 40
        },
      },
      {
        id: 207,
        type: 1,
        props:
        {
          name: 'Lisa',
          age: 25,
        },
      },
      {
        id: 399,
        type: 2,
        props:
        {
          name: 'Kevin',
          age: 18,
        },
      },
      {
        id: 404,
        type: 3,
        props:
        {
          name: 'Sarah',
          age: 13,
        },
      },
    ];

    dataset[0].kids = [dataset[2],dataset[3]];
    dataset[1].kids = [dataset[3]];
    dataset[2].kids = [];
    dataset[3].kids = [];
    dataset[0].parents = [];
    dataset[1].parents = [];
    dataset[2].parents = [dataset[0]];
    dataset[3].parents = [dataset[0],dataset[1]];

    let found = oq({id: 207}, dataset, {single: true});
    test.is(typeof found.props, 'object', 'oQuery test 1 returned correct type');
    test.is(found.props.name, 'Lisa', 'oQuery test 1 returned proper object');

    found = oq({type: 1}, dataset);
    test.is(found.length, 2, 'oQuery test 2 returned correct number of values');
    test.is(found[0].id, 100, 'oQuery test 2 returned correct object');    

    found = oq({kids: function (k) { return k.length > 1; }}, dataset);
    test.is(found.length, 1, 'oQuery function test returned correct number of values');
    test.is(found[0].id, 100, 'oQuery function test returned correct object');

    found = oq({props:{name: 'Bob'}}, dataset, {single: true});
    console.debug("nested query 1 results", found);
    test.ok((found !== null), 'nested query 1 did not return null'); 
    test.is(found.id, 100, 'nested query 1 returned correct object');

    found = oq({props:{age: function(a) { return a < 20; }}}, dataset);
    console.debug("nested query 2 results", found);
    test.is(found.length, 2, 'nested query 2 returned correct number of values');
    test.is(found[1].id, 404, 'nested query 2 returned correct object');

    found = oq({kids:{id: 404}}, dataset);
    test.is(found.length, 2, 'deeply nested query 1 returned correct number of values');
    test.is(found[0].id, 100, 'deeply nested query 1 returned first object');
    test.is(found[1].id, 207, 'deeply nested query 1 returned second object');

    found = oq({parents:{id: 207}}, dataset);
    test.is(found.length, 1, 'deeply nested query 2 returned correct number of values');
    test.is(found[0].id, 404, 'deeply nested query 2 returned correct object');

    found = oq(207, dataset);
    test.is(typeof found.props, 'object', 'oQuery with raw id returned correct type');
    test.is(found.props.name, 'Lisa', 'oQuery with raw id returned correct object');

    found = oq.get({id: 404}, dataset);
    test.is(typeof found.props, 'object', 'oQuery.get returned correct type');
    test.is(found.props.name, 'Sarah', 'oQuery.get returned correct object');

    found = oq.pos({id: 399}, dataset);
    test.is(found, '2', 'oQuery.pos returned correct position');

    found = oq.indexes({type: 1}, dataset);
    test.isJSON(found, ['0','1'], 'oQuery.indexes returned correct values');

    found = oq.indexes({parents:{id:207}}, dataset);
    test.isJSON(found, ['3'], 'oQuery.indexes with deep nested query');

  });

})();