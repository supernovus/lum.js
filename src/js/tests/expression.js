(function(Nano)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Nano.needLibs('tests','expression');

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('expression');

  testSet.setHandler(function (test)
  {
    test.plan(32);

    let basicExps =
    {
      postfix:
      [
        1,
        2,
        'gt',
        'not',
        4,
        4,
        'eq',
        'and',
      ],
      prefix:
      [
        'and',
        'not',
        'gt',
        1,
        2,
        'eq',
        4,
        4,
      ],
      infix:
      [
      '(',
        '(',
          'not',
          '(',
            1,
            'gt',
            2,
          ')',
        ')',
        'and',
        '(',
          4,
          'eq',
          4,
        ')',
      ')',
      ],
    };
  
    let looseInfix = ['not', 1, 'gt', 2, 'and', 4, 'eq', 4];

    let opDef =
    {
      eq: {precedence: 3, evaluate: true},
      gt: {precedence: 3, evaluate: true},
      and: {precedence: 1, evaluate: true},
      not: {precedence: 2, unary: true, evaluate: true},
      add: {precedence: 2, evaluate: true},
      mult: {precedence: 3, evaluate: true},
      negate: {precedence: 4, unary: true, evaluate: 'neg'},
      sqrt: {precedence: 4, unary: true, evaluate: function (items)
      {
        return Math.sqrt(items[0]);
      }},
    };

    let exp = new Nano.Expression.Parser({operators: opDef});

    let toTypes = Object.keys(basicExps);

    for (var type in basicExps)
    {
      var exp_in = basicExps[type];
      var meth = 'load'+type[0].toUpperCase()+type.substring(1);
      exp[meth](exp_in);
      test.is(exp.data.length, 1, 'parsed '+type+' to single item');
      test.ok((exp.data[0] instanceof Nano.Expression.Condition), 'parsed '+type+' to correct object type');
      test.is(exp.data[0].op.name, 'and', 'parsed '+type+' with correct first child');
      var exp_val = exp.evaluate();
      test.is(exp_val, true, 'evaluated '+type);
      for (var n in toTypes)
      {
        var toType = toTypes[n];
        var meth = 'save'+toType[0].toUpperCase()+toType.substring(1);
        var saved = exp[meth]();
        test.isJSON(saved, basicExps[toType], type+' to '+toType);
      }
    }

    exp.loadInfix(looseInfix);
    test.is(exp.data.length, 1, 'parsed loose infix to single item');
    test.ok((exp.data[0] instanceof Nano.Expression.Condition), 'parsed loose infix to correct object type');
    test.is(exp.data[0].op.name, 'and', 'parsed loose infix with correct first child');
    var exp_val = exp.evaluate();
    test.is(exp_val, true, 'evaluated loose infix');
    for (var n in toTypes)
    {
      var toType = toTypes[n];
      var meth = 'save'+toType[0].toUpperCase()+toType.substring(1);
      var saved = exp[meth]();
      test.isJSON(saved, basicExps[toType], 'loose infix to '+toType);
    }

    var false_exp = [1,2,'gt'];
    exp.loadPostfix(false_exp);
    var false_val = exp.evaluate();
    test.is(false_val, false, 'false expression evaluated');
  
    var num_exp = [1,2,'add',3,'mult'];
    exp.loadPostfix(num_exp);
    var num_val = exp.evaluate();
    test.is(num_val, 9, 'numeric expression evaluated');

    var neg_exp = [100,'negate'];
    exp.loadPostfix(neg_exp);
    var neg_val = exp.evaluate();
    test.is(neg_val, -100, 'explicitly defined negation operator evaluated');

    var sqrt_exp = [9, 'sqrt'];
    exp.loadPostfix(sqrt_exp);
    var sqrt_val = exp.evaluate();
    test.is(sqrt_val, 3.0, 'custom operator evaluated');

  }); // testSet.setTest()

})(window.Lum);