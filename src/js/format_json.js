/**
 * A function and jQuery wrapper for formatting JSON text in a friendly way.
 */

(function (Lum)
{
  "use strict";

  if (Lum === undefined) throw new Error("Lum core not loaded");

  // Based on http://ketanjetty.com/coldfusion/javascript/format-json/

  const format = Lum.lib.mark('format_json').ns.new('format.json',function (val)
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

  }); // Lum.format.json()

  const $ = Lum.jq.get();

  // A quick jQuery wrapper by me. Expects JSON text to be in the field.
  if ($ !== undefined)
  {
    $.fn.formatJSON = function ()
    {
      return this.each(function ()
      {
        var mytype = this.nodeName.toLowerCase(); // The element name.
        var $this = $(this); // A jQuery wrapper to the element.
        var oldval = '';
        if (mytype == "textarea")
          oldval = $this.val();
        else if (mytype == "pre")
          oldval = $this.text();
        else
          return; // We currently only support <textarea/> and <pre/>.
  
        var newval = format(oldval);
  
        if (mytype == "textarea")
          $this.val(newval);
        else
          $this.text(newval);
      });
    }
  }

})(self.Lum);

