(function()
{
  "use strict";
  if (window.Nano === undefined)
  {
    throw new Error("Nano core not loaded");
  }

  /**
   * Nano Grid library.
   *
   * Inspired by GridList.js, but designed with my needs.
   */
  class Grid
  {
    constructor (options={}, defs={})
    {
      this._copySettings = [];

      // Default settings, can be overridden by the options.
      defs.minRows = 1;
      defs.maxRows = 0;
      defs.minCols = 1;
      defs.maxCols = 0;
      defs.fillMax = false;
      defs.conflictResolution = null;
      defs.resolutionOrder = null;
      this.applySettings(defs, options);
  
      // Apply 'observable' trait if available.
      if (Nano.observable !== undefined)
      {
        Nano.observable(this);
      }
      else
      {
        this.trigger = function ()
        {
          return this;
        }
        this.on = this.off = this.one = function ()
        {
          console.error("Nano observable library wasn't loaded.");
          return this;
        }
      }
  
      // Create our items array.
      this.items = [];
  
      // Trigger for before we've initialized the grid.
      this.trigger('preInitialize', options);
  
      // Load any items that were passed in the constructor options.
      if ('items' in options)
      {
        var items = options.items;
        for (var i = 0; i < items.length; i++)
        {
          this.addItem(items[i], {add: false});
        }
      }
  
      // Initialize the grid.
      if (this.items.length > 0)
      {
        this.buildGrid();
      }
      else
      {
        this.resetGrid();
      }
      
      // Trigger for after we've initialized the grid.
      this.trigger('postInitialize', options);
    }

    clone ()
    {
      this.trigger('preClone', this.items, this.settings);
      var settings = Nano.clone(this.settings);
      for (var s in this._copySettings)
      {
        var setting = this._copySettings;
        settings[setting] = this.settings[setting];
      }
      settings.items = Nano.clone(this.items);
      this.trigger('postClone', this.items, this.settings);
      return new this.constructor(settings);
    }
    
    applySettings (settings, options)
    {
      if (this.settings === undefined)
        this.settings = {};
  
      for (var name in settings)
      {
        this.settings[name] 
          = name in options 
          ? options[name] 
          : settings[name];
      }
    }
  
    initRow (row, cols)
    {
  //    console.debug("initRow", row, cols);
      if (!cols)
        cols = this.colCount();
  
      for (var i = 0; i < cols; i++)
      {
        if (row[i] === undefined)
        {
          row[i] = null;
        }
      }
    }
  
    addRow (rowCount)
    {
  //    console.debug("addRow", rowCount);
      if (!rowCount)
        rowCount = this.rowCount(true);
  
      rowCount++;
  
      if (this.settings.maxRows && rowCount > this.settings.maxRows)
      {
        return false;
      }
  
      this.initGrid(rowCount, null);
      return true;
    }
  
    addCol (newCount)
    {
      if (!newCount)
        newCount = this.colCount(true);
  
      newCount++;
  
      if (this.settings.maxCols && newCount > this.settings.maxCols)
      {
        return false;
      }
  
      this.initGrid(null, newCount);
      return true;
    }
  
    rowCount (currentOnly)
    {
      if (currentOnly)
      {
        return this.grid.length;
      }
      else
      {
        if (this.settings.fillMax && this.settings.maxRows)
        {
          return this.settings.maxRows;
        }
        else if (this.grid.length > 0)
        {
          return this.grid.length;
        }
        else
        {
          return this.settings.minRows;
        }
      }
    }
  
    colCount (currentOnly)
    {
      if (currentOnly)
      {
        if (this.grid[0])
        {
          return this.grid[0].length;
        }
        return 0;
      }
      else
      {
        if (this.settings.fillMax && this.settings.maxCols)
        {
          return this.settings.maxCols;
        }
        else if (this.grid[0])
        {
          return this.grid[0].length;
        }
        else
        {
          return this.settings.minCols;
        }
      }
    }
  
    initGrid (rows, cols)
    {
  //    console.debug("initGrid", rows, cols);
      if (!rows)
        rows = this.rowCount();
  //    console.debug("initGrid.rows", rows);
      for (var i = 0; i < rows; i++)
      {
        if (this.grid[i] === undefined)
        {
          var row = [];
          this.grid[i] = row;
        }
        this.initRow(this.grid[i], cols);
      }
    }
  
    resetGrid ()
    {
      this.grid = [];
      this.initGrid();
    }
  
    buildGrid (addOpts)
    {
      this.trigger('preBuildGrid', this.grid)
      this.resetGrid();
      for (var i = 0; i < this.items.length; i++)
      {
        this.addToGrid(this.items[i], addOpts);
      }
      this.trigger('postBuildGrid', this.grid);
    }
  
    addToGrid (item, opts)
    {
  //    console.debug("addToGrid", item, opts);
      var set = this.settings;
  
      var cr = this.getConflictResolution();
      var postConflict = false;
      var conflicts = null;
  
      if ('x' in item && 'y' in item)
      {
        conflicts = this.itemFits(item);
        if (cr && cr.addFirst)
        {
          postConflict = true;
        }
        else if (conflicts !== true && 
          !this.resolveConflicts(item, conflicts, opts))
        {
          return false;
        }
      }
      else if (!this.findEmptyPosition(item, opts))
      {
        return false;
      }
  
      // If we reached here, we can save the item to the grid.
      for (var y = item.y; y < item.y + item.h; y++)
      {
        if (this.grid[y] === undefined)
        {
  //        console.debug("Adding row", y);
          if (!this.addRow(y))
          {
            console.error("Adding row failed", y, this);
            return false;
          }
        }
        for (var x = item.x; x < item.x + item.w; x++)
        {
  //        console.debug("adding item", item, y, x);
          if (this.grid[y][x] === undefined)
          {
  //          console.debug("Adding col", x);
            if (!this.addCol(x))
            {
              console.error("Adding col failed", x, this);
              return false;
            }
          }
          this.grid[y][x] = item;
        }
      }
  
      if (postConflict)
      { // We'll try to resolve all conflicts after adding the item to the grid.
        if (conflicts !== true && conflicts !== null && 
          !this.resolveConflicts(item, conflicts, opts))
        {
          console.error("Post-placement conflict resolution encountered errors.", item, opts);
        }
      }
  
      return true;
    }
  
    itemFits (item, pos)
    {
      pos = pos || {};
      if (pos.x === undefined)
      {
        pos.x = (item.x !== undefined ? item.x : 0);
      }
      if (pos.y === undefined)
      {
        pos.y = (item.y !== undefined ? item.y : 0);
      }
  
      if (pos.x < 0 || pos.y < 0)
      { // No negatives.
        return false;
      }
  
      if (this.settings.maxRows && pos.y + item.h > this.settings.maxRows)
      { // Cannot exceed maximum rows.
        return false;
      }
  
      if (this.settings.maxCols && pos.x + item.w > this.settings.maxCols)
      { // Cannot exceed maximum cols.
        return false;
      }
  
      var conflicts = [];
  
      for (var y = pos.y; y < pos.y + item.h; y++)
      {
        var row = this.grid[y];
        if (!row) continue; // Non-defined row.
        for (var x = pos.x; x < pos.x + item.w; x++)
        {
          var col = row[x];
          if (col)
          {
            if (col === item) continue; // Skip the item itself.
            if (col.id !== undefined && item.id !== undefined 
              && col.id === item.id) continue; // Skip an item with the same id.
            if (conflicts.indexOf(col) === -1)
            {
              conflicts.push(col);
            }
          }
        }
      }
  
      if (conflicts.length > 0)
      {
        if (pos.conflicts === false)
          return false;
        return conflicts;
      }
  
      return true;
    }
  
    findEmptyPosition (item, opts)
    {
      opts = opts || {};
      var starty = opts.startY !== undefined 
        ? opts.startY
        : (item.y !== undefined ? item.y : 0);
      var startx = opts.startX !== undefined
        ? opts.startX
        : (item.x !== undefined ? item.x : 0);
      var endy = opts.endY != undefined
        ? opts.endY
        : (this.settings.maxRows
          ? this.settings.maxRows
          : this.rowCount() + 1);
      var endx = opts.endX !== undefined
        ? opts.endX
        : (this.settings.maxCols
          ? this.settings.maxCols
          : this.colCount() + 1);
  
      if (opts.reverse)
      {
        return this._find_empty_reverse(starty, endy, startx, endx, item, opts);
      }
      else
      {
        return this._find_empty_forward(starty, endy, startx, endx, item, opts);
      }
    }
  
    _find_empty_forward (starty, endy, startx, endx, item, opts)
    {
      for (var y = starty; y < endy; y++)
      {
        for (var x = startx; x < endx; x++)
        {
          var fits = this.itemFits(item, {x: x, y: y});
          if (fits === true)
          { // The item fits at this position.
            return this._found_empty(y, x, item, opts);
          }
          else if (startx != endx && Array.isArray(fits))
          { // Skip the width of the first conflicting item.
            x += (fits[0].w - 1);
          }
        }
      }
      return false;
    }
  
    _find_empty_reverse (starty, endy, startx, endx, item, opts)
    {
      for (var y = endy; y >= starty; y--)
      {
        for (var x = endx; x >= startx; x--)
        {
          var fits = this.itemFits(item, {x: x, y: y});
          if (fits === true)
          { // The item fits at this position.
            return this._found_empty(y, x, item, opts);
          }
          else if (startx != endx && Array.isArray(fits))
          { // Skip the width of the first conflicting item.
            x -= fits[0].w;
          }
        }
      }
      return false;
    }
  
    _found_empty (y, x, item, opts)
    {
  //    console.debug("found_empty", y, x, item, opts);
      if (opts.returnPos)
      { // Return the position we fit at.
        return {x: x, y: y};
      }
      else
      { // Update the item position, and return true.
        item.x = x;
        item.y = y;
        return true;
      }
    }
  
    _find_empty_horizontal (item, opts)
    {
      opts = opts || {};
      if (item.x === undefined || item.y === undefined)
        return false; // Cannot use with an item that doesn't have coords.
      if (opts.reverse)
      {
        opts.startX = 0;
        opts.endX = item.y;
      }
      else
      {
        opts.startX = item.x;
        opts.endX   = this.settings.maxCols !== undefined
          ? this.settings.maxCols
          : this.colCount() + 1;
      }
      opts.startY = item.y;
      opts.endY   = item.y;
      return this.findEmptyPosition(item, opts);
    }
  
    _find_empty_vertical (item, opts)
    {
      opts = opts || {};
      if (item.x === undefined || item.y === undefined)
        return false; // Cannot use with an item that doesn't have coords.
      if (opts.reverse)
      {
        opts.startY = 0;
        opts.endY = item.y;
      }
      else
      {
        opts.startY = item.y;
        opts.endY   = this.settings.maxRows !== undefined
          ? this.settings.maxRows
          : this.rowCount() + 1;
      }
      opts.startX = item.x;
      opts.endX   = item.x;
      return this.findEmptyPosition(item, opts);
    }
  
    findEmptyToLeft (item, opts)
    {
      return this._find_empty_horizontal(item, {reverse: true});
    }
  
    findEmptyToRight (item, opts)
    {
      return this._find_empty_horizontal(item);
    }
  
    findEmptyAbove (item, opts)
    {
      return this._find_empty_vertical(item, {reverse: true});
    }
  
    findEmptyBelow (item, opts)
    {
      return this._find_empty_vertical(item);
    }
  
    sortItems ()
    {
      this.items.sort(function (item1, item2)
      {
        if (item1.y != item2.y)
        {
          return item1.y - item2.y;
        }
        if (item1.x != item2.x)
        {
          return item1.x - item2.x;
        }
        return 0;
      }.bind(this));
    }
  
    removeFromGrid (item, opts)
    {
      for (var y = item.y; y < item.y + item.h; y++)
      {
        if (!this.grid[y]) continue; // Not found in grid.
        for (var x = item.x; x < item.x + item.w; x++)
        {
          if (this.grid[y][x] === item)
          {
            this.grid[y][x] = null;
          }
        }
      }
    }
  
    getConflictResolution ()
    {
      var meth = this.settings.conflictResolution;
  //    console.debug("getConflictResolution", meth);
      if (typeof meth === 'string' && this.resolveConflicts[meth] !== undefined)
      {
        return this.resolveConflicts[meth];
      }
    }
  
    /**
     * Use our configured conflict resolution method.
     */
    resolveConflicts (item, conflicts, opts)
    {
  //    console.debug("resolveConflicts", item, conflicts, opts);
      if (conflicts === true)
      {
        return true;
      }
  
      // Force the returnPos to be false.
      opts = opts || {};
      opts.returnPos = false;
  
      // Pass it off onto the conflict resolution method.
      var meth = this.getConflictResolution();
      if (meth)
      {
        return meth.call(this, item, conflicts, opts);
      }
      else
      {
        return false;
      }
    }
  
    resolutionOrder ()
    {
      var valid = ['l','r','u','d'];
      var resOrder = this.settings.resolutionOrder;
      if (resOrder !== null && $.isArray(resOrder))
      { // A custom order was specified.
        var order = [];
        for (var o = 0; o < resOrder.length; o++)
        {
          var dir = resOrder[o].substr(0,1).toLowerCase();
          if (valid.indexOf(dir) !== -1 && order.indexOf(dir) === -1)
          {
            order.push(dir);
          }
        }
        if (order.length > 0)
        {
          return order;
        }
        else
        {
          console.error("Invalid order specified", resOrder, "using default.");
          return valid;
        }
      }
      else
      { // Use the default.
        return valid;
      }
    }
  
    addItem (item, options)
    {
      options = options || {};
      this.trigger('preAddItem', item, options);
      this.items.push(item);
      if (options.rebuild)
        this.buildGrid(options);
      else if (options.add !== false)
        this.addToGrid(item, options);
      this.trigger('postAddItem', item, options);
      this.trigger('changed');
    }
  
    removeItem (item, options)
    {
      options = options || {};
      this.trigger('preRemoveItem', item, options);
      var offset = this.items.indexOf(item);
      this.items.splice(offset, 1);
      if (options.rebuild)
        this.buildGrid(options);
      else if (options.remove !== false)
        this.removeFromGrid(item, options);
      this.trigger('postRemoveItem', item, options);
      this.trigger('changed');
    }
  
    moveItem (item, newpos, options)
    {
      this.removeFromGrid(item, options);
      if (typeof newpos === 'object' 
        && typeof newpos.x === 'number' 
        && typeof newpos.y === 'number')
      {
        item.x = newpos.x;
        item.y = newpos.y;
      }
      this.addToGrid(item, options);
      this.trigger('changed');
    }
  
    resizeItem (item, newdim, options)
    {
      this.removeFromGrid(item, options);
      if (typeof newdim === 'object' 
        && typeof newdim.w === 'number' 
        && typeof newdim.h === 'number')
      {
        item.w = newdim.w;
        item.h = newdim.h;
      }
      this.addToGrid(item, options);
      this.trigger('changed');
    }

  } // class Grid

  // Assign the Grid class to Nano.Grid
  Nano.Grid = Grid; 

  // We'll add the conflict resolution methods to the resolveConflicts object.
  var rc = Nano.Grid.prototype.resolveConflicts;

  /**
   * Use findEmptyPosition() to find an available space.
   */
  rc.findEmpty = function (item, conflicts, opts)
  {
    return this.findEmptyPosition(item, opts);
  }

  /**
   * A simplistic form of non-cascading item shuffling.
   * it will fall back on @findEmpty@ if it fails.
   *
   * It tries shifting conflicts left, right, above, below, in that order.
   * If all of those fail, it moves the conflicts to an empty position.
   */
  rc.moveConflicting = function (item, conflicts, opts)
  {
//    console.debug("moveConflicting", item, conflicts, opts);
    if (conflicts === false)
    { // No conflicts, try to find an optimal position for the item.
      // TODO: try shifting desired position just a little.
      return this.findEmptyPosition(item, opts);
    }

    var fallback = opts.fallback !== undefined ? opts.fallback : true;
    var order = this.resolutionOrder();
    var meths =
    {
      l: 'findEmptyToLeft',
      r: 'findEmptyToRight',
      u: 'findEmptyAbove',
      d: 'findEmptyBelow',
    };

    resolve: for (var c in conflicts)
    {
      var citem = conflicts[c];
      for (var o = 0; o < order.length; o++)
      {
        var mname = order[o];
        var meth = meths[mname];
        if (meth && this[meth](citem, opts))
        { // We successfully resolved.
          this.moveItem(citem);
          continue resolve;
        }
      }

      // If we reached here, none of the above worked.
      if (fallback)
      {
        if (this.findEmptyPosition(citem, opts))
        { // We moved the item with findEmptyPosition()
          this.moveItem(citem);
        }
        else
        { // We couldn't move this item at all.
          // This shouldn't happen unless the whole grid is full.
          return false;
        }
      }
      else
      { // No fallback, we return false immediately.
        return false;
      }
    }

    // If we reached here, all conflicts were resolved.
    return true;
  }
  rc.moveConflicting.addFirst = true;
  
  /**
   * DisplayGrid
   *
   * An extension of the Grid library with extra features for dealing with
   * DOM elements and events, for rendering a grid on a web page.
   */
  class DisplayGrid extends Grid
  {
    constructor (options={}, defs={})
    {
      // Apply our settings.
      defs.displayWidth  = 0;      // Width of the display area.
      defs.displayHeight = 0;      // Height of the display area.
      defs.cellWidth     = 0;      // Width of a single 'cell'.
      defs.cellHeight    = 0;      // Height of a single 'cell'.
      defs.resizeMaxRows = false;  // If displayHeight changes. update maxRows.
      defs.resizeMaxCols = false;  // If displayWidth changes, update maxCols.

      // Call our parent constructor.
      super(options, defs);

      this._copySettings.push('displayElement');

      // We can also apply displayWidth/displayHeight from a DOM element.
      if ('displayElement' in options)
      {
        this.setDisplayElement(options.displayElement, options);
      }

      // And add some event handlers to rebuild the display.
      var rebuild = function (item, options)
      {
        this.buildDisplay();
      }
      this.on('changed', rebuild);
    }

    setDisplayElement (displayElem, options)
    {
      if (!displayElem && !this.settings.displayElement) return;
      if (!displayElem)
        displayElem = this.settings.displayElement;
  //    console.debug("setDisplayElement", displayElem);
      options = options || {};
      var set = this.settings;
      set.displayElement = displayElem;
      set.displayWidth = displayElem.offsetWidth;
      set.displayHeight = displayElem.offsetHeight;
      var cellElem = options.cellElement;
      if (cellElem)
      {
        set.cellWidth = cellElem.offsetWidth;
        set.cellHeight = cellElem.offsetHeight;
      }
  //    console.debug("setDisplayElement", set, options, displayElem);
      var regen = false;
      if (set.resizeMaxRows && set.displayHeight && set.cellHeight)
      {
        set.maxRows = Math.floor(set.displayHeight / set.cellHeight);
        regen = true;
      }
      if (set.resizeMaxCols && set.displayWidth && set.cellWidth)
      {
        set.maxCols = Math.floor(set.displayWidth / set.cellWidth);
        regen = true;
      }
  
      if (regen && this.items.length > 0)
      {
        this.buildGrid();
      }
  
      var rebuild = options.rebuildDisplay;
      if (rebuild === undefined && this.items.length > 0)
        rebuild = true;
      if (rebuild)
      { // Rebuild the display.
        this.buildDisplay();
      }
  
  //    console.debug("set display element", displayElem, cellElem, set, regen, rebuild);
    }
  
    clone ()
    {
      var clone = super.clone();
      if (clone.items.length > 0)
      {
        clone.buildDisplay();
      }
      return clone;
    }
  
    buildDisplay ()
    {
      this.trigger('preBuildDisplay');
      this.display = [];
      var set = this.settings;
      var cw = set.cellWidth;
      var ch = set.cellHeight;
      var CF = {configurable: true};
      for (var i = 0; i < this.items.length; i++)
      {
        var gitem = this.items[i];
        var ditem = 
        {
          x: gitem.x * cw,
          y: gitem.y * ch,
          w: gitem.w * cw,
          h: gitem.h * ch,
        };
        Nano.addProperty(ditem, 'gridItem', gitem, CF);
        Nano.addProperty(gitem, 'displayItem', ditem, CF);
        this.display.push(ditem);
        this.trigger('buildDisplayItem', ditem);
      }
      this.trigger('postBuildDisplay');
    }
  
    getCursorPos (e)
    {
      if (e.pageX === undefined || e.pageY === undefined || e.currentTarget === undefined)
      {
        if (e.originalTarget)
        {
          return this.getCursorPos(e.originalTarget);
        }
        else
        {
          console.error("Could not find required event properties.");
          return null;
        }
      }
      var y = e.pageY - e.currentTarget.offsetTop;
      var x = e.pageX - e.currentTarget.offsetLeft;
      return {x: x, y: y};
    }
  
    displayPos (pos)
    {
      if (typeof pos !== 'object') return false;
      var ditem, i, gpos = {};
      if (pos.originalTarget !== undefined || (pos.pageY !== undefined && pos.pageX !== undefined && pos.currentTarget !== undefined))
      { // It's an event, convert it to a pos.
        pos = this.getCursorPos(pos);
        if (typeof pos !== 'object') return false;
      }
      if (pos.x === undefined || pos.y === undefined)
      { // No coordinates, cannot continue.
        return false;
      }
  
      // Generate a simplistic grid position value.
      var cw = this.settings.cellWidth;
      var ch = this.settings.cellHeight;
      var drow = (pos.y ? Math.floor(pos.y / ch) : 0);
      var dcol = (pos.x ? Math.floor(pos.x / cw) : 0);
      gpos.pos = {x: dcol, y: drow};
  
      return gpos;
    }
  
    displayItemFits (pos, dim, isGpos)
    {
      var gpos;
  
      var cr = this.getConflictResolution();
     
      if (isGpos)
      {
        gpos = {pos:{x:0, y:0}};
        if (pos.x !== undefined)
          gpos.pos.x = pos.x;
        if (pos.y !== undefined)
          gpos.pos.y = pos.y;
      }
      else
      {
        gpos = this.displayPos(pos);
      }
  
      if (!gpos)
      { // It failed, pass through the failure.
        return gpos;
      }
  
      var testpos = {x: gpos.pos.x, y: gpos.pos.y};
      if (dim !== undefined && dim.h !== undefined)
      {
        testpos.h = dim.h;
      }
      else
      {
        testpos.h = 1;
      }
      if (dim !== undefined && dim.w !== undefined)
      {
        testpos.w = dim.w;
      }
      else
      {
        testpos.w = 1;
      }
  
      if (dim !== undefined && dim.id !== undefined)
      {
        testpos.id = dim.id;
      }
      else if (pos.id !== undefined)
      {
        testpos.id = pos.id;
      }
  
      var fits = this.itemFits(testpos);
      if (typeof fits === 'boolean')
      { // Return value is if the item fits, no conflicts detected.
        gpos.fits = fits;
        gpos.conflicts = [];
      }
      else
      { // Return value is a list of conflicts, obvious the item doesn't fit.
        gpos.fits = (cr && cr.addFirst);
        gpos.conflicts = fits;
      }
  
      // Return what we found.
      return gpos;

    } // displayItemFits()

  } // class DisplayGrid

  // Assign the DisplayGrid class to Nano.Grid.Display
  Nano.Grid.Display = DisplayGrid;

  // Everything past here requires jQuery UI to be loaded.
  if (window.jQuery === undefined || window.jQuery.ui === undefined)
  {
    console.log("No jQuery UI, skipping Grid.UI class registration.");
    return;
  }

  // A local jQuery reference just in case globals aren't being set.
  var $ = window.jQuery;

  /**
   * UIGrid
   *
   * An extension of the DisplayGrid library that uses jQuery UI to perform
   * item placement, and other UI related tasks.
   */
  class UIGrid extends DisplayGrid
  {
    constructor (options={}, defs={})
    {
      defs.resizeDisplayHeight = false, // If true, resize the workspace height.
      defs.resizeDisplayWidth  = false, // If true, resize the workspace width.
      defs.resizeUseCallback   = false, // If true, use a callback to resize.

      // Call our parent constructor.
      super(options, defs);
    }

    getDisplayItem (ditem)
    {
      var dtype = typeof ditem;
      if (dtype === 'number' || dtype === 'string')
      { // An offset value.
        ditem = this.display[ditem];
      }
      else if (dtype === 'object' && typeof ditem.displayItem === 'object')
      { // Looks like we were passed a Grid item.
        ditem = ditem.displayItem;
      }
  
      if (typeof ditem !== 'object' || ditem.x === undefined || ditem.y === undefined || ditem.h === undefined || ditem.w === undefined)
      { // Don't know what to do with this.
        console.error("Invalid item passed to getDisplayItem()", ditem);
        return;
      }
      return ditem;
    }
  
    resetDisplaySize ()
    {
      var set = this.settings;
      var ws = $(set.displayElement);
      ws.height(set.cellHeight);
    }
  
    resizeDisplayForItem (ditem)
    {
      ditem = this.getDisplayItem(ditem);
      if (ditem === undefined) return;
      var set = this.settings;
      var ws = $(set.displayElement);
      var changed = false;
      if (set.resizeDisplayHeight)
      {
        var wsHeight = ws.height();
        var cellHeight = ditem.h+ditem.y;
        if (cellHeight >= wsHeight)
        {
          var padding = set.cellHeight;
          ws.height(cellHeight+padding);
          changed = true;
        }
      }
      if (set.resizeDisplayWidth)
      {
        var wsWidth = ws.width();
        var cellWidth = ditem.w+ditem.x;
        if (cellWidth >= wsWidth)
        {
          var padding = set.cellWidth;
          ws.width(cellWidth+padding);
          changed = true;
        }
      }
  
      if (changed)
      { // Refresh some other settings for the current display element.
        this.setDisplayElement(null, {rebuild: false});
      }
    }
  
    addItemToDisplay (ditem, delem)
    {
      ditem = this.getDisplayItem(ditem);
      if (ditem === undefined) return;
      if (delem.position === undefined)
      {
        console.error("Invalid element passed to addItemToDisplay()", delem);
        return;
      }
  //    console.debug("addItemToDisplay", ditem, delem);
      this.trigger('preAddItemToDisplay', ditem, delem);
      this.resizeDisplayForItem(ditem);
      var set = this.settings;
      var ws = $(set.displayElement);
      ws.append(delem);
      var at = "left+"+ditem.x+" top+"+ditem.y;
      var my = "left top";
      var qpos =     
      {
        my: my,
        at: at,
        of: ws,
        collision: 'none',
      };
      delem.position(qpos);
      delem.height(ditem.h);
      delem.width(ditem.w);
      this.trigger('postAddItemToDisplay', ditem, delem);
    }
  
    getElementDimensions (delem)
    {
      var set = this.settings;
      var h = Math.round(delem.height() / set.cellHeight);
      var w = Math.round(delem.width() / set.cellWidth);
      return {h: h, w: w};
    }
  
    /**
     * Build a resize object that can respond to mouse events
     * to handle resizing an object. You'll have to make mouse event
     * listeners to call this, as well as the methods returned.
     *
     * @param Event event   An event object, usually from a mousedown event.
     * @param Element element  A jQuery element object.
     * @param object item  The underlying Grid item.
     * @param object options  Any options or extra variables to include.
     *
     * Recognized options:
     *
     *  useCallback: boolean   Use a callback to calculate the dimensions.
     *  useEvents:   boolean   If true, register mousemove and mouseup events.
     *  rootElement: string    Selector for root element (default 'body'.)
     *  interval:    integer   The interval to run the callback (if used.)
     *  onCalculate: function (el, newWidth, newHeight, conf)  See below.
     *  doCalculate: function (el, newWidth, newHeight, conf)  See below.
     *  onUpdate:    function (event)  To be called when we update the size.
     *  onFinish:    function (item, finfo)  To be called when we're done.
     *
     * The onCalculate and doCalcuate options are mutually exclusive. If the
     * doCalculate function is defined, it will override the default behavior.
     * If the onCalculate function is defined, it will be done in addition to the
     * default calculation behavior. The 'conf' is a copy of the Grid instance
     * settings (i.e. the same as gridObj.settings).
     *
     * NOTE: This directly modifies the 'options' object, turning it into the
     *       resizeObj, so don't pass something you don't want modified!
     *
     * @return object  The resizeObj object.
     *
     */
    startResize (event, element, item, options)
    {
      options = options || {};
      if (options.useCallback === undefined)
        options.useCallback = this.settings.resizeUseCallBack;
  
      // Populate the rest of the object properties we require.
      options.grid = this;
      options.element = element;
      options.item = item;
      options.startX = event.clientX;
      options.startY = event.clientY;
      options.currentX = event.clientX;
      options.currentY = event.clientY;
      options.width = element.width();
      options.height = element.height();
  
      // A couple default event handlers.
      var DefaultEvents =
      {
        mouseMove: function (e)
        {
          options.update(e);
        },
        mouseUp: function (e)
        {
          options.finish();
        },
      }
  
      // A method for handling mousemove events.
      options.update = function (event)
      {
        this.currentX = event.clientX;
        this.currentY = event.clientY;
        if (!this.useCallback)
        { // We're going to directly calculate the resize now.
          this.calculate();
        }
        if (typeof this.onUpdate === 'function')
        {
          this.onUpdate();
        }
      }
  
      // A method for calculating and previewing the current size.
      options.calculate = function ()
      {
        var newWidth  = this.width
                      + this.currentX
                      - this.startX;
        var newHeight = this.height
                      + this.currentY
                      - this.startY;
  
        var set = this.grid.settings;
  
  //      console.debug(newWidth, newHeight, set.cellWidth, set.cellHeight);
  
        var el = this.element;
        if (typeof this.doCalculate === 'function')
        { // We're overriding the calcuation.
          this.doCalculate(element, newWidth, newHeight, set);
        }
        else
        { // Do the standard calculation, resizing the element on the screen.
          if (newWidth >= set.cellWidth)
            el.width(newWidth);
          if (newHeight >= set.cellHeight)
            el.height(newHeight);
          if (typeof this.onCalculate === 'function')
          {
            this.onCalculate(element, newWidth, newHeight, set);
          }
        }
      }
  
      // A method for finishing the resize operation.
      options.finish = function ()
      {
        if (this.useCallback)
        {
          clearInterval(this.watch);
        }
        var el = this.element;
        var item = this.item;
        var newdim = this.grid.getElementDimensions(el);
        var finfo = this.grid.displayItemFits(item, newdim, true);
        if (finfo && finfo.fits)
        {
          this.grid.resizeItem(item, newdim);
        }
        if (typeof this.onFinish === 'function')
        {
          this.onFinish(item, finfo);
        }
        if (this.useEvents)
        {
          var root = this.getRootElement();
          root.off('mousemove', DefaultEvents.mouseMove);
          root.off('mouseup',   DefaultEvents.mouseUp);
        }
      }
  
      options.getRootElement = function ()
      {
        return ('rootElement' in this ? $(this.rootElement) : $('body'));
      }
  
      if (options.useEvents)
      {
        var root = options.getRootElement();
        root.on('mousemove', DefaultEvents.mouseMove);
        root.on('mouseup',   DefaultEvents.mouseUp);
      }
  
      if (options.useCallback)
      { // Register a watch callback to update the element size.
        var callback = function ()
        {
          options.calculate();
        }
        var interval = options.interval ? options.interval : 25;
        options.watch = setInterval(callback, interval);
      }
  
      return options;

    } // startResize()
    /*
     * Example usage:
     *
     *   // Assuming a view controller object called 'gui' with certain methods.
     *
     *   var gridObj = gui.getGridObject(); // Get your grid object.
     *   var resizeObj = null;
     *
     *   $('.grid-item .resize-grip').on('mousedown', function (e)
     *   {
     *     // Find the item element that is being resized.
     *     var element = $(this).closest('.grid-item');
     *
     *     // Find the Grid item for the element.
     *     var id = element.prop(id).replace('grid-item-','');
     *     var item = Nano.oQuery.get(id, gridObj.items);
     *
     *     var opts =
     *     {
     *       useEvents: true,
     *       onFinish: function (item, finfo)
     *       {
     *         gridObj.buildDisplay(); // Rebuild the display items.
     *         gui.redrawDisplay();    // Your method to redraw the display.
     *         resizeObj = null;       // Clear the resizeObj.
     *       }
     *     };
     *
     *     // Create a resizeObj instance.
     *     resizeObj = gridObj.startResize(e, element, item, opts);
     *   });
     *
     *   // If 'useEvents' is false, then you'll need to add event handlers
     *   // yourself, an example is below:
     *
     *   $('body').on('mousemove', function (e)
     *   {
     *     if (resizeObj)
     *     {
     *       resizeObj.update(e);
     *     }
     *   });
     *
     *   $('body').on('mouseup', function (e)
     *   {
     *     if (resizeObj)
     *     {
     *       resizeObj.finish();     // Finish the move.
     *     }
     *   });
     */

  } // class UIGrid

  // Assign the UIGrid class to Nano.Grid.UI
  Nano.Grid.UI = UIGrid;

})();
