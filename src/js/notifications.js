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
  
  if (window.Nano === undefined || Nano.addProperty === undefined)
  {
    throw new Error("Nano core not loaded");
  }

  var Not = Nano.Notifications = class
  {
    constructor (options={})
    {
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
      this.alerts    = {};
  
      this.expandedItems = {};
  
      if (this.notifications !== undefined)
      {
        for (var n in this.notifications)
        {
          var notification = this.notifications[n];
          this.extendNotification(notification);
        }
      }
  
      this.renderItem = 'renderItem' in options 
        ? options.renderItem : Not.Engines.element;
  
      this.renderAlert = 'renderAlert' in options 
        ? options.renderAlert : Not.Engines.element
  
      this.itemTemplate = 'itemTemplate' in options
        ? options.itemTempate : '#notification_item .notification';
      this.alertTemplate = 'alertTemplate' in options 
        ? options.alertTemplate : '#notification_alert .notification';
  
      this.paneSelector = 'paneSelector' in options ?
        options.paneSelector : '#notification_centre';
  
      this.listSelector = 'listSelector' in options ?
        options.listSelector : '.notifications';
  
      this.alertsSelector = 'alertsSelector' in options ?
        options.alertsSelector : '#notification_alerts';
  
      this.notificationSelector = 'notificationSelector' in options 
        ? options.notificationSelector : '.notification';
  
      this.iconSelector = 'iconSelector' in options ? 
        options.iconSelector : '#notification_icon';
  
      this.msgKeyAttr = 'msgKeyAttr' in options
        ? options.msgKeyAttr : 'messagekey';
  
      this.dockClass = 'dockClass' in options
        ? options.dockClass : 'overlay';
  
      var doInit = 'autoInitialize' in options ? options.autoInitialize : true;
      var doDraw = 'autoDraw' in options ? options.autoDraw : true;
  
      if (doInit)
        this.initialize();
      if (doDraw)
        this.redrawList();
    }
  
    initialize ()
    {
      this.paneElement = $(this.paneSelector);
      this.listElement = this.paneElement.find(this.listSelector);
      this.alertsElement = $(this.alertsSelector);
      this.iconElement = $(this.iconSelector);
  
      var self = this;
  
      this.paneElement.on('click', '.dock', function ()
      {
        self.toggleDock();
      });
  
      this.paneElement.on('click', '.close', function ()
      {
        self.togglePane(false);
      });
  
      this.listElement.on('click', '.togglemsgs', function ()
      {
        self.toggleMore(this);
      });
  
      this.iconElement.on('click', function ()
      {
        self.togglePane();
      });
    }
  
    extendNotification (notification)
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
  
      Nano.addProperty(notification, 'remove', function ()
      {
        if (this.key)
        {
          if (this.key in this.parent.keyCount && this.parent.keyCount[this.key] > 0)
          { // Remove one from the key count.
            this.parent.keyCount[this.key]--;
            if (this.parent.keyCount[this.key] == 0)
            { // We've removed all messages of this key.
              this.parent.shown[this.key] = false;
            }
          }
        }
        if (this.class)
        {
          if (this.class in this.parent.hasStatus && this.parent.hasStatus[this.class] > 0)
          { // Remove one from the status count.
            this.parent.hasStatus[this.class]--;
          }
        }
      });
  
      if (notification.key)
      {
        if (notification.key in this.keyCount)
          this.keyCount[notification.key]++;
        else
          this.keyCount[notification.key] = 1;
      }
  
      if (notification.class)
      {
        if (notification.class in this.hasStatus)
          this.hasStatus[notification.class]++;
        else
          this.hasStatus[notification.class] = 1;
      }
  
      return notification;
    } // extendNotification
  
    getString (names, opts)
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
  
    addMessage (name, opts)
    {
      var message = this.buildMessage(name, opts);
      this.notifications.push(message);
      return message;
    }
  
    buildMessage (name, opts)
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
  
    clear (tag)
    {
      var selector = this.notificationSelector;
      if (tag !== undefined)
        selector += '.'+tag;
  
      var items = this.listElement.find(selector);
      items.remove();
  
      var filtered = [];
      var removed;
  
      if (tag !== undefined)
      {
        removed = [];
        for (var n in this.notifications)
        {
          var notice = this.notifications[n];
          if (notice.opts.tag === tag)
          {
            removed.push(notice);
            notice.remove();
          }
          else
          {
            filtered.push(notice);
          }
        }
      }
      else
      {
        removed = this.notifications;
        this.hasStatus = {};
        this.keyCount  = {};
        this.shown     = {};
      }
  
      this.notifications = filtered;
      this.updateIcon();
      return removed;
    }
  
    showMessage (message)
    {
      var selector = this.itemTemplate;
      var msg = this.renderItem(selector, message);
      if (this.shown[message.key])
        msg.addClass('hidden');
      this.listElement.append(msg);
    }
  
    showAlert (message)
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
  
        var timer;
  
        var callback = function (fadeTime)
        {
          if (fadeTime === undefined)
            fadeTime = 800;
          msg.fadeOut(fadeTime, function ()
          {
            delete self.alerts[timer];
            msg.remove();
          });
        }
  
        timer = setTimeout(callback, timeout);
  
        this.alerts[timer] = callback;
  
        msg.find('.close').on('click', function (e)
        {
          e.stopPropagation();
          clearTimeout(timer);
          callback(300);
        });
  
        msg.on('click', function (e)
        {
          for (var timer in self.alerts)
          {
            var callback = self.alerts[timer];
            clearTimeout(timer);
            callback(300);
          }
          self.togglePane(true);
        });
      }
    }
  
    redrawList ()
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
      this.updateIcon();
    }
  
    msg (name, opts, reps)
    {
      if (opts === undefined)
        opts = {};
      else if (typeof opts === 'string')
        opts = {tag: opts};
  
      if (reps !== undefined)
        opts.reps = reps;
  
      var message = this.addMessage(name, opts);
      this.showMessage(message);
      this.showAlert(message);
      this.shown[message.key] = true;
      this.updateIcon();
    }
  
    warn (name, opts, reps)
    {
      if (opts === undefined)
        opts = {};
      else if (typeof opts === 'string')
        opts = {tag: opts};
      opts.type = 'warning';
      this.msg(name, opts, reps);
    }
  
    err (name, opts, reps)
    {
      if (opts === undefined)
        opts = {};
      else if (typeof opts === 'string')
        opts = {tag: opts};
      opts.type = 'error';
      this.msg(name, opts, reps);
    }
  
    updateIcon ()
    {
      var icon = this.iconElement;
      var count = this.notifications.length;
      var iconSpan = icon.find('span');
      if (count > 0)
        iconSpan.text(count);
      else
        iconSpan.text('-');
      iconSpan.removeClass('none message warning error');
      var classes = ['error','warning','message'];
      var foundClass = false;
      for (var c in classes)
      {
        var className = classes[c];
        if (this.hasStatus[className])
        {
          iconSpan.addClass(className);
          foundClass = true;
          break;
        }
      }
  
      if (!foundClass)
      {
        iconSpan.addClass('none');
      }
    }
  
    hideMore ()
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
  
    toggleMore (elem)
    {
      var sel = this.notificationSelector;
      var msg = $(elem).closest(sel);
      var attr = this.msgKeyAttr;
      var key = msg.attr(attr);
      var list = this.listElement;
      var all = list.find(sel+'['+attr+'="'+key+'"]');
  //    console.log("toggleMore", elem, sel, msg, all);
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
  
    togglePane (toggle)
    {
      this.paneElement.toggle(toggle);
    }
  
    toggleDock (toggle)
    {
      this.paneElement.toggleClass(this.dockClass, toggle);
    }

  } // class Nano.Notifications

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

})(jQuery);