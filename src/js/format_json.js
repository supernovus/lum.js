/**
 * A function and jQuery wrapper for formatting JSON text in a friendly way.
 */

(function ()
{
  "use strict";

  if (window.Nano === undefined)
  {
    window.Nano = {};
  }

  if (Nano.format === undefined)
  {
    Nano.format = {};
  }

  // Based on http://ketanjetty.com/coldfusion/javascript/format-json/
  Nano.format.json = function (val)
  { 
    var retval = '';
    var str = val;
    var pos = 0;
    var strLen = str.length;
    var indentStr = '  ';
    var newLine = "\n";
    var curchar = '';

    for (var i=0; i<strLen; i++)
    { 
      curchar = str.substring(i, i+1);

      if (curchar == '}' || curchar == ']')
      { 
        retval = retval + newLine;
        pos = pos - 1;

        for (var j=0; j<pos; j++)
        { 
          retval = retval + indentStr;
        }
      }

      retval = retval + curchar;

      if (curchar == '{' || curchar == '[' || curchar == ',')
      { 
        retval = retval + newLine;

        if (curchar == '{' || curchar == '[')
        { 
          pos = pos + 1;
        }

        for (var k=0; k<pos; k++)
        { 
          retval = retval + indentStr;
        }
      }
    }
    return retval;
  }

  // A quick jQuery wrapper by me. Expects JSON text to be in the field.
  if (window.jQuery !== undefined)
  {
    jQuery.fn.formatJSON = function ()
    {
      return this.each(function ()
      {
        var mytype = this.nodeName.toLowerCase(); // The element name.
        var $this = jQuery(this); // A jQuery wrapper to the element.
        var oldval = '';
        if (mytype == "textarea")
          oldval = $this.val();
        else if (mytype == "pre")
          oldval = $this.text();
        else
          return; // We currently only support <textarea/> and <pre/>.
  
        var newval = Nano.format.json(oldval);
  
        if (mytype == "textarea")
          $this.val(newval);
        else
          $this.text(newval);
      });
    }
  }

})();

