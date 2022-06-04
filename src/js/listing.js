(function(Lum)
{
  "use strict";
/* jshint asi: true, laxbreak: true */

  if (Lum === undefined) throw new Error("Lum core not loaded");

  Lum.lib.need('helpers','pager').jq.need().lib.mark('listing');

  const {F,O,S,N,B,U} = Lum._;

/**
 * A Listing component with advanced features such as sorting and searching.
 *
 * Requires: coreutils, pager, and a rendering engine such as 'riot.tmpl'.
 *
 * This does not bind any actions to the listing buttons, so you still
 * need to do that yourself.
 */
Lum.Listing = class
{
  constructor (options)
  {
    var self = this;
  
  //  console.log("Building Listing item", options);
  
    if (options === undefined || typeof options.getData !== F)
    {
      console.log("Invalid or missing 'getData' parameter, cannot continue.");
      return false;
    }

    if (typeof options.listTemplate === F)
    { // Render using: template(data);
      this.template = options.listTemplate;
    }
    else
    { // We're going to assume the template is an HTML element.
      if (options.listTemplate instanceof jQuery)
      { // It's already a jQuery instance.
        this.template = options.listTemplate;
      }
      else if (typeof options.listTemplate === S
        || options.listTemplate instanceof Element)
      { // It's a selector string or DOM Element.
        this.template = $(options.listTemplate);
      }
      else
      { // Use the first script with the 'list_item' class.
        this.template = $('script.list_item').first();
      }

      if (typeof options.renderer === F)
      { // Render using: func(templateText, variables)
        this.renderer = options.renderer;
      }
      else if (Lum.lib.has('render.riot2'))
      { // Use the riot2 rendering engine.
        this.renderer = Lum.render.riot2;
      }
      else if (Lum.lib.has('render.riot1'))
      { // Use the riot1 rendering engine.
        this.renderer = Lum.render.riot1;
      }
      else
      { // No appropriate rendering engine found, bail out!
        throw new Error("No valid rendering engine found");
      }
    }
  
    if (options.namespace)
    {
      if (Array.isArray(options.namespace))
      {
        this.setNS.apply(this, options.namespace);
      }
      else
      {
        this.setNS(options.namespace);
      }
    }
  
    // A function that returns the active data set.
    this.getData = options.getData;
  
    // Is our data retrieved asynchronously?
    // If so, the getData() method should return an object using the
    // Promise interface, such as jQuery's jqXHR object.
    this.asyncData = 'async' in options ? options.async : false;
  
    // Filter data using an external source?
    if ('filterData' in options)
    {
      this.filterData = options.filterData;
    }
  
    // Do we want to sort the data by a certain column?
    this.sortBy = null;
  
    // And if so, in which direction?
    this.sortDesc = false;
  
    // Search by a specific column?
    this.searchBy = null;
  
    // Are we searching in a specific column?
    this.searches = {};

    // Are we using regexp search mode?
    this.useReg = options.useReg ?? false;
  
    if ('listElement' in options)
    {
      this.element = $(options.listElement);
    }
    else
    {
      // No element specified, we'll use the first .listing we find.
      this.element = $('.listing').first();
    }
  
    if ('emptyList' in options)
    { // Specific empty list content specified.
      this.empty_list = options.emptyList;
    }
    else
    { // Save the initial content as the empty list.
      this.empty_list = this.element.html();
    }
   
    if ('preRender' in options)
    {
      this.preRender = options.preRender;
    }
  
    if ('postRender' in options)
    {
      this.postRender = options.postRender;
    }

    if ('postShowPage' in options)
    {
      this.postShowPage = options.postShowPage;
    }
  
    if ('sortAttr' in options)
    {
      this.sortAttr = options.sortAttr;
    }
    else
    {
      this.sortAttr = 'lum:sort';
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
      this.searchAttr = 'lum:search';
    }

    if (typeof options.getSearchColumn === F)
    { // A custom column was passed.
      this.getSearchColumn = options.getSearchColumn;
    }
    else
    { // Use the original implementation.
      this.getSearchColumn = function (e)
      { // Remember the element will be `this`.
        return $(this).parent().attr(self.searchAttr);
      }
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
      // TODO: support unified search with list-style searches.
      var unified = options.unifiedSearch ?? false;
      this.registerSearch(options.searchSelector, unified, false);
      if (unified)
      { // Save the search selector.
        this.searchSelector = options.searchSelector;
        if ('searchColSelector' in options)
        {
          var evname = options.searchColEvent ?? 'contextmenu';
          this.registerSearchToggle(options.searchColSelector, evname);
        }
        else if (options.searchToggleLabels)
        { // Ye-old behaviour. Not automatic anymore.
          if ($('.listing_header label').exists())
          {
            this.registerSearchToggle('.listing_header label');
          }
        }
      }
    }
    else
    { // If we find individual .search items, we use searches for each of them.
      if ($('.listing_header .search.list').exists())
      {
        this.registerSearch('.listing_header .search.list', false, true);
      }
      if ($('.listing_header .search').exists())
      {
        this.registerSearch('.listing_header .search', false, false);
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
  
    // Use HTML Session Storage to remember current settings?
    this.useMemory = 'memory' in options ? options.memory : false;
    if (this.useMemory)
    {
      var memory = this.getMemory();
      if (memory !== undefined)
      {
        for (var m in memory)
        {
          if (m === 'current')
            pagerOpts.current = memory[m];
          else
            this[m] = memory[m];
        }
      }
    }
  
    // We don't want to render the pager during construction.
    pagerOpts.noRender = true;
  
    // If there is a location hash, it's the default page.
    this.useHash = 'useHash' in options ? options.useHash : false;
    if (this.useHash && Lum.Hash !== undefined)
    {
      let hash = new Lum.Hash({shortOpt: true});
      pagerOpts.useHash = true;
      pagerOpts.hash = hash;
      var pagenum = hash.getOpt('page');
      if (typeof pagenum === S)
      {
        pagenum = parseInt(pagenum);
        if (!isNaN(pagenum))
        {
          pagerOpts.current = pagenum;
        }
      }
    }
  
  //  console.log({pagerOpts: pagerOpts});
    if (typeof this.reloadSort === F)
      this.reloadSort();
    if (typeof this.reloadSearch === F)
      this.reloadSearch();
  
    // Build our pager option.
    this.pager = new Lum.Pager(pagerOpts);

    if (options.deferInitialRender)
    { // We're done here.
      return;
    }
  
    // Display the first page. This will render the pager.
    this.refresh();
  } // constructor()

  /** 
   * Get the current listing namespace.
   *
   * If the namespace has not been set already, then the setNS() method will
   * be called with a blank namespace, and appendURI and appendId as true.
   */
  getNS ()
  {
    if (!this._namespace)
    { // Set a sane default with backwards compatibility with old implementation.
      this.setNS('', {appendURI: true, appendId: true});
    }
    return this._namespace;
  }
  
  /**
   * Set the namespace.
   *
   * @param string namespace  The namespace value.
   * @param object options    Options (see below).
   *
   * Options:
   *
   *  'appendURI' (bool)   Append the URI path to the namespace?
   *  'appendId'  (bool)   Append the element id to the namespace?
   *
   * If the first parameter is an object and the second is omitted, then
   * the first parameter will be consider the options, with a new option
   * called 'value' used to specify a custom namespace value.
   */
  setNS (namespace, options)
  {
    if (typeof namespace === O && options === undefined)
    {
      options = namespace;
      namespace = options.value;
    }
    
    if (typeof namespace !== S)
    {
      namespace = '';
    }
  
    if (options.appendURI)
    {
      var uri = window.location.href.split('#', 2)[0];
      namespace += uri;
    }
  
    if (options.appendId)
    {
      var eid = this.element.prop('id');
      if (eid)
        namespace += '#'+eid;
    }
  
    if (namespace === '')
    {
      namespace = 'DEFAULT';
    }
  
    this._namespace = namespace;
  }
  
  /**
   * Get the full memory stored in the session.
   */
  getFullMemory ()
  {
    var fullMemory;
    if (sessionStorage.nanoListingMemory !== undefined)
      fullMemory = JSON.parse(sessionStorage.nanoListingMemory);
    else
      fullMemory = {};
    return fullMemory;
  }
  
  /**
   * Save the full memory definition back into the session.
   */
  saveFullMemory (data)
  {
    sessionStorage.nanoListingMemory = JSON.stringify(data);
  }
  
  // Get the memory cache.
  getMemory ()
  {
    if (typeof(Storage) === U)
    {
      console.error("No web storage available");
      return;
    }
    if (this.memory !== undefined) return this.memory;
    var ns = this.getNS();
    var fullMemory = this.getFullMemory();
    if (fullMemory[ns] !== undefined)
    {
      this.memory = fullMemory[ns];
      return this.memory;
    }
  }
  
  // Save the memory cache.
  saveMemory (page)
  {
    if (typeof(Storage) === U)
    {
      console.error("No web storage available");
      return;
    }
    var memory = this.getMemory();
    if (memory === undefined)
    {
      memory = {};
    }
    memory.current  = page;
    memory.searchBy = this.searchBy;
    memory.sortBy   = this.sortBy;
    memory.sortDesc = this.sortDesc;
    memory.searches = this.searches;
    var ns = this.getNS();
    var fullMemory = this.getFullMemory();
    fullMemory[ns] = memory;
    this.saveFullMemory(fullMemory);
  }
  
  // A simple sorting routine.
  registerSort (selector)
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
    self.reloadSort = function ()
    {
      if (self.sortBy)
      {
        var sortKey = self.sortAttr.replace(':', '\\:');
        var el = $(selector).parent().parent().find('['+sortKey+'="'+self.sortBy+'"]');
        el.find('.arrow.up').toggle(self.sortDesc ? false : true);
        el.find('.arrow.down').toggle(self.sortDesc);
      }
    }
  }
  
  // A simple search method.
  registerSearch (selector, unified, islist)
  {
  //  console.log("registerSearch("+selector+','+(unified?'true':'false')+")");
    var self = this;
    if (islist)
    {
      $(selector).on('change', function (e)
      {
        var $this = $(this);
        var text = $this.val();
        var col;
        if (unified)
        { 
          // TODO: support unified search with list-style items.
          return;
        }
        else
        { // Original searches with multiple search boxes.
          col = $this.parent().attr(self.searchAttr);
        }
        if (text === '')
        {
          self.search(col, null);
          if (!unified)
            $this.removeClass('active');
        }
        else
        {
          if (!unified)
            $this.addClass('active');
          self.search(col, text);
        }
      });
    }
    else
    {
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
          { // Nothing to search for, sorry.
            return;
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
          if (!unified)
            $this.removeClass('active');
        }
        else
        {
          if (!unified)
            $this.addClass('active');
          self.search(col, text);
        }
      });
    }
    self.reloadSearch = function ()
    {
      if (!unified && Object.keys(this.searches).length > 0)
      {
        var parentEl = $(selector).parent().parent();
        for (var s in this.searches)
        {
          var searchKey = self.searchAttr.replace(':', '\\:');
          var searchEl = parentEl.find('['+searchKey+'="'+s+'"] .search');
          searchEl.val(this.searches[s]);
          searchEl.addClass('active');
        }
      }
    }
  }
  
  // Register changing the search toggle. Only used in unified searching.
  registerSearchToggle (selector, evname, getcol)
  {
    //console.log("registerSearchToggle", selector, evname, getcol);
    var self = this;

    if (typeof getcol !== F)
    { // Use the default function.
      getcol = self.getSearchColumn;
    }

    $(selector).on(evname, function (e)
    {
      e.preventDefault();
      var searchcol = getcol.call(this, e);
  //    console.log("searchcol", searchcol);
      if (searchcol)
      {
        self.searchBy = searchcol;
        if (self.searches[searchcol] !== undefined)
        {
          $(self.searchSelector).val(self.searches[searchcol]);
        }
        $(self.searchSelector).focus();
      }
    });
  }


  
  reset (all)
  {
    this.searches = {};
    if (all)
    {
      this.sortBy = null;
    }
    this.refresh();
  }
  
  search (col, find)
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
  
  sort (col, desc)
  {
    if (desc === undefined || desc === null)
      desc = false;
    else if (desc)
      desc = true;
    this.sortDesc = desc;
    this.sortBy = col;
    this.refresh();
  }
  
  refresh ()
  {
    var ourdata = this.getData();
    if (this.asyncData && typeof ourdata.then === F)
    {
      var self = this;
      ourdata.then(function(data)
      {
        if (typeof self.filterData === F)
        {
          self.filter_data(data);
        }
        else
        {
          self.refresh_data(data);
        }
      });
    }
    else
    {
      if (typeof this.filterData === F)
      {
        this.filter_data(ourdata);
      }
      else
      {
        this.refresh_data(ourdata);
      }
    }
  }
  
  filter_data (rawdata)
  {
    var filterdata = this.filterData(rawdata);
    if (this.asyncData && typeof filterdata.then === F)
    {
      var self = this;
      filterdata.then(function(data)
      {
        self.refresh_data(data);
      });
    }
    else
    {
      this.refresh_data(filterdata);
    }
  }
  
  refresh_data (rawdata)
  {
  //  console.log(rawdata, this.sortBy, this.searches);
    this.rawData = rawdata;
    if (this.sortBy === null && Object.keys(this.searches).length === 0)
    {
      this.displayData = rawdata;
    }
    else
    {
      var i,col;
      var sortdata = this.displayData = [];
      if (Object.keys(this.searches).length > 0)
      { // Only include the matching items.
        var searchdata1 = rawdata;
        var searchdata2 = [];
        function escapeRegex(string) {
          return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        }
        for (col in this.searches)
        {
          let search = this.searches[col];

          if (!this.useReg)
          { // Escape it first.
            search = escapeRegex(search);
          }

          let find = new RegExp(search, "i");
          let colspec;
          if (col.indexOf('.') !== -1)
          { // Looking for a nested property.
            colspec = col.split('.');
            col = colspec.shift(); // the first property is the col name.
          }
          for (i in searchdata1)
          {
            let curitem = searchdata1[i];
            let curcol  = curitem[col];
            if (typeof this.searchCol[col] === F)
            {
              this.searchCol[col](curitem, find, searchdata2);
            }
            else if (typeof curcol === S)
            {
              if (curcol.search(find) !== -1)
              {
                searchdata2.push(curitem);
              }
            }
            else if ($.isArray(curcol))
            {
              for (let j in curcol)
              {
                let subcol = curcol[j];
                if (subcol.search(find) !== -1)
                {
                  searchdata2.push(curitem);
                  break; // Only include 1 item.
                }
              }
            }
            else if (typeof curcol === O && colspec !== undefined)
            { // We need to use the nested search.
              let subcol = Lum.getNested(curcol, colspec);
              if (typeof subcol === S)
              { // We can only search strings at this point.
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
        for (i in rawdata)
        {
          let rawitem = rawdata[i];
          sortdata.push(rawitem);
        }
      }
      if (sortdata.length > 0 && this.sortBy)
      { // Sort by a column.
  //      console.log("sorting by",this.sortBy);
        col = this.sortBy;
        let desc = this.sortDesc;
        if (typeof this.sortCol[col] === F)
        {
          this.sortCol[col](sortdata, desc);
        }
        else
        {
          function get_col (obj)
          {
            return Lum.getNested(obj, col);
          }
          var sort_str_asc = function (a, b)
          {
            var bcol = get_col(b);
            if (bcol === undefined || bcol === null)
              return -1;
            var acol = get_col(a);
            if (acol === undefined || acol === null)
              return 1;
            return acol.localeCompare(bcol);
          }
          var sort_str_desc = function (a, b)
          {
            var bcol = get_col(b);
            if (bcol === undefined || bcol === null)
              return 1;
            var acol = get_col(a);
            if (acol === undefined || acol === null)
              return -1;
            return bcol.localeCompare(acol);
          }
          var sort_num_asc = function (a, b)
          {
  //          console.log('a - b', a[col], b[col])
            var bcol = get_col(b);
            if (bcol === undefined || bcol === null)
              return -1;
            var acol = get_col(a);
            if (acol === undefined || acol === null)
              return 1;
            return (acol - bcol);
          }
          var sort_num_desc = function (a, b)
          {
  //          console.log('b - a', b[col], a[col]);
            var bcol = get_col(b);
            if (bcol === undefined || bcol === null)
              return 1;
            var acol = get_col(a);
            if (acol === undefined || acol === null)
              return -1;
            return (bcol - acol);
          }
          var sort_array_str_asc = function (a, b)
          {
            var bcol = get_col(b);
            if (bcol === undefined || bcol === null || bcol[0] === null)
              return -1;
            var acol = get_col(a);
            if (acol === undefined || acol === null || acol[0] === null)
              return 1;
            return acol[0].localeCompare(bcol[0]);
          }
          var sort_array_str_desc = function (a, b)
          {
            var bcol = get_col(b);
            if (bcol === undefined || bcol === null || bcol[0] === null)
              return 1;
            var acol = get_col(a);
            if (acol === undefined || acol === null || acol[0] === null)
              return -1;
            return bcol[0].localeCompare(acol[0]);
          }
          var sort_other_asc = function (a, b)
          {
            var acol = get_col(a);
            var bcol = get_col(b);
            if (acol === undefined || acol === null)
            {
              if (bcol === undefined || bcol === null)
                return 0;
              return -1;
            }
            if (bcol === undefined || bcol === null)
            {
              return 1;
            }
            if (acol < bcol) return -1;
            if (acol > bcol) return 1;
            return 0;
          }
          var sort_other_desc = function (a, b)
          {
            var acol = get_col(a);
            var bcol = get_col(b);
            if (acol === undefined || acol === null)
            {
              if (bcol === undefined || bcol === null)
                return 0;
              return 1;
            }
            if (bcol === undefined || bcol === null)
            {
              return -1;
            }
            if (acol > bcol) return -1;
            if (acol < bcol) return 1;
            return 0;
          }
          var coldata = get_col(sortdata[0], col);
          var whatisit = typeof coldata;
    //      console.log("it is a ",whatisit, col, desc);
          if (whatisit === S)
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
          else if (whatisit === N)
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
          else if ($.isArray(coldata))
          {
            if (typeof coldata[0] === S)
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
  
  showPage (page)
  {
  //  console.log("showPage("+page+")");
    var data = this.displayData;
    var dlen = data.length;
  //  console.log(data, dlen);
  
    var list = this.element;
    list.empty();
  
    if (dlen === undefined || dlen === 0)
    { // The list is empty. Restore the original text, and return.
      list.append(this.empty_list);
      return false;
    }
  
    if (this.useMemory)
    {
      this.saveMemory(page);
    }
  
    var show  = this.pager.perpage;
  
    var start = (page - 1) * show;
    var end   = start + show;
  
    if (start < 0) start = 0;
    if (end > dlen) end = dlen;

  //  console.log("sse:", show, start, end);
  //  console.log({tmpl: tmpl, list: list});
  
    for (var i = start; i < end; i++)
    {
  //    console.log("data["+i+"]");
      if (i >= dlen) break; // Partial page.
      var obj  = data[i];
  //    console.log("  == ", obj);
      if (typeof this.preRender === F)
        this.preRender(obj);
      var item = this._render(obj);
      if (typeof this.postRender === F)
        this.postRender(item, obj);
      list.append(item);
    }

    if (typeof this.postShowPage === F)
    {
      this.postShowPage({start, end, displayData: data, rawData: this.rawData});
    }

    return true;
  }

  // Internal method to render.
  _render(obj)
  {
    console.log("listing._render()", obj, this.template, this);
    if (typeof this.template === F)
    { // Using a template function
      return this.template(obj);
    }
    else
    { // Using the classic rendering system.
      const tmpl = this.template.html();
      return $(this.renderer(tmpl, obj));
    }
  }
  
  changePage (page)
  {
    return this.pager.changePage(page);
  }

} // class Lum.Listing

// End of module.
})(self.Lum);

