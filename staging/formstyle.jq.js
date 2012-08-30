/**
 * Create custom form elements using CSS.
 *
 * In many browsers, there are certain form elements that are not able to
 * be styled using CSS: radio boxes, select boxes, file selectors, etc.
 *
 * This jQuery plugin allows you to replace the native system elements with
 * "fake" elements styled by CSS, which when interacted with, act like the
 * real elements, and in fact, update the real elements which still exist on
 * the form, but are made invisible.
 *
 * In the case where the user does not have Javascript enabled, this degrades
 * nicely, as the original elements will be used as is.
 *
 * NOTE: This currently only supports radio boxes and check boxes.
 *       Support for select boxes and file selectors is TODO.
 *
 * NOTE 2: When using custom elements, you must use the customDisable()
 *         and customEnable() jQuery methods (on the original form elements)
 *         otherwise the form element will be enabled/disabled but the custom
 *         element won't be.
 *
 * <huri.net>
 */

var FormStyle =
{
  // A common function for check box and radio box elements,
  // where we are acting as a proxy.
  initProxy: function (el, options, defName)
  {
    var fake = document.createElement(options.element);

    if (options.on === null)
    {
      options.on = defName + '_on';
    }
    if (options.off === null)
    {
      options.off = defName + '_off';
    }

    if (el.checked == true)
    {
      fake.className = options.on;
    }
    else
    {
      fake.className = options.off;
    }

    this.parentNode.insertBefore(fake, this);

    if (!this.getAttribute("disabled"))
    {
      /* TODO: finish this */
    }


    if (options.onClicked !== null)
    {
      /* TODO: finish this */
    }

  }
};

(function($)
{
  $.fn.customStyle = function (options)
  {
    if (options === null)
      options = {'element':'span'}
    else if (options.element === null)
      options.element = 'span';

    this.each(function()
    {
      var nodename = this.nodeName.toLowerCase();
      if (nodename === 'select')
      {
        /* TODO: implement select boxes. */
        alert("Support for select boxes not implemented yet.");
      }
      else if (nodename === 'input')
      {
        var nodetype = this.type.toLowerCase();
        if (nodetype === 'checkbox' || nodetype == 'radio')
        {
          FormStyle.initProxy(this, options, nodetype);
        }
        else if (nodetype === 'file')
        {
          /* TODO: implement file selectors. */
          alert("Support for file selectors not implemented yet.");
        }
        else
        {
          alert("Unsupported input type: "+nodetype);
        }
      }
      else
      {
        alert("Unsupported element type: "+nodename);
      }
    });
  };
})(jQuery);
