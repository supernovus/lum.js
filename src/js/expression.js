/**
 * Expression Parser library.
 *
 * Fully compatible with Nano.php's implementation.
 */
(function()
{
  if (window.Nano === undefined)
  {
    window.Nano = {};
  }

  var ns = Nano.Expression = {};

  ns.ASSOC_NONE  = 0;
  ns.ASSOC_LEFT  = 1;
  ns.ASSOC_RIGHT = 2;

  ns.Parser = class 
  {
    constructor (options)
    {
      this.data = [];
      this.operators = [];

      if (typeof options.operators === 'object')
      { // An assignment of operators.
        for (let opname in options.operators)
        {
          var opopts = options.operators[opname];
          this.addOperator(opname, opopts);
        }
      }

      if (typeof options.lp === 'string')
      {
        this.lp = options.lp;
      }
      else
      {
        this.lp = '(';
      }
      if (typeof options.rp === 'string')
      {
        this.rp = options.rp;
      }
      else
      {
        this.rp = ')';
      }
    }

    addOperator (name, opts)
    {
      if (name instanceof Operator)
      {
        this.operators[name.name] = name;
      }
      else if (typeof name === 'string')
      {
        this.operators[name] = new Operator(name, opts);
      }
      else
      {
        throw new Error("addOperator must be sent a name, or an Operator instance");
      }
    }

    loadInfix (data)
    { // Convert to postfix using Shunting-Yard, then parse that data.
      this.data = [];
      var operators = [];
      var operands = [];
      var len = data.length;
      for (var c = 0; c < len; c++)
      {
        var v = data[c];
        if (v in this.operators)
        { // It's an operator.
          var op = this.operators[v];
          var op2 = operators.length ? operators[operators.length-1] : null;
          while (op2
            && op2 !== this.lp
            && (
              (op.leftAssoc() && op.precedence <= op2.precedence)
              ||
              (op.rightAssoc() && op.precedence < op2.precedence)
            )
          )
          {
            operands.push(operators.pop().name);
            op2 = operators[operators.length-1];
          }
          operators.push(op);
        }
        else if (v === this.lp)
        { // It's a left parenthesis.
          operators.push(v);
        }
        else if (v === this.rp)
        { // It's a right parenthesis.
          while(operators[operators.length-1] !== this.lp)
          {
            operands.push(operators.pop().name);
            if (!operators.length)
            {
              console.debug(operators, operands);
              throw new Error("Mismatched parenthesis in first pass");
            }
          }
          operators.pop();
        }
        else
        { // It's an operand.
          operands.push(v);
        }
      }
      while (operators.length)
      {
        var op = operators.pop();
        if (op === this.lp)
        {
          console.debug(op, operators, operands);
          throw new Error("Mismatched parenthesis in second pass");
        }
        operands.push(op.name);
      }
      //console.debug("infix to postfix", operands);
      return this.loadPostfix(operands);
    }

    loadPrefix (data)
    {
      this.data = [];
      var len = data.length;
      for (var c = len-1; c >= 0; c--)
      {
        var v = data[c];
        if (v in this.operators)
        { // It's an operator.
          var op = this.operators[v];
          var s = op.operands;
          var z = this.data.length;
          if (z < s)
          {
            throw new Error("Operator "+v+" requires "+s+" operands, only "+z+" found.");
          }
          var substack = this.data.splice(z-s, s).reverse();
          this.data.push(new Condition(op, substack));
        }
        else if (v == this.lp || v == this.rp)
        { // Parens are ignored in prefix.
          continue; 
        }
        else
        { // It's an operand, add it to the stack.
          this.data.push(v);
        }
      }
    }
  
    loadPostfix (data)
    {
      this.data = [];
      var len = data.length;
      for (var c = 0; c < len; c++)
      {
        var v = data[c];
        if (v in this.operators)
        { // It's an operator.
          var op = this.operators[v];
          var s = op.operands;
          var z = this.data.length;
          if (z < s)
          {
            throw new Error("Operator "+v+" requires "+s+" operands, only "+z+" found.");
          }
          var substack = this.data.splice(z-s, s);
          this.data.push(new Condition(op, substack));
        }
        else if (v == this.lp || v == this.rp)
        { // Parens are ignored in postfix.
          continue;
        }
        else
        { // It's an operand, add it to the stack.
          this.data.push(v);
        }
      }
    }
  
    getData ()
    { // Return a new array containing our data.
      var data = [];
      for (var i = 0; i < this.data.length; i++)
      {
        data.push(this.data[i]);
      }
      return data;
    }
  
    saveInfix ()
    {
      var output = [];
      for (var i = 0; i < this.data.length; i++)
      {
        var item = this.data[i];
        this.serialize_infix_item(item, output);
      }
      return output;
    }
  
    serialize_infix_item (item, output)
    {
      if (item instanceof Condition)
      {
        this.serialize_infix_condition(item, output);
      }
      else
      {
        output.push(item);
      }
    }
  
    serialize_infix_condition (item, output)
    {
      output.push(this.lp);
      var opn = item.op;
      var ops = item.items.length;
      if (ops == 2)
      {
        this.serialize_infix_item(item.items[0], output);
        output.push(opn.name);
        this.serialize_infix_item(item.items[1], output);
      }
      else if (ops == 1)
      {
        output.push(opn.name);
        this.serialize_infix_item(item.items[0], output);
      }
      else
      {
        throw new Error("Operators in infix expressions must hae only 1 or 2 operands, "+opn.name+" has "+ops+" which is invalid.");
      }
      output.push(this.rp);
    }
  
    savePrefix ()
    {
      return this.serialize_prefix(this.data, []);
    }
  
    serialize_prefix (input, output)
    {
      for (var i = 0; i < input.length; i++)
      {
        var item = input[i];
        if (item instanceof Condition)
        {
          output.push(item.op.name);
          this.serialize_prefix(item.items, output);
        }
        else
        {
          output.push(item);
        }
      }
      return output;
    }
  
    savePostfix ()
    {
      return this.serialize_postfix(this.data, []);
    }
  
    serialize_postfix (input, output)
    {
      for (var i = 0; i < input.length; i++)
      {
        var item = input[i];
        if (item instanceof Condition)
        {
          this.serialize_postfix(item.items, output);
          output.push(item.op.name);
        }
        else
        {
          output.push(item);
        }
      }
      return output;
    }
  
    evaluate ()
    {
      if (this.data.length > 1)
      {
        throw new Error("Expression does not parse to a single top item, cannot evaluate.");
      }
      var topItem = this.data[0];
      if (topItem instanceof Condition)
      {
        return topItem.evaluate();
      }
      else
      {
        return topItem;
      }
    }

  }

  var Operator = ns.Operator = class
  {
    constructor (name, opts)
    {
      this.name = name;
      this.operands = (typeof opts.operands === 'number') 
        ? opts.operands : 2;
      this.precedence = (typeof opts.precedence === 'number')
        ? opts.precedence : 1;
  
      if (opts.assoc !== undefined)
      {
        if (opts.assoc === false)
        {
          this.assoc = ns.ASSOC_NONE;
        }
        else if (typeof opts.assoc === 'number')
        {
          this.assoc = opts.assoc;
        }
        else if (typeof opts.assoc === 'string')
        {
          var assocStr = opts.assoc.substr(0,1).toLowerCase();
          if (assocStr == 'l')
          {
            this.assoc = ns.ASSOC_LEFT;
          }
          else if (assocStr == 'r')
          {
            this.assoc = ns.ASSOC_RIGHT;
          }
          else
          {
            this.assoc = ns.ASSOC_NONE;
          }
        }
        else
        {
          this.assoc = ns.ASSOC_LEFT;
        }
      }
      else
      {
        this.assoc = ns.ASSOC_LEFT;
      }
  
      if (opts.unary)
      {
        if (opts.operands === undefined)
          this.operands = 1;
        if (opts.assoc === undefined)
          this.assoc = ns.ASSOC_RIGHT;
      }
  
      if (opts.evaluate !== undefined)
      {
        if (typeof opts.evaluate === 'function')
        { // Using a custom evaluator.
          this.evaluator = opts.evaluate;
        }
        else if (typeof opts.evaluate === 'string')
        { // Using a built-in evaluator.
          this.setEvaluator(opts.evaluate.toLowerCase());
        }
        else if (opts.evaluate === true)
        { // Use the name as a built-in evaluator.
          this.setEvaluator(name.toLowerCase());
        }
        else
        {
          throw new Error("Invalid evaluator passed to constructor");
        }
      }  
    }

    setEvaluator (evaluator)
    {
      if (typeof evaluator === 'string'
        && typeof Ope[evaluator] === 'function')
      {
        this.evaluator = Ope[evaluator];
      }
      else if (typeof evaluator === 'function')
      {
        this.evaluator = evaluator;
      }
      else
      {
        throw new Error("Invalid evaluator passed to setEvaluator()");
      }
    }
  
    evaluate (items)
    {
      if (typeof this.evaluator !== 'function')
      {
        throw new Error("Attempt to evaluate an operator without a handler");
      }
      if (items.length != this.operands)
      {
        throw new Error("Invalid number of operands in operator evaluation");
      }
      // Now make sure the items are scalar values, not objects.
      var flat = [];
      for (var i = 0; i < items.length; i++)
      {
        var item = items[i];
        if (typeof item === 'object' && item !== null 
          && typeof item.evaluate === 'function')
        {
          flat[i] = item.evaluate();
        }
        else
        {
          flat[i] = item;
        }
      }
      // Our items are all flat values, let's do this.
      return this.evaluator(flat);
    }
  
    leftAssoc ()
    {
      return this.assoc === ns.ASSOC_LEFT;
    }
  
    rightAssoc ()
    {
      return this.assoc === ns.ASSOC_RIGHT;
    }
  
    noAssoc ()
    {
      return this.assoc === ns.ASSOC_NONE;
    }

  } // class Operator

  var Ope = Operator.Evaluators = 
  {
    not (items)
    {
      return !(items[0]);
    },

    eq (items)
    {
      return (items[0] == items[1]);
    },
  
    ne (items)
    {
      return (items[0] != items[1]);
    },
  
    gt (items)
    {
      return (items[0] > items[1]);
    },
  
    lt (items)
    {
      return (items[0] < items[1]);
    },
  
    gte (items)
    {
      return (items[0] >= items[1]);
    },
  
    lte (items)
    {
      return (items[0] <= items[1]);
    },
  
    and (items)
    {
      return (items[0] && items[1]);
    },
  
    or (items)
    {
      return (items[0] || items[1]);
    },
  
    xor (items)
    {
      return (items[0] ? !items[1] : items[1]);
    },
  
    add (items)
    {
      return (items[0] + items[1]);
    },
  
    sub (items)
    {
      return (items[0] - items[1]);
    },
  
    mult (items)
    {
      return (items[0] * items[1]);
    },
  
    div (items)
    {
      return (items[0] / items[1]);
    },
  
    neg (items)
    {
      return (items[0] * -1);
    },

  };
 
  var Condition = ns.Condition = class
  {
    constructor (op, items)
    {
      if (!(op instanceof Operator))
      {
        throw new Error("Condition must be passed Operator");
      }
      if (!Array.isArray(items))
      {
        throw new Error("Condition must be passed an array of Items");
      }
      this.op = op;
      this.items = items;
    }

    evaluate ()
    {
      return this.op.evaluate(this.items);
    }

  }

})();