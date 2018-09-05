(function()
{
  "use strict";
  if (window.Nano === undefined)
  {
    console.error("fatal error: Nano core not loaded");
    return;
  }

  /**
   * Nano Grid library.
   *
   * Inspired by GridList.js, but designed with my needs.
   */
  var Grid = Nano.Grid = function (options)
  {
    options = options || {};

    // Default settings, can be overridden by the options.
    var settings =
    {
      minRows: 5,
      maxRows: 0,
      minCols: 5,
      maxCols: 0,
      fillMax: false,
      conflictResolution: null,
    };
    this.applySettings(settings, options);

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
        this.addItem(items[i], false);
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

  var gp = Grid.prototype;

  gp._constructor = Grid;

  gp.clone = function ()
  {
    var settings = Nano.clone(this.settings);
    settings.items = Nano.clone(this.items);
    return new this._constructor(settings);
  }
  
  gp.applySettings = function (settings, options)
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

  gp.initRow = function (row, cols)
  {
    if (!cols)
      cols = this.colCount();
    for (var i = 0; i < cols; i++)
    {
      if (!row[i])
      {
        row.push(null);
      }
    }
  }

  gp.addRow = function ()
  {
    console.debug("addRow");
    if (this.settings.maxRows)
    {
      var rowCount = this.rowCount(true);
      if (rowCount == this.settings.maxRows)
      {
        return false;
      }
    }
    var row = [];
    this.initRow(row);
    this.grid.push(row)
    return true;
  }

  gp.addCol = function ()
  {
    var curCols = this.colCount(true);
    if (this.settings.maxCols && curCols == this.settings.maxCols)
    {
      return false;
    }
    var newCols = curCols++;
    this.initGrid(null, newCols);
    return true;
  }

  gp.rowCount = function (currentOnly)
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

  gp.colCount = function (currentOnly)
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

  gp.initGrid = function (rows, cols)
  {
    console.debug("initGrid", rows, cols);
    if (!rows)
      rows = this.rowCount();
    console.debug("initGrid.rows", rows);
    for (var i = 0; i < rows; i++)
    {
      if (!this.grid[i])
      {
        this.addRow();
      }
      else
      {
        this.initRow(this.grid[i], cols);
      }
    }
  }

  gp.resetGrid = function ()
  {
    this.grid = [];
    this.initGrid();
  }

  gp.buildGrid = function (addOpts)
  {
    this.trigger('preBuildGrid', this.grid)
    this.resetGrid();
    for (var i = 0; i < this.items.length; i++)
    {
      this.addToGrid(this.items[i], addOpts);
    }
    this.trigger('postBuildGrid', this.grid);
  }

  gp.addToGrid = function (item, opts)
  {
    console.debug("addToGrid", item, opts);

    if ('x' in item && 'y' in item)
    {
      if (!this.resolveConflicts(item, opts))
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
      for (var x = item.x; x < item.x + item.w; x++)
      {
        console.debug("adding item", item, y, x);
        this.grid[y][x] = item;
      }
    }

    return true;
  }

  gp.itemFits = function (item, pos)
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
        if (col && col !== item)
        {
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

  gp.findEmptyPosition = function (item, opts)
  {
    opts = opts || {};
    var starty = opts.x !== undefined 
      ? opts.x
      : (item.y !== undefined ? item.y : 0);
    var startx = opts.y !== undefined
      ? opts.y
      : (item.x !== undefined ? item.x : 0);
    var endy = this.settings.maxRows
      ? this.settings.maxRows
      : this.rowCount() + 1;
    var endx = this.settings.maxCols
      ? this.settings.maxCols
      : this.colCount() + 1;
    for (var y = starty; y < endy; y++)
    {
      for (var x = startx; x < endx; x++)
      {
        var fits = this.itemFits(item, {x: x, y: y});
        if (fits === true)
        { // The item fits at this position.
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
        else if (Array.isArray(fits))
        { // Skip the width of the first conflicting item.
          x += fits[0].w - 1;
        }
      }
    }
    return false;
  }

  gp.sortItems = function ()
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

  gp.removeFromGrid = function (item, opts)
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

  /**
   * Use our configured conflict resolution method.
   */
  gp.resolveConflicts = function (item, opts)
  {
    if (this.itemFits(item))
    {
      return true;
    }

    var meth = this.settings.conflictResolution;
    if (typeof meth === 'string' && this.resolveConflicts[meth] !== undefined)
      return this.resolveConflicts[meth].call(this, item, opts);
    else
      return false;
  }

  /**
   * Use findEmptyPosition() to find an available space.
   */
  gp.resolveConflicts.findEmpty = function (item, opts)
  {
    return this.findEmptyPosition(item, opts);
  }

  // existing items to make things fit nicely.

  gp.addItem = function (item, options)
  {
    options = options || {};
    this.trigger('preAddItem', item, options);
    this.items.push(item);
    if (options.rebuild)
      this.buildGrid(options);
    else if (options.add)
      this.addToGrid(item, options);
    this.trigger('postAddItem', item, options);
  }

  gp.removeItem = function (item, options)
  {
    options = options || {};
    this.trigger('preRemoveItem', item, options);
    var offset = this.items.indexOf(item);
    this.items.splice(offset, 1);
    if (options.rebuild)
      this.buildGrid(options);
    else if (options.remove)
      this.removeFromGrid(item, otions);
    this.trigger('postRemoveItem', item, options);
  }

  /**
   * DisplayGrid
   *
   * An extension of the Grid library with extra features for dealing with
   * DOM elements and events, for rendering a grid on a web page.
   */
  var DisplayGrid = Grid.Display = function (options)
  {
    options = options || {};

    // Apply our settings.
    var settings =
    {
      displayWidth:  0,     // Width of the display area.
      displayHeight: 0,     // Height of the display area.
      cellWidth:     0,     // Width of a single 'cell'.
      cellHeight:    0,     // Height of a single 'cell'.
      cellPadding:   5,     // Padding between cells.
      resizeMaxRows: false, // If displayHeight changes, update maxRows.
      resizeMaxCols: true,  // If displayWidth changes, update maxCols.
    };
    this.applySettings(settings, options);

    // Call our parent constructor.
    Grid.call(this, options);

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
    this.on('postAddItem', rebuild);
    this.on('postRemoveItem', rebuild);
  }
  Nano.extend(Grid, DisplayGrid,
  {
    /*
    copyProperties:
    {
      all: true, 
      exclude: ['Display']
    }
    */
  });

  var dp = DisplayGrid.prototype;

  dp._constructor = DisplayGrid;

  dp.setDisplayElement = function (displayElem, options)
  {
    if (!displayElem) return;
    var set = this.settings;
    set.displayWidth = displayElem.offsetWidth;
    set.displayHeight = displayElem.offsetHeight;
    var cellElem = options.cellElement;
    if (cellElem)
    {
      set.cellWidth = cellElem.offsetWidth;
      set.cellHeight = cellElem.offsetHeight;
    }
    var regen = false;
    if (set.resizeMaxRows && set.displayHeight && set.cellHeight)
    {
      set.maxRows = Math.floor(set.displayHeight / (set.cellHeight+set.cellPadding));
      regen = true;
    }
    if (set.resizeMaxCols && set.displayWidth && set.cellWidth)
    {
      set.maxCols = Math.floor(set.displayWidth / (set.cellWidth+set.cellPadding));
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

    console.debug("set display element", displayElem, cellElem, set, regen, rebuild);
  }

  dp.clone = function ()
  {
    var clone = gp.clone.call(this);
    if (clone.items.length > 0)
    {
      clone.buildDisplay();
    }
    return clone;
  }

  dp.buildDisplay = function ()
  {
    this.display = [];
    var set = this.settings;
    var cw = set.cellWidth;
    var ch = set.cellHeight;
    var cpFirst = set.cellPadding;
    var cpNext = cpFirst * 2;
    for (var i = 0; i < this.items.length; i++)
    {
      var gitem = this.items[i];
      var ditem = 
      {
        item: gitem,
        x: gitem.x * cw + (gitem.x ? cpNext : cpFirst),
        y: gitem.y * ch + (gitem.y ? cpNext : cpFirst),
        w: gitem.w * cw,
        h: gitem.h * ch,
      };
      this.display.push(ditem);
    }
  }

  dp.getCursorPos = function (e)
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

  dp.displayPos = function (pos)
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
    // Note due to padding, this may not be totally accurate.
    var cw = this.settings.cellWidth;
    var ch = this.settings.cellHeight;
    var drow = (pos.y ? Math.floor(pos.y / ch) : 0);
    var dcol = (pos.x ? Math.floor(pos.x / cw) : 0);
    gpos.pos = {x: dcol, y: drow};

    return gpos;
  }

  dp.displayItemFits = function (pos, dim)
  {
    var gpos = this.displayPos(pos);

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

    var fits = this.itemFits(testpos);
    if (typeof fits === 'boolean')
    { // Return value is if the item fits, no conflicts detected.
      gpos.fits = fits;
      gpos.conflicts = [];
    }
    else
    { // Return value is a list of conflicts, obvious the item doesn't fit.
      gpos.fits = false;
      gpos.conflicts = fits;
    }

    // Return what we found.
    return gpos;
  }

})();
