(function(Nano)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Nano.needLibs('tests','oquery');

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('oquery');

  testSet.setHandler(function (test)
  {
    test.plan(22);

    let oq = Nano.oQuery;

    let people = testSuite.makePeople({withRecursion: true});

    let dataset =
    [
      {
        id: 100,
        type: 1,
        person: people[0],
      },
      {
        id: 207,
        type: 1,
        person: people[1],
      },
      {
        id: 399,
        type: 2,
        person: people[2],
      },
      {
        id: 404,
        type: 3,
        person: people[3],
      },
    ];

    let found = oq({id: 207}, dataset, {single: true});
    test.is(typeof found.person, 'object', 'oQuery test 1 returned correct type');
    test.is(found.person.name, 'Lisa', 'oQuery test 1 returned proper object');

    found = oq({type: 1}, dataset);
    test.is(found.length, 2, 'oQuery test 2 returned correct number of values');
    test.is(found[0].id, 100, 'oQuery test 2 returned correct object');    

    found = oq({type: function (k) { return k % 2 === 0; }}, dataset);
    test.is(found.length, 1, 'oQuery function test returned correct number of values');
    test.is(found[0].id, 399, 'oQuery function test returned correct object');

    found = oq({person:{name: 'Bob'}}, dataset, {single: true});
    console.debug("nested query 1 results", found);
    test.ok((found !== null), 'nested query 1 did not return null'); 
    test.is(found.id, 100, 'nested query 1 returned correct object');

    found = oq({person:{age: function(a) { return a < 20; }}}, dataset);
    console.debug("nested query 2 results", found);
    test.is(found.length, 2, 'nested query 2 returned correct number of values');
    test.is(found[1].id, 404, 'nested query 2 returned correct object');

    found = oq({person:{kids:{name: 'Sarah'}}}, dataset);
    console.debug("deep nest 1", found);
    test.is(found.length, 2, 'deeply nested query 1 returned correct number of values');
    test.is(found[0].id, 100, 'deeply nested query 1 returned first object');
    test.is(found[1].id, 207, 'deeply nested query 1 returned second object');

    found = oq({person:{parents:{name: 'Lisa'}}}, dataset);
    test.is(found.length, 1, 'deeply nested query 2 returned correct number of values');
    test.is(found[0].id, 404, 'deeply nested query 2 returned correct object');

    found = oq(207, dataset);
    test.is(typeof found.person, 'object', 'oQuery with raw id returned correct type');
    test.is(found.person.name, 'Lisa', 'oQuery with raw id returned correct object');

    found = oq.get({id: 404}, dataset);
    test.is(typeof found.person, 'object', 'oQuery.get returned correct type');
    test.is(found.person.name, 'Sarah', 'oQuery.get returned correct object');

    found = oq.pos({id: 399}, dataset);
    test.is(found, '2', 'oQuery.pos returned correct position');

    found = oq.indexes({type: 1}, dataset);
    test.isJSON(found, ['0','1'], 'oQuery.indexes returned correct values');

    found = oq.indexes({person:{parents:{name:'Lisa'}}}, dataset);
    test.isJSON(found, ['3'], 'oQuery.indexes with deep nested query');

  });

})(window.Lum);