/**
 * Expression Parser library.
 *
 * Fully compatible with Lum.php's implementation.
 */
Lum.lib(
{
  name: 'expression',
  ns: 'Expression',
},
function(Lum, ns)
{
  const Exps = require('@lumjs/expressions');
  const Ass = Exps.Operator.ASSOC;
  const Bins = Exps.Operator.Builtins;

  ns._add('ASSOC_NONE',  Ass.NONE);
  ns._add('ASSOC_LEFT',  Ass.LEFT);
  ns._add('ASSOC_RIGHT', Ass.RIGHT);

  ns._add('Parser', Exps);

  ns._add('Operator',  Exps.Operator);
  ns._add('Condition', Exps.Condition);

  // This is probably not required, but I'm trying to keep as much compatible as possible.
  const Ope = {};
  for (const biname in Bins)
  {
    const bin = Bins
    Ope[biname] = bin.evalute;
  }
  Lum.def(Exps.Operator, 'Evaluators', Ope);
  
});