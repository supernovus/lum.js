/*
 * Notifications
 *
 * Works with Nano.php's new Notifications library.
 * Replaces the old Status library.
 *
 * Requires:
 *
 *  #common (coreutils, json.jq, exists,jq)
 *  vsprintf
 *
 * Note: this object should be initialized after the document.ready
 *       event has been triggered to ensure the DOM is complete.
 *
 * TODO: make toggle more work with dynamically added messages.
 * TODO: more flexible rendering options.
 * TODO: support HTML 5 Notifications as an option for displaying alerts.
 *
 */

(function (Nano, $)
{
  "use strict";
  
  if (Nano === undefined)
  {
    throw new Error("Missing Luminaryn core");
  }

  Nano.needLibs('helpers');
  Nano.markLib('notifications');

  /**
   * A Notification system. 
   *
   * Can display messages of different classes to the user in various ways.
   */
  Nano.Notifications = class
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
        this.strings = $('#status_messages').JSON();
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

      let defHandlers = this.constructor.DefaultHandlers;
      this.actionHandlers = {};
      for (let d in defHandlers)
      {
        this.actionHandlers[d] = defHandlers[d];
      }
      if ('actionHandlers' in options)
      {
        for (let hname in options.actionHandlers)
        {
          this.addHandler(hname, options.actionHandlers[hname]);
        }
      }

      let defTypes = this.constructor.DefaultTypes;
      this.types = {};
      for (let d in defTypes)
      {
        this.types[d] = defTypes[d];
      }

      let defTimeouts = this.constructor.DefaultTimeouts;
      this.timeouts = {};
      for (let d in defTimeouts)
      {
        this.timeouts[d] = defTimeouts[d];
      }

      let defPrios = this.constructor.DefaultPriority;
      this.iconPriority = {};
      for (let d in defPrios)
      {
        this.iconPriority[d] = defPrios[d];
      }

      if ('timeouts' in options)
      {
        for (let t in options.timeouts)
        {
          this.timeouts[t] = options.timeouts[t];
        }
      }

      if ('iconPriority' in options)
      {
        for (let p in options.iconPriority)
        {
          this.iconPriority[p] = options.priority[p];
        }
      }

      if ('types' in options)
      {
        for (let typeName in options.types)
        {
          let typeOpts = options.types[typeName];
          this.addType(typeName, typeOpts);
        }
      }
  
      if (this.notifications !== undefined)
      {
        for (var n in this.notifications)
        {
          var notification = this.notifications[n];
          this.extendNotification(notification);
        }
      }

      let defEngine = this.constructor.DefaultEngine;
  
      this.renderItem = 'renderItem' in options 
        ? options.renderItem : defEngine;
  
      this.renderAlert = 'renderAlert' in options 
        ? options.renderAlert : defEngine;
  
      this.itemTemplate = 'itemTemplate' in options
        ? options.itemTempate : '#notification_item .notification';
      this.alertTemplate = 'alertTemplate' in options 
        ? options.alertTemplate : '#notification_alert .notification';
      this.itemActionTemplate = 'itemActionTemplate' in options
        ? options.itemActionTemplate : '#notification_action .action';
      this.alertActionTemplate = 'alertActionTemplate' in options
        ? options.alertActionTemplate : '#notification_action .action';
  
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
        this.redrawList(true);
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

        if (typeof this.opts.message === 'string')
        { // Pre-rendered text was included.
          return this.opts.message;
        }
  
        var prefix = 'prefix' in opts ? opts.prefix : '';
        var suffix = 'suffix' in opts ? opts.suffix : '';
  
        var fullname = prefix + name + suffix;
  
        var msgtext = this.parent.getString([fullname,name], opts);
  
        if (msgtext === undefined)
        { // Emergency fallback if no message key was found.
          msgtext = name;
          console.debug("Notification could not find text", this);
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
  
      Nano.addProperty(notification, 'remove', function (opts={})
      {
        if (opts === true)
        { // Remove from parent, and redraw the list.
          opts = {fromParent: true, updateIcon: false, redrawList: true};
        }
        else if (opts === false)
        { // All options are false.
          opts = {fromParent: false, updateIcon: false, redrawList: false};
        }
        else if (typeof opts !== 'object' || opts === null)
        { // That's not valid.
          throw new Error("Invalid 'opts' passed to notification.remove()");
        }

        // Set defaults if they aren't in the opts.
        if (opts.fromParent === undefined)
          opts.fromParent = true;
        if (opts.updateIcon === undefined)
          opts.updateIcon = true;
        if (opts.redrawList === undefined)
          opts.redrawList = false;
        if (opts.resendAlerts === undefined)
          opts.resendAlerts = false;

        if (opts.fromParent)
        {
          let pos = this.parent.notifications.indexOf(this);
          if (pos !== -1)
          { // We found it, remove it.
            this.parent.notifications.splice(pos, 1);
          }
        }

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

        if (opts.redrawList)
        {
          this.parent.redrawList(opts.resendAlerts);
        }
        else if (opts.updateIcon)
        {
          this.parent.updateIcon();
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
  
    getString (names, opts={})
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
      let types = this.types;
//      console.debug("types", types);
      if ('type' in opts && opts.type in types)
      {
        typeOpts = types[opts.type];
        delete opts.type;
      }
      else
      {
        typeOpts = types.default;
      }
//      console.debug("typeOpts", typeOpts);
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
            notice.remove(false);
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
      var actselector = this.itemActionTemplate;
      var msg = this.renderItem(selector, message, actselector);
      if (this.shown[message.key] && !message.opts.noGroup)
        msg.addClass('hidden');
      this.listElement.append(msg);
    }
  
    showAlert (message)
    {
      if (!this.shown[message.key])
      {
        var self = this;
        var selector = this.alertTemplate;
        var actselector = this.alertActionTemplate;
        var msg = this.renderAlert(selector, message, actselector);
        msg.hide();
        this.alertsElement.append(msg);
        msg.fadeIn(400);
        var timeout;
        let timeouts = this.timeouts;
        if (message.opts.timeout)
          timeout = message.opts.timeout;
        else if (message.class in timeouts)
          timeout = timeouts[message.class];
        else
          timeout = timeouts.default;
  
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
 
//        console.debug("Showing alert", message, timeout);
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
  
    redrawList (showAlerts=false)
    {
      // Clear existing notifications.
      this.listElement.find(this.notificationSelector).remove();
      this.shown = {};
      for (var n in this.notifications)
      {
        var notice = this.notifications[n];
        this.showMessage(notice);
        if (showAlerts)
        {
          this.showAlert(notice);
        }
        this.shown[notice.key] = true;
      }
      this.updateIcon();
    }
  
    send (name, opts={})
    {
      var message = this.addMessage(name, opts);
      this.showMessage(message);
      this.showAlert(message);
      this.shown[message.key] = true;
      this.updateIcon();
    }

    _getopts (opts, reps, type)
    {
      if (opts === undefined)
        opts = {};
      else if (typeof opts === 'string')
        opts = {tag: opts};
      if (reps !== undefined)
        opts.reps = reps;
      if (type !== undefined)
        opts.type = type;
      return opts;
    }

    msg (name, opts, reps)
    {
      this.send(name, this._getopts(opts, reps, 'message'));
    }
  
    warn (name, opts, reps)
    {
      this.send(name, this._getopts(opts, reps, 'warning'));
    }
  
    err (name, opts, reps)
    {
      this.send(name, this._getopts(opts, reps, 'error'));
    }

    notify (name, opts, reps)
    {
      this.send(name, this._getopts(opts, reps, 'notice'));
    }

    iconClasses ()
    {
      let classes = [];
      let prios = this.iconPriority;
      for (let className in prios)
      {
        classes.push(className);
      }
      classes.sort((a,b) =>
      {
        return prios[b] - prios[a];
      });
      return classes;
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

      let classes = this.iconClasses();
      let classList = 'none '+classes.join(' ');

      iconSpan.removeClass(classList);
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

    /**
     * Add an action handler.
     *
     * @param {string} actionName  The name of the action.
     * @param {function} handlerFunc  The function to handle the action.
     *
     * The exact nature of the handler depends on the engine being used.
     * In the default engine, the following signature is used:
     *
     * handler(notificationObject, notificationElement, actionElement, event);
     *
     * The context ('this') will be set to the Notifications instance itself.
     */
    addHandler (actionName, handlerFunc)
    {
      if (typeof actionName !== 'string')
      {
        throw new Error("actionName must be a string");
      }
      if (typeof handlerFunc !== 'function')
      {
        throw new Error("handlerFunc must be a function");
      }

      this.actionHandlers[actionName] = handlerFunc;
    }

    /**
     * Add a notification type.
     *
     * @param {string} typeName  The name of the type you are adding.
     * 
     * The special type name 'default' is used as a fallback if a notification
     * with an unknown or unspecified type is passed.
     *
     * @param {object} typeOpts  Options that will be inferred by the type.
     *
     * The typeOpts should at least contain a 'class' property, and can
     * contain any property of a Notification object. If the 'class' property
     * is not set, it will be set to the typeName.
     *
     * If the typeOpts contains a 'timeout' property, this will be set as
     * the timeout value for the type. It won't be included as one of the
     * properties in the notification object itself.
     *
     * If the typeOpts contains an 'iconPriority' property, this will be set
     * as the priorty value for the type. It won't be included as one of the
     * properties in the notifications object itself.
     */
    addType (typeName, typeOpts={})
    {
      if (typeof typeName !== 'string')
      {
        throw new Error("typeName must be a string");
      }
      if (typeof typeOpts !== 'object')
      {
        throw new Error("typeOpts must be an object");
      }

      if (typeof typeOpts.class !== 'string')
      {
        typeOpts.class = typeName;
      }

      if ('timeout' in typeOpts)
      {
        this.timeouts[typeOpts.class] = typeOpts.timeout;
        delete typeOpts.timeout;
      }

      if ('iconPriority' in typeOpts)
      {
        this.iconPriority[typeOpts.class] = typeOpts.iconPriority;
        delete typeOpts.iconPriority;
      }

      this.types[typeName] = typeOpts;
    }

  } // class Nano.Notifications

  Nano.Notifications.DefaultTypes =
  {
    default: {class: 'default'},
    message: {class: 'message', prefix: 'msg.',  actions:['dismiss']},
    error:   {class: 'error',   prefix: 'err.'},
    warning: {class: 'warning', prefix: 'warn.', actions:['dismiss']},
    notice:  {class: 'notice',  noGroup: true,   actions:['dismiss']},
    system:  {class: 'system',  noGroup: true},
  };

  Nano.Notifications.DefaultTimeouts =
  {
    default: 1500,
    message: 1500,
    notice:  2250,
    warning: 3000,
    system:  4500,
    error:   6000,
  }

  Nano.Notifications.DefaultPriority =
  {
    default: 100,
    message: 200,
    notice:  300,
    system:  400,
    warning: 500,
    error:   600,
  };

  Nano.Notifications.DefaultHandlers =
  {
    dismiss: function (notObj)
    {
      notObj.remove(true);
    }
  };

  Nano.Notifications.DefaultEngine = function (elselector, notification, actselector)
  {
    let elem = $(elselector).clone();
    elem.attr(this.msgKeyAttr, notification.key);
    elem.addClass(notification.class);
    let useHTML = 'isHTML' in notification.opts ? notification.opts.isHTML : false;
    if (notification.opts.tag)
      elem.addClass(notification.opts.tag);
    if (useHTML)
    {
      elem.find('.message').html(notification.text);
    }
    else
    {
      elem.find('.message').text(notification.text);
    }
    let actList = elem.find('.actions');
    if (actList.length > 0 && notification.opts && notification.opts.actions)
    {
      let handlers = this.actionHandlers;
      for (let a in notification.opts.actions)
      {
        let action = notification.opts.actions[a];
        let actElem = $(actselector).clone();
        actElem.addClass(action);
        let sopts = {default: action};
        let actName = this.getString(['action.'+action, action], sopts);
        actElem.text(actName);
        if (action in handlers)
        {
          let handler = handlers[action];
          let self = this;
          actElem.on('click', function (e)
          {
            handler.call(self, notification, elem, this, e);
          });
        }
        actList.append(actElem);
      }
    }
    let togglemsgs = elem.find('.togglemsgs');
    if (togglemsgs.length > 0)
    {
      if (notification.keyCount() >= 2 && !notification.opts.noGroup)
      {
        let morekeys = notification.keyCount() - 1;
        let sopts = {reps:[morekeys], default: "%s more ..."};
        let moretext = this.getString('more_status', sopts);
        sopts.default = "%s less ...";
        let lesstext = this.getString('less_status', sopts);
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

})(window.Luminaryn, window.jQuery);