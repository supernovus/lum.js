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
 * TODO: more flexible rendering options.
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
    { // This is the preferred way to pass in variables.
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

    this.itemTemplate = '#notification_item .notification';
    this.alertTemplate = '#notification_alert .notification';

    this.notificationSelector = '.notification';

    this.msgKeyAttr = 'messagekey';

    this.listElement = $('#notification_centre');
    this.alertsElement = $('#notification_alerts');
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
    warning: 5000,
    error:   7500,
  }

  Not.Engines = {};
  Not.Engines.element = function (selector, notification)
  {
    var elem = $(selector).clone();
    elem.addClass(notification.class);
    if (notification.opts.tag)
      elem.addClass(notification.opts.tag);
    elem.find('.message').text(notification.text);
    var togglemsgs = elem.find('.togglemsgs');
    if (togglemsgs.length > 0)
    {
      if (notification.keyCount() > 2)
      {
        
      }
    }
    return elem;
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
      var selector = this.alertTemplate;
      var msg = this.renderAlert(selector, message);
      this.alertsElement.append(msg);
      var timeout;
      if (message.opts.timeout)
        timeout = message.opts.timeout;
      else if (message.class in Not.Timeouts)
        timeout = Not.Timeouts[message.class];
      else
        timeout = Not.Timeouts.default;

      var callback = function ()
      {
        msg.fadeOut(800);
        msg.remove();
      }

      var timer = setTimeout(callback, timeout);

      msg.find('.close').on('click', function ()
      {
        clearTimeout(timer);
        msg.fadeOut(400);
        msg.remove();
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
    var msg = $(elem).closest('.notification');
    var attr = this.msgKeyAttr;
    var key = msg.attr(attr);
    var list = this.listElement;
    var sel = this.notificationSelector;
    var all = list.find(sel+'['+attr+'="'+key+'"]');
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

  Not.prototype.registerUI = function ()
  {
    var self = this;
    this.listElement.on('click', '.togglemsgs', function ()
    {
      self.toggleMore(this);
    });
  }

})(jQuery);