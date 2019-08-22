(function($)
{
  /**
   * This is not a standard test file used by the test suite.
   * Instead it's the view controller for the nanogrid_*.html test files.
   */

  var ws, git;
  var render = Nano.render.riot2;
  var dt = window.DashTest = {};
  var oq = Nano.oQuery;
  var availableClasses =
  [
    ['test1', 'Class A'],
    ['test2', 'Class B'],
    ['test3', 'Class C'],
  ];
  Nano.array.extend(availableClasses, 'random');
  var gridOpts =
  {
    cellPadding: 5,
    resizeMaxCols: true,
    resizeDisplayHeight: true,
  };
  dt.grid = new Nano.Grid.UI(gridOpts);
  dt.assignedItems = {};
  dt.padding = 5; // Five pixel padding.

  dt.initAssigned = function ()
  {
    for (var i = 1; i < 100; i++)
    {
      var id = sprintf('%02d', i);
      dt.assignedItems[id] = false;
    }
  }

  dt.getAvailableId = function ()
  {
    for (var id in dt.assignedItems)
    {
      if (dt.assignedItems[id] === false)
      {
        dt.assignedItems[id] = true;
        return id;
      }
    }
  }

  dt.freeAvailableId = function (id)
  {
    if (dt.assignedItems[id] !== undefined)
    {
      dt.assignedItems[id] = false;
    }
  }

  dt.addItem = function (type, prefix, pos, opts)
  {
    console.log("addItem", type, prefix, pos, opts);
    var newId = dt.getAvailableId();
    if (!newId)
    {
      console.error("Workspace is full, cannot add any more items.");
      return false;
    }
    if (pos === undefined)
      pos = {};
    if (pos.h === undefined)
      pos.h = 1;
    if (pos.w === undefined)
      pos.w = 1;
    var item = 
    {
      id:   newId, 
      type: type, 
      name: prefix + ' ' + newId,
      h: pos.h, 
      w: pos.w,
    };
    if (pos.x !== undefined)
      item.x = pos.x;
    if (pos.y !== undefined)
      item.y = pos.y;
    dt.grid.addItem(item, opts);
    return item;
  }

  dt.removeItem = function (gitem)
  {
    dt.freeAvailableId(gitem.id);
    dt.grid.removeItem(gitem);
  }

  dt.renderGridLayout = function ()
  {
    var table = $('#gridlayout tbody');
    table.empty();
    for (let x = 0; x < dt.grid.rowCount(); x++)
    {
      let row = dt.grid.grid[x];
      let tr = $('<tr/>');
      for (let y = 0; y < dt.grid.colCount(); y++)
      {
        let col = row[y];
        let td;
        if (col === null)
          td = $('<td>--</td>');
        else if (col === undefined)
          td = $('<td>!!</td>');
        else if (col.id === null)
          td = $('<td>??</td>');
        else
          td = $('<td>'+col.id+'</td>');
        tr.append(td);
      }
      table.append(tr);
    }
  }

  dt.renderGridItems = function ()
  {
    var list = $('#griditems tbody');
    list.empty();
    var tmpl = $('#griditems_item_template').html();
    for (var i = 0; i < dt.grid.items.length; i++)
    {
      var item = dt.grid.items[i];
      var el = render(tmpl, item);
      list.append(el);
    }
  }

  dt.removeAll = function (redraw)
  {
    dt.grid.items.splice(0);
    dt.grid.resetGrid();
    dt.initAssigned();
    dt.grid.resetDisplaySize();
    if (redraw)
    {
      dt.renderWorkspace();
    }
  }

  dt.repopulate = function ()
  {
    dt.removeAll(false);
    dt.populateSamples();
    dt.renderWorkspace();
  }

  dt.populateSamples = function ()
  {
    var prefix = 'Initial';
    var items =
    [
      ['test1', prefix, {x: 0, y: 0}],
      ['test1', prefix, {x: 0, y: 1}],
      ['test2', prefix, {x: 1, y: 0, w: 2}],
      ['test1', prefix, {x: 2, y: 1, h: 3}],
      ['test3', prefix, {x: 3, y: 0, h: 2, w: 2}],
    ];
    for (var i in items)
    {
      var item = items[i];
      if (!dt.addItem(item[0], item[1], item[2], {add: false}))
      { // We can't add any more items.
        break;
      }
    }
    dt.grid.buildGrid();
    dt.addAvailable(availableClasses);
  }

  dt.spawnItems = function (number)
  {
    for (var i = 0; i < number; i++)
    {
      var itemClass = availableClasses.random();
//      console.log("item class", itemClass);
      var newItem = dt.addItem(itemClass[0], 'Spawned', {}, {add: false});
      if (!newItem)
      {
        break;
      }
    }
    dt.grid.buildGrid();
  }

  dt.addAvailable = function (avail)
  {
    var tmpl = $('#itemlist_item_template').html();
    var list = $('#itemlist');
    list.empty();
    for (var a in avail)
    {
      var ai = avail[a];
//      console.log("adding available", ai);
      var el = render(tmpl, {type: ai[0], name: ai[1]});
      list.append(el);
    }
  }

  dt.renderWorkspace = function ()
  {
    ws.empty();
    dt.grid.buildDisplay();
    var wsHeight = ws.height();
    for (var i = 0; i < dt.grid.display.length; i++)
    {
      var ditem = dt.grid.display[i];
      var gitem = ditem.gridItem;
      var hitem = $(render(git, gitem));
      dt.grid.addItemToDisplay(ditem, hitem);
//      console.log("placed item", hitem, ditem);
    }
    dt.renderGridItems();
    dt.renderGridLayout();
  }

  dt.resetDrag = function ()
  {
    dt.moving   = null;
    dt.adding   = null;
  }

  dt.getItemFromElement = function (gelem)
  {
    var gid = gelem.prop('id').replace('grid-item-','');
    return oq.get(gid, dt.grid.items);
  }

  dt.dropOnGrid = function (ev)
  {
    ev.preventDefault();
    ev.stopPropagation();
    var dropped = ev.originalEvent.dataTransfer.getData('text');
    var gelem = dt[dropped];
    var gid,gitem;
    if (dropped === 'adding')
    {
      gid = gelem.prop('id');
    }
    else
    {
      gitem = dt.getItemFromElement(gelem);
      gid = gitem.id;
    }
    var finfo = dt.grid.displayItemFits(ev, gitem);
    console.log("dropped", dropped, gelem, gitem, finfo, ev);

    if (finfo && finfo.fits)
    {
      if (dropped === 'adding')
      {
        var newitem = dt.addItem(gid, 'Added', finfo.pos);
        if (newitem)
        {
          dt.renderWorkspace();
        }
      }
      else if (dropped === 'moving')
      {
        dt.grid.moveItem(gitem, finfo.pos);
        dt.renderWorkspace();
      }
    }

    dt.resetDrag();
    return false;
  }

  dt.dropOnBody = function (ev)
  {
    ev.preventDefault();
    ev.stopPropagation();
    var dropped = ev.originalEvent.dataTransfer.getData('text');
    if (dropped === 'adding')
    {
      console.log("Cancelling add");
    }
    else if (dropped === 'moving')
    {
      var gelem = dt.moving;
      var gitem = dt.getItemFromElement(gelem);
      console.log("Removing item", gitem, gelem, ev);
      if (gitem !== undefined)
      {
        dt.removeItem(gitem);
        dt.renderWorkspace();
      }
    }

    dt.resetDrag();
    return false;
  }

  dt.dragExisting = function (ev)
  {
    dt.moving = $(this);
    ev.originalEvent.dataTransfer.setData('text', 'moving');
  }

  dt.dragAvailable = function (ev)
  {
    dt.adding = $(this);
    ev.originalEvent.dataTransfer.setData('text', 'adding');
  }

  dt.allowDrag = function (where)
  {
    var meth = function (ev) 
    {
      ev.preventDefault();
      ev.stopPropagation();
//    console.log("dragging over", where, this, ev);      
      return false;
    }
    return meth;
  }

  dt.toggleDragging = function (toggle)
  {
    var meth = function (ev)
    {
      var item = $(this).closest('.grid-item');
      item.prop('draggable', toggle);
    }
    return meth;
  }

  dt.resetResize = function ()
  {
    dt.resizing = null;
  }

  dt.enableResize = function (e)
  {
    if (!dt.resizing)
    {
      var grip = $(this);
      var elem = grip.closest('.grid-item');
      var item = dt.getItemFromElement(elem);
      console.log("enabling resize", elem, item);
      var onCalc = function (el, newWidth, newHeight, set)
      {
        var inner = el.children().first();
        if (newWidth >= set.cellWidth)
          inner.width(newWidth-dt.padding);
        if (newHeight >= set.cellHeight)
          inner.height(newHeight-dt.padding);
      }
      var onFinish = function (item, finfo)
      {
        dt.resetResize();
        dt.renderWorkspace();
      }
      dt.resizing = dt.grid.startResize(e, elem, item,
      {
        useEvents: true,
        onCalculate: onCalc,
        onFinish: onFinish,
      });
    }
  }

  dt.initDisplay = function ()
  {
    var ws = $('#workspace');

    // Ensure everything is clear.
    dt.resetDrag();
    dt.resetResize();
    dt.initAssigned();

    // First, let's build a fake item and get the size from it.
    var fakeItem =
    {
      type: 'test1',
      name: 'Loading',
    }
    fakeItem = $(render(git, fakeItem));
    ws.append(fakeItem);
//    console.log("fakeItem", fakeItem);
    dt.grid.setDisplayElement(ws[0], {cellElement: fakeItem[0]});
    fakeItem.remove();

    // Next let's register some events.
    ws
      .on('dragover', '.grid-item', dt.allowDrag('existing'))
      .on('dragover', dt.allowDrag('empty'))
      .on('drop', dt.dropOnGrid)
      .on('dragstart', '.grid-item', dt.dragExisting)
      .on('mouseover', 'addr', dt.toggleDragging(true))
      .on('mouseout',  'addr', dt.toggleDragging(false))
      .on('mousedown', 'grip', dt.enableResize);

    $('#itemlist').on('dragstart', '.list-item', dt.dragAvailable);

    $('body')
      .on('dragover', dt.allowDrag('body'))
      .on('drop', dt.dropOnBody);

    // We call this after adding an item to the display.
    dt.grid.on('postAddItemToDisplay', function (ditem, delem)
    {
      var child = delem.children().first();
      child.height(ditem.h-dt.padding);
      child.width(ditem.w-dt.padding);
    });

    // The spawner code.
    var spawnDiv = $('#spawner');
    var spawnCount = spawnDiv.find('input[type="number"]');
    spawnDiv.find('input[type="button"]').on('click', function (e)
    {
      var count = spawnCount.val();
      dt.spawnItems(count);
      dt.renderWorkspace();
    });

    // And some more buttons.
    $('#clearall').on('click', function (e)
    {
      dt.removeAll(true);
    });
    $('#repopulate').on('click', function (e)
    {
      dt.repopulate();
    });

    $('#conflict_resolution').on('change', function (e)
    {
      var val = $(this).val();
      if (val === 'none')
      { // Clear conflict resolution.
        console.log("Setting no conflict resolution.");
        dt.grid.settings.conflictResolution = null;
      }
      else
      { // Set the conflict resolution method.
        console.log("Setting conflict resolution to", val);
        dt.grid.settings.conflictResolution = val;
      }
    });
  }

  $(function ()
  {
    git = $('#workspace_item_template').html();
    ws = $('#workspace');
    dt.initDisplay();
    dt.populateSamples();
    dt.renderWorkspace();
  });

})(jQuery);
