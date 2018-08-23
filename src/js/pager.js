/**
 * A Javascript Pager component.
 *
 * Requires: jquery
 *
 * You should set at least an 'element' name, and 'onChange' event.
 *
 * TODO: Add support for alternative rendering engines.
 */

(function($)
{ // Header added.

if (window.Nano === undefined)
{
  console.log("fatal error: Nano core not loaded");
  return;
}

Nano.Pager = function (options)
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

  // Number of items to show per page.
  this.perpage = 'perpage' in options ? options.perpage : 10;

  // Number of page icons to show.
  this.showmax = 'showmax' in options ? options.showmax : 10;

  // Set a reasonable default.
  this.pagecount = 1;

  // Block hash changes?
  this.blockHash = 'blockHash' in options ? options.blockHash : false;

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
    if (pager.blockHash) 
      event.preventDefault();
    var anchor = $(this);
    pager.changePage(anchor);
  });

}

/**
 * Given a number of items, determine the number of pages to display.
 */
Nano.Pager.prototype.countPages = function (itemcount)
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
Nano.Pager.prototype.changePage = function (anchor)
{
  var page = anchor.text();
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
  }
}

/**
 * Render the list of pages.
 */
Nano.Pager.prototype.render = function ()
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
 * Draw a page.
 */
Nano.Pager.prototype.draw = function (list, page)
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

// End of module.
})(jQuery);

