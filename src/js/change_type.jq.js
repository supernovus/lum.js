/**
 * See stackoverflow.com/questions/8584098/ for a bunch of other
 * versions of the same function. I think my version is the most optimized,
 * and offers a few more features than most.
 */

(function($) 
{
  "use strict";

  /**
   * Change an element from one type to another.
   *
   * @param {string} newType - The element node name we want to change to.
   * @param {object} [options] - A few advanced options.
   * @param {boolean} [options.html=false] - Is `newType` a full HTML tag?
   *   If this is `true` then `newType` must be a valid HTML tag.
   *   If this is `false` then `newType` is just the node name.
   * @param {function} [options.filter] - `function<DomNode>(index)`
   *   A function to filter the elements to replace with.
   *   Return value can either be one of:
   *    -  `1` or `true`      -- Replace this element.
   *    -  `0` or `false`     -- Leave this element alone.
   *    - `-1` or `null`      -- Remove this element from the DOM entirely.
   * @param {function} [options.getContents] - `function<DomNode>(index)`
   *   A function to get the contents to be inserted into the new element.
   *   Return value can be anything that can be passed to `$.fn.append()`.
   *   If not specified, any contents of the source element will be kept as is.
   * @param {function} [options.getAttributes] - `function<DomNode>(index)`
   *   A function to get the attributes to be added to the new element.
   *   Return value should be an object map of `{attrName: attrValue}`.
   *   If not specified, all attributes of the source element will be kept.
   *
   * @return {jQuery} An updated jQuery instance with the new elements.
   */
  $.fn.changeElementType = function(newType, options) 
  {
    options = options || {};
    const newEls = [];

    const filter = (typeof options.filter === 'function')
      ? options.filter
      : null;
    const getContents = (typeof options.getContents === 'function')
      ? options.getContents
      : null;
    const getAttributes = (typeof options.getAttributes === 'function')
      ? options.getAttributes
      : null;

    // We're going to use the function version of replaceWith.
    this.replaceWith(function(index)
    {
      if (filter)
      {
        const res = filter.call(this, index);
        if (res === 0 || res === false)
        { // Return the original element.
          newEls.push(this);
          return this;
        }
        else if (res === -1 || res === null)
        { // Just gonna nuke the element.
          return ''; 
        }
        else if (res !== 1 && res !== true)
        { // That's not valid.
          throw new Error("Invalid result from a filter function");
        }
      }

      // Default function to get attributes from an element.
      function getAttrs(node)
      {
        const attrs = {};
        $.each(node.attributes, function(_, attr)
        {
          attrs[attr.nodeName] = attr.nodeValue;
        });
        return attrs;
      }

      // Get the attributes
      const attrs = (getAttributes) 
        ? getAttributes.call(this, index, getAttrs)
        : getAttrs(this);

      // Get the existing content.
      const contents = (getContents) 
        ? getContents.call(this, index) 
        : $(this).contents();

      // Build a new element with the attributes and contents.
      const newEl = $(`<${newType}/>`, attrs).append(contents);
      newEls.push(newEl[0]);
      
      // And return the replacement.
      return newEl;
    });
    
    // Now return a wrapper of the new elements.
    return $(newEls);
  }

  /**
   * A wrapper around `changeElementType` specifically to change any
   * of the three button-style `<input/>` elements into the corresponding
   * `<button/>` elements. Uses the `value` for the content.
   */
  $.fn.inputToButton = function ()
  {
    function filter(index)
    {
      const name = this.nodeName.toLowerCase();
      if (name !== 'input')
      {
        console.error("invalid node name", name, this, index);
        return false;
      }
      const type = this.getAttribute('type').toLowerCase();
      const valid = ['submit','button','reset'];
      console.debug('inputToButton:filter type', type, this, index);
      return valid.includes(type);
    }

    function getContents(index)
    {
      return $(this).val();
    }

    return this.changeElementType('button', {filter, getContents});
  }

})(self.jQuery);
