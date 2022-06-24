Lum.lib(
{
  name: 'css',
  assign: 'CSS',
},
function(Lum)
{
  "use strict";
  
  // Defining a custom class.
  return class
  {
    constructor (doc)
    {
      this.doc = doc || document;
      this.sheets = this.doc.styleSheets;
    }

    /**
     * Find rules applicable to a specified element.
     */
    findRules (element)
    {
      var i, len, matching = [], sheets = this.sheets;
  
      if (Lum.jq.is(element))
      { // A jQuery object, we only use the first item.
        element = element[0];
      }
      function loopRules (rules)
      {
        var i, len, rule;
        for (i = 0, len = rules.length; i < len; i++)
        {
          rule = rules[i];
          if (rule instanceof CSSMediaRule)
          {
            if (window.matchMedia(rule.conditionText).matches)
            {
              loopRules(rule.cssRules);
            }
          }
          else if (rule instanceof CSSStyleRule)
          {
            if (element.matches(rule.selectorText))
            {
              matching.push(rule);
            }
          }
        }
      }
  
      for (i = 0, len = sheets.length; i < len; i++)
      {
        loopRules(sheets[i].cssRules);
      }
  
      return matching;
    }
  }

});