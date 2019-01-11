(function()
{
  "use strict";

  /**
   * NOTE: this is currently broken, and needs rewriting.
   * Don't use it at this time.
   */

  var rc = Nano.Grid.prototype.resolveConflicts;

  if (window.Nano === undefined)
  {
    console.error("fatal error: Nano core not loaded");
    return;
  }
  if (!Nano.hasNamespace('Nano.Grid'))
  {
    console.error("fatal error: Nano.Grid library not loaded");
    return;
  }

  rc.shiftDown = function (item, conflicts, opts)
  {
    if (conflicts === false)
    { // No conflicts.
      return this.findEmptyPosition(item, opts);
    }

    var reverse = opts.reverse !== undefined ? opts.reverse : false;

    // Next we'll recurse the conflict resolution on each conflicting item.
    for (var c in conflicts)
    {
      var citem = conflicts[c];
      var pos =
      {
        x: item.x,
        y: reverse ? item.y-item.h : item.y+item.h,
      };
      if (reverse && pos.y < 0) pos.y = 0; // No negatives.
      var fits = this.itemFits(citem, pos);
      if (fits === false)
      { // No space? Uh oh.
        return false;
      }
      citem.y = pos.y;
      this.moveItem(citem);
    }

    // If we reached here, everything fit.
    return true;
  }
  rc.shiftDown.addFirst = true;

  rc.shiftUp = function (item, conflicts, opts)
  {
    opts.reverse = true;
    return this.resolveConflicts.shiftDown.call(this, item, conflicts, opts);
  }
  rc.shiftUp.addFirst = true;

  rc.shiftRight = function (item, conflicts, opts)
  {
    if (conflicts === false)
    { // No conflicts.
      return this.findEmptyPosition(item, opts);
    }

    var reverse = opts.reverse !== undefined ? opts.reverse : false;

    // Next we'll recurse the conflict resolution on each conflicting item.
    for (var c in conflicts)
    {
      var citem = conflicts[c];
      var pos =
      {
        x: reverse ? item.x-item.w : item.x+item.w,
        y: item.y,
      };
      if (reverse && item.x < 0) item.x = 0; // No negatives.
      var fits = this.itemFits(citem, pos);
      if (fits === false)
      { // No space? Uh oh.
        return false;
      }
      citem.x = pos.x;
      this.moveItem(citem);
    }

    // If we reached here, everything fit.
    return true;
  }
  rc.shiftRight.addFirst = true;

  rc.shiftLeft = function (item, conflicts, opts)
  {
    opts.reverse = true;
    return this.resolveConflicts.shiftRight.call(this, item, conflicts, opts);
  }
  rc.shiftLeft.addFirst = true;

  /**
   * A cascading form of item shuffling.
   *
   * It tries shifting conflicts left, right, above, below, in that order.
   * If all of those fail, it moves the conflicts to an empty position.
   */
  rc.shiftAll = function (item, conflicts, opts)
  {
    if (conflicts === false)
    { // No conflicts, try to find an optimal position for the item.
      // TODO: try shifting desired position just a little.
      return this.findEmptyPosition(item, opts);
    }

    var order = this.resolutionOrder();
    var meths =
    {
      l: 'shiftLeft',
      r: 'shiftRight',
      u: 'shiftUp',
      d: 'shiftDown',
    };

    for (var o = 0; o < order.length; o++)
    {
      var mname = order[o];
      var meth = meths[mname];
      if (meth && this.resolveConflicts[meth].call(this, item, conflicts, opts))
      {
        return true;
      }
    }

    // Nothing else worked, fall back on findEmptyPosition.
    return this.findEmptyPosition(item, opts);
  }
  rc.shiftAll.addFirst = true;

})();