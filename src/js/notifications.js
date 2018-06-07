/**
 * Notifications
 *
 * Works with Nano.php's new Notifications library.
 * Replaces the old Status library.
 *
 * Requires:
 *
 *  #common
 *  vsprintf
 *
 * Note: this object should be initialized after the document.ready
 *       event has been triggered to ensure the DOM is complete.
 *
 * TODO: more flexible rendering options.
 * TODO: more class names as options.
 */

(function ($)
{
  "use strict";
  
  if (window.Nano === undefined)
  {
    console.error("fatal error: Nano core not loaded");
    return;
  }

  var Not = Nano.Notifications = function (options)
  {
    if (options === undefined)
      options = {};

    if (Nano.observable !== undefined)
      Nano.observable(this);

    if (options.strings !== undefined)
    { // For maximum flexibility, pass in the strings/notifications.
      this.strings = options.strings;
      if (options.notifications !== undefined)
      {
        this.notifications = options.notifications;
      }
    }
    else if ($('#modeldeps').length > 0)
    { // Compatibility with modeldeps style storage.
      var modeldeps = $('#modeldeps').JSON();
      if ('msgs' in modeldeps)
      {
        this.strings = modeldeps.msgs;
      }
      if ('notifications' in modeldeps)
      {
        this.notifications = modeldeps.notifications;
      }
    }
    else if ($('#status_messages').length > 0)
    { // Compatibility with older 'status_messages' storage.
      this.strings = $('#status_messages').JSON;
      if ($('#notifiation_messages').length > 0)
      {
        this.notifications = $('#notification_messages').JSON();
      }
    }

    this.hasStatus = {};
    this.keyCount  = {};
    this.shown     = {};

    this.expandedItems = {};

    if (this.notifications !== undefined)
    {
      for (var n in this.notifications)
      {
        var notification = this.notifications[n];
        this.extendNotification(notification);
      }
    }

    this.renderItem = 'renderItem' in options ? options.renderItem 
      : Not.Engines.element;

    this.renderAlert = 'renderAlert' in options ? options.renderAlert
      : Not.Engines.element

    this.itemTemplate = 'itemTemplate' in options
      ? options.itemTempate : '#notification_item .notification';
    this.alertTemplate = 'alertTemplate' in options 
      ? options.alertTemplate : '#notification_alert .notification';

    this.listSelector = 'listSelector' in options ?
      options.listSelector : '#notification_centre';
    this.alertsSelector = 'alertsSelector' in options ?
      options.alertsSelector : '#notification_alerts';

    this.notificationSelector = 'notificationSelector' in options 
      ? options.notificationSelector : '.notification';

    this.iconSelector = 'iconSelector' in options ? 
      options.iconSelector : '#notification_icon';

    this.msgKeyAttr = 'msgKeyAttr' in options
      ? options.msgKeyAttr : 'messagekey';

    var doInit = 'autoInitialize' in options ? options.autoInitialize : true;
    var doDraw = 'autoDraw' in options ? options.autoDraw : true;

    if (doInit)
      this.initialize();
    if (doDraw)
      this.redrawList();
  }

  Not.Types =
  {
    default: {class: 'message', prefix: 'msg.'},
    error:   {class: 'message', prefix: 'err.'},
    warning: {class: 'warning', prefix: 'warn.'},
  };

  Not.Timeouts =
  {
    default: 1500,
    message: 1500,
    warning: 3000,
    error:   6000,
  }

  Not.Engines = {};
  Not.Engines.element = function (selector, notification)
  {
    var elem = $(selector).clone();
    elem.attr(this.msgKeyAttr, notification.key);
    elem.addClass(notification.class);
    if (notification.opts.tag)
      elem.addClass(notification.opts.tag);
    elem.find('.message').text(notification.text);
    var togglemsgs = elem.find('.togglemsgs');
    if (togglemsgs.length > 0)
    {
      if (notification.keyCount() >= 2)
      {
        var morekeys = notification.keyCount() - 1;
        var sopts = {reps:[morekeys], default: "%s more ..."};
        var moretext = this.getString('more_status', sopts);
        sopts.default = "%s less ...";
        var lesstext = this.getString('less_status', sopts);
        togglemsgs.find('.moremsgs').text(moretext);
        togglemsgs.find('.lessmsgs').text(lesstext);
      }
      else
      {
        togglemsgs.addClass('hidden');
      }
    }
    return elem;
  }

  Not.prototype.initialize = function ()
  {
    this.listElement = $(this.listSelector);
    this.alertsElement = $(this.alertsSelector);
    this.iconElement = $(this.iconSelector);

    var self = this;

    this.listElement.on('click', '.togglemsgs', function ()
    {
      self.toggleMore(this);
    });

    this.iconElement.on('click', function (e)
    {
      self.toggleList();
    });
  }

  Not.prototype.extendNotification = function (notification)
  {
    Nano.addProperty(notification, 'parent', this);

    Nano.addAccessor(notification, 'text', 
    function ()
    {
      var name = this.name;
      var opts = this.opts;

      var prefix = 'prefix' in opts ? opts.prefix : '';
      var suffix = 'suffix' in opts ? opts.suffix : '';

      var fullname = prefix + name + suffix;

      var msgtext = this.parent.getString([fullname,name], opts);

      if (msgtext === undefined)
      { // Emergency fallback if no message key was found.
        msgtext = JSON.stringify(this);
      }

      return msgtext;
    },
    function (foo)
    {
      console.error("Notification text is immutable!");
    });

    Nano.addProperty(notification, 'keyCount', function ()
    {
      if (this.key && this.parent.keyCount[this.key] !== undefined)
      {
        return this.parent.keyCount[this.key];
      }
      return 1;
    });

    if (notification.key)
    {
      if (notification.key in this.keyCount)
        this.keyCount[notification.key]++;
      else
        this.keyCount[notification.key] = 1;
    }

    this.hasStatus[notification.class] = true;

    return notification;
  } // extendNotification

  Not.prototype.getString = function (names, opts)
  {
    if (typeof names === 'string')
      names = [names];

    var msgtext;
    for (var n in names)
    {
      var name = names[n];
      if (name in this.strings)
      {
        msgtext = this.strings[name];
        break;
      }
    }

    if (msgtext === undefined && 'default' in opts)
    {
      msgtext = opts.default;
    }

    if (msgtext !== undefined)
    {
      if (opts.reps !== undefined)
      {
        msgtext = vsprintf(msgtext, opts.reps);
      }
      else if (opts.vars !== undefined)
      {
        for (var rkey in opts.vars)
        {
          msgtext = msgtext.replace(rkey, opts.vars[rkey]);
        }
      }
    }

    return msgtext;
  } // getString()

  Not.prototype.addMessage = function (name, opts)
  {
    var message = this.buildMessage(name, opts);
    this.notifications.push(message);
    return message;
  }

  Not.prototype.buildMessage = function (name, opts)
  {
    if (opts === undefined)
      opts = {};
    
    var typeOpts;
    if ('type' in opts && opts.type in Not.Types)
    {
      var typeOpts = Not.Types[opts.type];
      delete opts.type;
    }
    else
    {
      typeOpts = Not.Types.default;
    }
    if (typeOpts !== undefined)
    {
      for (var o in typeOpts)
      {
        if (!(o in opts))
        {
          opts[o] = typeOpts[o];
        }
      }
    }

    var className = opts.class;
    delete opts.class;

    if ($.isPlainObject(name))
    {
      if ('args' in name)
        opts.reps = name.args;
      if ('vars' in name)
        opts.vars = name.vars;

      if ('key' in name)
        name = name.key;
      else
        return console.error("addMessage() missing 'key'");
    }
    else if ($.isArray(name))
    {
      opts.reps = name.slice(1);
      name = name[0];
    }

    var key = name.replace(/\s+/, '_');

    var message =
    {
      key:   key,
      name:  name,
      class: className,
      opts:  opts,
    }
    this.extendNotification(message);
    return message;
  }

  Not.prototype.showMessage = function (message)
  {
    var selector = this.itemTemplate;
    var msg = this.renderItem(selector, message);
    if (this.shown[message.key])
      msg.addClass('hidden');
    this.listElement.append(msg);
  }

  Not.prototype.showAlert = function (message)
  {
    if (!this.shown[message.key])
    {
      var self = this;
      var selector = this.alertTemplate;
      var msg = this.renderAlert(selector, message);
      msg.hide();
      this.alertsElement.append(msg);
      msg.fadeIn(400);
      var timeout;
      if (message.opts.timeout)
        timeout = message.opts.timeout;
      else if (message.class in Not.Timeouts)
        timeout = Not.Timeouts[message.class];
      else
        timeout = Not.Timeouts.default;

      var callback = function ()
      {
        msg.fadeOut(800, function ()
        {
          msg.remove();
        });
      }

      var timer = setTimeout(callback, timeout);

      msg.find('.close').on('click', function (e)
      {
        e.stopPropagation();
        clearTimeout(timer);
        msg.fadeOut(400, function ()
        {
          msg.remove();
        });
      });

      msg.on('click', function (e)
      {
        clearTimeout(timer);
        msg.fadeOut(400, function ()
        {
          msg.remove();
        });
        self.toggleList(true);
      });
    }
  }

  Not.prototype.redrawList = function ()
  {
    // Clear existing notifications.
    this.listElement.find(this.notificationSelector).remove();
    this.shown = {};
    for (var n in this.notifications)
    {
      var notice = this.notifications[n];
      this.showMessage(notice);
      this.showAlert(notice);
      this.shown[notice.key] = true;
    }
  }

  Not.prototype.msg = function (name, opts)
  {
    var message = this.addMessage(name, opts);
    this.showMessage(message);
    this.showAlert(message);
    this.shown[message.key] = true;
  }

  Not.prototype.warn = function (name, opts)
  {
    if (opts === undefined)
      opts = {};
    opts.type = 'warning';
    this.msg(name, opts);
  }

  Not.prototype.err = function (name, opts)
  {
    if (opts === undefined)
      opts = {};
    opts.type = 'error';
    this.msg(name, opts);
  }

  Not.prototype.hideMore = function ()
  {
    var sel = this.notificationSelector;
    var attr = this.msgKeyAttr;
    var list = this.listElement;
    for (var key in this.expandedItems)
    {
      if (this.expandedItems[key] === true)
      {
        var more = list.find(sel+'['+attr+'="'+key+'"]').not(':first');
        more.addClass('hidden');
        this.expandedItems[key] = false;
      }
    }
  } // hideMore()

  Not.prototype.toggleMore = function (elem)
  {
    var sel = this.notificationSelector;
    var msg = $(elem).closest(sel);
    var attr = this.msgKeyAttr;
    var key = msg.attr(attr);
    var list = this.listElement;
    var all = list.find(sel+'['+attr+'="'+key+'"]');
    console.log("toggleMore", elem, sel, msg, all);
    var more = all.not(':first');
    if (key in this.expandedItems && this.expandedItems[key] === true)
    {
      more.addClass('hidden');
      this.expandedItems[key] = false;
      all.find('.moremsgs').show();
      all.find('.lessmsgs').hide();
    }
    else
    {
      more.removeClass('hidden');
      this.expandedItems[key] = true;
      all.find('.moremsgs').hide();
      all.find('.lessmsgs').show();
    }
  }

  Not.prototype.toggleList = function (toggle)
  {
    this.listElement.toggle(toggle);
  }

})(jQuery);