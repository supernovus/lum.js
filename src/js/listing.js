/**
 * A Listing component with advanced features such as sorting and searching.
 *
 * Requires: pager, and a rendering engine such as 'riot.render' or 'riot.tmpl'
 *
 * Note: this does not bind any actions to the listing buttons, so you still
 * need to do that yourself.
 */

(function($)
{

if (window.Nano === undefined || Nano.Pager === undefined)
{
  console.log("fatal error: Nano.Pager not loaded");
  return;
}

Nano.Listing = function (options)
{
  var self = this;

//  console.log("Building Listing item", options);

  if (options === undefined || typeof options.getData !== 'function')
  {
    console.log("Invalid or missing 'getData' parameter, cannot continue.");
    return false;
  }

  // Find a rendering engine to render our template with.
  if ('renderer' in options)
  { // Must be a function that works like: func(templateText, variables)
    this.renderer = options.renderer;
  }
  else if (window.riot !== undefined && riot.render !== undefined)
  { // We have explicitly loaded riot with the riot.render engine.
    this.renderer = riot.render;
  }
  else if (Nano.render !== undefined && Nano.render.riot2 !== undefined)
  { // Use the Riot v2 rendering engine (aka 'riot.tmpl')
    this.renderer = Nano.render.riot2;
  }
  else if (Nano.render !== undefined && Nano.render.riot1 !== undefined)
  { // Use the Riot v1 rendering engine (aka 'riot.render')
    this.renderer = Nano.render.riot1;
  }
  else if (window.riot !== undefined && riot.version.split('.')[0] === 'v2')
  { // Riot v2 is loaded, let's borrow it's rendering engine.
    this.renderer = riot.util.tmpl;
  }
  else
  { // No appropriate rendering engine found, bail out!
    console.log("Could not determine rendering engine, cannot continue.");
    return false;
  }

  // A function that returns the active data set.
  this.getData = options.getData;

  // Is our data retrieved asynchronously?
  // If so, the getData() method should return an object using the
  // Promise interface, such as jQuery's jqXHR object.
  this.asyncData = 'async' in options ? options.async : false;

  // Do we want to sort the data by a certain column?
  this.sortBy = null;

  // And if so, in which direction?
  this.sortDesc = false;

  // Search by a specific column?
  this.searchBy = null;

  // Are we searching in a specific column?
  this.searches = {};

  if ('listElement' in options)
  {
    this.element = $(options.listElement);
  }
  else
  {
    // No element specified, we'll use the first .listing we find.
    this.element = $('.listing').first();
  }

  // Save the initial content.
  this.empty_list = this.element.html();

  if ('listTemplate' in options)
  {
    this.template = $(options.listTemplate);
  }
  else
  {
    // Use the first script with the 'list_item' class.
    this.template = $('script.list_item').first();
  }

  if ('preRender' in options)
  {
    this.preRender = options.preRender;
  }

  if ('postRender' in options)
  {
    this.postRender = options.postRender;
  }

  if ('sortAttr' in options)
  {
    this.sortAttr = options.sortAttr;
  }
  else
  {
    this.sortAttr = 'nano:sort';
  }

  if ('sortCol' in options)
  {
    this.sortCol = options.sortCol;
  }
  else
  {
    this.sortCol = [];
  }

  if ('searchAttr' in options)
  {
    this.searchAttr = options.searchAttr;
  }
  else
  {
    this.searchAttr = 'nano:search';
  }

  if ('searchCol' in options)
  {
    this.searchCol = options.searchCol;
  }
  else
  {
    this.searchCol = [];
  }

  // Options for constructing a pager.
  var pagerOpts = ('pager' in options) ? options.pager : {};

  // Register the onChange event.
  pagerOpts.onChange = function (page) { self.showPage(page); return true; };

  // Alias to pager.element
  if ('pagerElement' in options)
    pagerOpts.pagerElement = options.pagerElement;

  // Alias to pager.perpage
  if ('perPage' in options)
    pagerOpts.perpage = options.perPage;

  if ('sortSelector' in options)
  {
    this.registerSort(options.sortSelector);
  }
  else
  {
    if ($('.listing_header label').exists())
    {
      this.registerSort('.listing_header label');
    }
  }

  if ('searchSelector' in options)
  {
    var unified = 'unifiedSearch' in options ? options.unifiedSearch : false;
    this.registerSearch(options.searchSelector, unified);
    if (unified)
    { // Save the search selector.
      this.searchSelector = options.searchSelector;
      if ('searchColSelector' in options)
      {
        var evname = 'searchColEvent' in options 
          ? options.searchColEvent
          : 'contextmenu';
        this.registerSearchToggle(options.searchColSelector, evname);
      }
      else
      {
        if ($('.listing_header label').exists())
        {
          this.registerSearchToggle('.listing_header label');
        }
      }
    }
  }
  else
  { // If we find individual .search items, we use searches for each of them.
    if ($('.listing_header .search').exists())
    {
      this.registerSearch('.listing_header .search');
    }
  }

  if ('searchBy' in options)
  {
    this.searchBy = options.searchBy;
  }

  if ('sortBy' in options)
  {
    this.sortBy = options.sortBy;
  }

  if ('sortDesc' in options)
  {
    this.sortDesc = options.sortDesc;
  }

  // We don't want to render the pager during construction.
  pagerOpts.noRender = true;
//  console.log({pagerOpts: pagerOpts});


  // Build our pager option.
  this.pager = new Nano.Pager(pagerOpts);

  // Display the first page. This will render the pager.
  this.refresh();
}

// A simple sorting routine.
Nano.Listing.prototype.registerSort = function (selector)
{
  var self = this;
  $(selector).on('click', function (e)
  {
//    console.log('sort was clicked');
    var $this = $(this);
    var wantcol = $this.parent().attr(self.sortAttr);
    if (!wantcol) return; // No sort attribute.
    var curcol = self.sortBy;
//    console.log('wantcol', wantcol, 'curcol', curcol);
    if (wantcol == curcol)
    {
//      console.log('they are the same, changing orientation.');
      self.sortDesc = self.sortDesc ? false : true;
    }
    else
    {
//      console.log('they are different, changing');
      self.sortDesc = false;
      self.sortBy = wantcol;
      $this.parent().parent().find('.arrow').toggle(false);
    }
    $this.parent().find('.arrow.up').toggle(self.sortDesc ? false : true);
    $this.parent().find('.arrow.down').toggle(self.sortDesc);
    self.refresh();
  });
}

// A simple search method.
Nano.Listing.prototype.registerSearch = function (selector, unified)
{
//  console.log("registerSearch("+selector+','+(unified?'true':'false')+")");
  var self = this;
  $(selector).on('keyup', function (e)
  {
    var $this = $(this);
    var text = $this.val();
    var col;
    if (unified)
    { // Unified searches.
      // One search box is used by every field.
      if (self.searchBy)
      { // Search by the last selected column.
        col = self.searchBy;
      }
      else
      { // Get the first data field.
        // This assumes the first data field is searchable.
        // You may want to set a default by passing 'searchBy' in the
        // constructor instead of relying on this.
        var data = self.getData();
        if (data.length === 0) return;
        var item = data[0];
        for (col in item)
        {
          break;
        }
        self.searchBy = col;
      }
    }
    else
    { // Our original searches with multiple search boxes.
      // This offers the ability to search more than one field at a time
      // but the tradeoff is, it has a more complex user interface.
      col = $this.parent().attr(self.searchAttr);
    }
    if (text === '')
    {
      self.search(col, null);
      $this.css('display', '');
    }
    else
    {
      $this.css('display', 'block');
      self.search(col, text);
    }
  });
}

// Register changing the search toggle. Only used in unified searching.
Nano.Listing.prototype.registerSearchToggle = function (selector, evname)
{
//  console.log("registerSearchToggle("+selector+")");
  var self = this;
  $(selector).on(evname, function (e)
  {
    e.preventDefault();
    var $this = $(this);
    var searchcol = $this.parent().attr(self.searchAttr);
//    console.log("searchcol", searchcol);
    if (searchcol)
      self.searchBy = searchcol;
    $(self.searchSelector).focus();
  });
}

Nano.Listing.prototype.reset = function (all)
{
  this.searches = {};
  if (all)
  {
    this.sortBy = null;
  }
  this.refresh();
}

Nano.Listing.prototype.search = function (col, find)
{
//  console.log("search", col, find);
  if (find === null)
  {
//    console.log("removing");
    delete this.searches[col];
  }
  else
  {
//    console.log("adding");
    this.searches[col] = find;
  }

  this.refresh();
}

Nano.Listing.prototype.sort = function (col, desc)
{
  if (desc === undefined || desc === null)
    desc = false;
  else if (desc)
    desc = true;
  this.sortDesc = desc;
  this.sortBy = col;
  this.refresh();
}

Nano.Listing.prototype.refresh = function ()
{
  var ourdata = this.getData();
  if (this.asyncData && typeof ourdata.done === 'function')
  {
    var self = this;
    ourdata.done(function(data)
    {
      self.refresh_data(data);
    });
  }
  else
  {
    this.refresh_data(ourdata);
  }
}

Nano.Listing.prototype.refresh_data = function (rawdata)
{
  if (this.sortBy === null && Object.keys(this.searches).length === 0)
  {
    this.displayData = rawdata;
  }
  else
  {
    var sortdata = this.displayData = [];
    if (Object.keys(this.searches).length > 0)
    { // Only include the matching items.
      console.log("searching", this.searches);
      var searchdata1 = rawdata;
      var searchdata2 = [];
      for (var col in this.searches)
      {
        var find = new RegExp(this.searches[col], "i");
        for (var i in searchdata1)
        {
          var curitem = searchdata1[i];
          var curcol  = curitem[col];
          if (typeof this.searchCol[col] === 'function')
          {
            this.searchCol[col](curitem, find, searchdata2);
          }
          else if (typeof curcol === 'string')
          {
            if (curcol.search(find) !== -1)
            {
              searchdata2.push(curitem);
            }
          }
          else if ($.isArray(curcol))
          {
            for (var j in curcol)
            {
              var subcol = curcol[j];
              if (subcol.search(find) !== -1)
              {
                searchdata2.push(curitem);
              }
            }
          }
        }
        searchdata1 = searchdata2;
        searchdata2 = [];
      }
      sortdata = this.displayData = searchdata1;
    }
    else
    { // Copy all raw data items into the sorted data.
      for (var i in rawdata)
      {
        var rawitem = rawdata[i];
        sortdata.push(rawitem);
      }
    }
    if (sortdata.length > 0 && this.sortBy)
    { // Sort by a column.
//      console.log("sorting by",this.sortBy);
      var col = this.sortBy;
      var desc = this.sortDesc;
      if (typeof this.sortCol[col] === 'function')
      {
        this.sortCol[col](sortdata, desc);
      }
      else
      {
        var sort_str_asc = function (a, b)
        {
          if (b[col] === undefined || b[col] === null)
            return -1;
          return a[col].localeCompare(b[col]);
        }
        var sort_str_desc = function (a, b)
        {
          if (b[col] === undefined || b[col] === null)
            return 1;
          return b[col].localeCompare(a[col]);
        }
        var sort_num_asc = function (a, b)
        {
  //        console.log('a - b', a[col], b[col])
          if (b[col] === undefined || b[col] === null)
            return -1;
          return (a[col] - b[col]);
        }
        var sort_num_desc = function (a, b)
        {
  //        console.log('b - a', b[col], a[col]);
          if (b[col] === undefined || b[col] === null)
            return 1;
          return (b[col] - a[col]);
        }
        var sort_array_str_asc = function (a, b)
        {
          if (b[col] === undefined || b[col] === null || b[col][0] === null)
            return -1;
          return a[col][0].localeCompare(b[col][0]);
        }
        var sort_array_str_desc = function (a, b)
        {
          if (b[col] === undefined || b[col] === null || b[col][0] === null)
            return -1;
          return b[col][0].localeCompare(a[col][0]);
        }
        var sort_other_asc = function (a, b)
        {
          if (a[col] === undefined || a[col] === null)
          {
            if (b[col] === undefined || b[col] === null)
              return 0;
            return -1;
          }
          if (b[col] === undefined || b[col] === null)
          {
            return 1;
          }
          if (a[col] < b[col]) return -1;
          if (a[col] > b[col]) return 1;
          return 0;
        }
        var sort_other_desc = function (a, b)
        {
          if (a[col] === undefined || a[col] === null)
          {
            if (b[col] === undefined || b[col] === null)
              return 0;
            return 1;
          }
          if (b[col] === undefined || b[col] === null)
          {
            return -1;
          }
          if (a[col] > b[col]) return -1;
          if (a[col] < b[col]) return 1;
          return 0;
        }
        var whatisit = typeof sortdata[0][col];
  //      console.log("it is a ",whatisit, col, desc);
        if (whatisit === 'string')
        {
          if (desc)
          {
            sortdata.sort(sort_str_desc);
          }
          else
          {
            sortdata.sort(sort_str_asc);
          }
        }
        else if (whatisit === 'number')
        {
          if (desc)
          {
  //          console.log("sorting number descending");
            sortdata.sort(sort_num_desc);
          }
          else
          {
  //          console.log("sorting number ascending");
            sortdata.sort(sort_num_asc);
          }
        }
        else if ($.isArray(sortdata[0][col]))
        {
          if (typeof sortdata[0][col][0] === 'string')
          {
            if (desc)
            {
              sortdata.sort(sort_array_str_desc);
            }
            else
            {
              sortdata.sort(sort_array_str_asc);
            }
          }
        }
        else 
        {
          if (desc)
          {
  //          console.log("sorting other descending");
            sortdata.sort(sort_other_desc);
          }
          else
          {
  //          console.log("sorting other ascending");
            sortdata.sort(sort_other_asc);
          }
        }
      }
    }
  }

  this.pager.countPages(this.displayData.length);
  this.pager.render();
  this.showPage(this.pager.currentpage);
}

Nano.Listing.prototype.showPage = function (page)
{
//  console.log("showPage("+page+")");
  var data = this.displayData;
  var dlen = data.length;
//  console.log(data, dlen);

  var list = this.element;
  list.empty();

  if (dlen === undefined || dlen == 0)
  { // The list is empty. Restore the original text, and return.
    list.append(this.empty_list);
    return false;
  }

  var show  = this.pager.perpage;

  var start = (page - 1) * show;
  var end   = start + show;

  var tmpl = this.template.html();

//  console.log("sse:", show, start, end);
//  console.log({tmpl: tmpl, list: list});

  for (var i = start; i < end; i++)
  {
//    console.log("data["+i+"]");
    if (i >= dlen) break; // Partial page.
    var obj  = data[i];
//    console.log("  == ", obj);
    if ('preRender' in this)
      this.preRender(obj);
    var item = $(this.renderer(tmpl, obj));
    if ('postRender' in this)
      this.postRender(item, obj);
    list.append(item);
  }
  return true;
}

// End of module.
})(jQuery);

