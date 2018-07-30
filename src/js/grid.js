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
      return this.grid.length;
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

  gp.buildGrid = function ()
  {
    this.trigger('preBuildGrid', this.grid)
    this.resetGrid();
    for (var i = 0; i < this.items.length; i++)
    {
      this.addToGrid(this.items[i]);
    }
    this.trigger('postBuildGrid', this.grid);
  }

  gp.addToGrid = function (item)
  {
    console.debug("addToGrid", item);

    if ('x' in item && 'y' in item && !this.resolveConflicts(item))
    {
      return false;
    }
    else if (!this.findEmptyPosition(item))
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

  gp.itemFits = function (item)
  {
    return true;
  }

  gp.findEmptyPosition = function (item)
  {
    return true;
  }

  gp.removeFromGrid = function (item)
  {
    return true;
  }

  gp.resolveConflicts = function (item)
  {
    return true;
  }

  gp.addItem = function (item, options)
  {
    options = options || {};
    this.trigger('preAddItem', item, options);
    this.items.push(item);
    if (options.rebuild)
      this.buildGrid();
    else if (options.add)
      this.addToGrid(item);
    this.trigger('postAddItem', item, options);
  }

  gp.removeItem = function (item, options)
  {
    options = options || {};
    this.trigger('preRemoveItem', item, options);
    var offset = this.items.indexOf(item);
    this.items.splice(offset, 1);
    if (options.rebuild)
      this.buildGrid();
    else if (options.remove)
      this.removeFromGrid(item);
    this.trigger('postRemoveItem', item, options);
  }

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

    // We can also apply displayWidth/displayHeight from a DOM element.
    if ('displayElement' in options)
    {
      this.setDisplayElement(options.displayElement, options);
    }

    // Call our parent constructor.
    Grid.call(this, options);
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

  dp.setDisplayElement = function (displayElem, cellElem, rebuild)
  {
    if (!displayElem) return;
    var set = this.settings;
    set.displayWidth = displayElem.offsetWidth;
    set.displayHeight = displayElem.offsetHeight;
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
    console.debug("set display element", displayElem, cellElem, set, regen);
    if (regen)
    {
      this.buildGrid();
    }
    if (this.display !== undefined && rebuild === undefined)
      rebuild = true;
    if (rebuild)
    { // Rebuild the display.
      this.buildDisplay();
    }
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

})();
