/*
 * A Javascript Pager component.
 *
 * Requires: jquery
 *
 * You should set at least an 'element' name, and 'onChange' event.
 *
 * TODO: Add support for alternative rendering engines.
 */

Lum.lib(
{
  name: 'pager',
  jq: true,
},
function(Lum, $)
{ 
  "use strict";

  /**
   * A class to render a Pager element.
   *
   */
  Lum.Pager = class
  {
    /**
     * Build a new Pager element.
     *
     * There's a bunch of options I need to document yet, here's the common ones.
     *
     * @param {Object} [options] - Named options to build the pager.
     * @param {string|jQuery} [options.pagerElement=.pager:first] The element to render the pager in.
     * @param {string} [options.listSelector=.list_pages] The selector to find the list element inside the pager element.
     * @param {number} [options.perpage=10] Number of items to show per page.
     * @param {number} [options.showmax=10] Number of page icons to show.
     *
     * @constructor
     */
    constructor (options)
    {
      if (options === undefined)
        options = {};

      if ('pagerElement' in options)
      { // New name.
        this.element = $(options.pagerElement);
      }
      else if ('element' in options)
      { // Old name for compatibility.
        this.element = $(options.element);
      }
      else
      { // No element specified, we'll use the first .pager we find.
        this.element = $('.pager').first();
      }
    
      if ('listSelector' in options)
      {
        this.listSelector = options.listSelector;
      }
      else
      {
        this.listSelector = '.list_pages';
      }

      if (typeof options.drawFunction === 'function')
      { // Override the default draw method.
        this.draw = options.drawFunction;
      }

      // Number of items to show per page.
      this.perpage = 'perpage' in options ? options.perpage : 10;
    
      // Number of page icons to show.
      this.showmax = 'showmax' in options ? options.showmax : 10;

      // Set a reasonable default.
      this.pagecount = 1;

      // Block hash changes?
      this.blockHash = 'blockHash' in options ? options.blockHash : false;

      // Use the Hash library to update the URL?
      this.useHash = 'useHash' in options ? options.useHash : false;

      if (this.useHash && !this.blockHash && Lum.Hash !== undefined)
      {
        if ('hash' in options && options.hash instanceof Lum.Hash)
        { // We were passed an instance of the URL Hash library.
          this.hash = options.hash;
        }
        else
        { // Create a new Hash instance.
          this.hash = new Lum.Hash();
        }
      }

      if ('count' in options)
      {
        this.countPages(options.count);
      }

      if ('current' in options)
      {
        this.currentpage = options.current;
      }
      else
      {
        this.currentpage = 1;
      }

      if ('linkTag' in options)
      {
        this.linkTag = options.linkTag;
      }
      else
      {
        this.linkTag = 'a';
      }

      if ('getLinkText' in options)
      {
        this.getLinkText = options.getLinkText;
      }
      else
      { // Backwards compatibility.
        this.getLinkText = true;
      }

      if ('getLinkVal' in options)
      {
        this.getLinkVal = options.getLinkVal;
      }
      else
      {
        this.getLinkVal = false;
      }
    
      if ('getLinkId' in options)
      {
        this.getLinkId = options.getLinkId;
      }
      else
      {
        this.getLinkId = false;
      }
    
      this.getLinkAttr = options.getLinkAttr;
    
      if ('currentTag' in options)
      {
        this.currentTag = options.currentTag;
      }
      else
      {
        this.currentTag = 'span';
      }
    
      if ('linkClass' in options)
      {
        this.linkClass = options.linkClass;
      }
      if ('currentClass' in options)
      {
        this.currentClass = options.currentClass;
      }
    
      if ('ellipse' in options)
      {
        this.ellipse = options.ellipse;
      }
      else
      {
        this.ellipse = '<addr>&hellip;</addr>';
      }
    
      // Register the onChange event, if it exists.
      this.events =
      {
        onChange: options.onChange,
      };
    
      if (!options.noRender)
        this.render();
    
      // Okay, let's register some events using jQuery.
      var pager = this;
      this.element.on('click', this.linkTag, function (event)
      {
        if (pager.blockHash || pager.hash)
        { // Stop the default hash change from occuring.
          event.preventDefault();
        }
        var anchor = $(this);
        pager.changePage(anchor);
      });

    } // constructor()

    /**
     * Given a number of items, determine the number of pages to display.
     */
    countPages (itemcount)
    {
    //  console.log("Finding number of pages for "+itemcount);
      var count = itemcount == 0 ? 1 : Math.ceil(itemcount / this.perpage);
      this.pagecount = count;
    //  console.log("Returning "+count);
      return count;
    }
    
    /**
     * Internal method, used to change the page when the user clicks on an
     * <a/> element. Set an 'onChange' handler that takes the page number as
     * its parameter, and it will be called when changing pages.
     */
    changePage (page)
    {
      if (typeof page === 'object')
      {
        var anchor = $(page);
        page = NaN;
    
        if (typeof this.getLinkAttr === 'string')
        {
          page = anchor.attr(this.getLinkAttr);
        }
        if (this.getLinkId && !page)
        {
          page = anchor.prop('id');
        }
        if (this.getLinkVal && !page)
        {
          page = anchor.val();
        }
        if (this.getLinkText && !page)
        {
          page = anchor.text();
        }
    
        page = parseInt(page, 10);
      }
      else if (typeof page === 'string')
      {
        page = parseInt(page, 10);
      }
    
      if (isNaN(page))
      {
        throw new Error("Could not determine page number.");
      }
    
      var func = this.events.onChange;
      var success = true;
      if (func !== null && func !== undefined)
      {
        success = func.call(this, page);
      }
      if (success)
      {
        this.currentpage = page;
        this.render();
        if (this.hash)
        { // Let's update the hash value.
          this.hash.update({page: page});
        }
      }
    }
    
    /**
     * Render the list of pages.
     */
    render ()
    {
      var list;
      if (this.listSelector)
        list = this.element.find(this.listSelector);
      else
        list = this.element;
      list.empty();
      // Make sure the currentpage isn't higher than the pagecount.
      if (this.currentpage > this.pagecount)
        this.currentpage = this.pagecount;
      // Draw the first page.
      this.draw(list, 1);
      if (this.pagecount === 1) return;
      if (this.pagecount <= this.showmax)
      { // Easy method if we have under the max number of pages.
        for (var p = 2; p<=this.pagecount; p++)
        {
          this.draw(list, p);
        }
      }
      else
      { // More complex method.
        var ellipse = this.ellipse;
        var start = 2;
        var startoffset = 3;
        if (this.currentpage >= this.showmax - 1)
        {
          list.append(ellipse);
          start = this.currentpage - 2;
          startoffset = 2;
        }
        var finish = start + (this.showmax - startoffset);
        var showellipse = true;
        if (finish >= this.pagecount) 
        {
          var finishoffset = finish - this.pagecount - 1;
          start -= finishoffset;
          finish = this.pagecount - 1;
          showellipse = false;
        }
        for (var p = start; p<=finish; p++)
        {
          this.draw(list, p);
        }
        if (showellipse)
        {
          list.append(ellipse);
        }
        // Show the last page.
        this.draw(list, this.pagecount);
      }
    }
    
    /**
     * Draw a pager.
     *
     * This should have more features, and we could support multiple rendering
     * engines directly from this method. For now you can fully override this
     * method by passing a 'drawFunction' construction parameter with the custom
     * rendering method, which requires quite a bit of internal knowledge of the
     * properties of the Pager object.
     */
    draw (list, page)
    {
      var tag;
      var tagclass;
      if (page == this.currentpage)
      {
        tag = this.currentTag;
        if (this.currentClass)
        {
          tagclass = this.currentClass;
        }
        else if (this.linkClass)
        {
          tagclass = this.linkClass;
        }
      }
      else
      {
        tag = this.linkTag;
        if (this.linkClass)
        {
          tagclass = this.linkClass;
        }
      }
      var el = '<'+tag+' href="#'+page+'"';
      if (tagclass)
        el += ' class="'+tagclass+'"';
      el += '>'+page+'</'+tag+'>';
      list.append(el);
    }

  } // class Lum.Pager

// End of module.
});

