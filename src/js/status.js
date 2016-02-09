/**
 * Status messages, compatible with Nano.php's message format.
 *
 * Requires:
 *
 * #common
 * vsprintf
 *
 * TODO: replace hard coded HTML with riot template support.
 * TODO: support 'vars' like PHP version.
 */
 
(function ($)
{
  "use strict";
  
  if (window.Nano === undefined)
  {
    console.log("fatal error: Nano core not loaded");
    return;
  }
  
  Nano.Status = function (options)
  {
    if (options === undefined || options === null)
      options = {};
 
    if (options.messages !== undefined)
    {
      this.messages = options.messages;
    }
    else
    {
      var msgs = options.msgElement !== undefined 
          ? options.msgElement 
          : '#status_messages';
    
      this.messages = $(msgs).JSON();
    }
 
    this.alerts = options.uiElement !== undefined
        ? options.uiElement
        : '#alerts';

    this.onShow = options.onShow;

    var default_symbols = {"error":"!", "warning":"?", "message":"*"};
  
    this.symbols = options.symbols !== undefined
        ? options.symbols
        : default_symbols;
  }
  
  Nano.Status.prototype.show = function (type, message, tag)
  {
    var html = '<div class="news '+tag+'">'
      + '<span class="'+type+'">'+this.symbols[type]+'</span>'
      + '<span class="statusmessage">'+message+'</span>'
      + '</div>';
    if (this.onShow !== undefined && this.onShow !== null)
    {
      this.onShow(type, message, tag);
    }
    $(this.alerts).show().append(html);
  }
  
  Nano.Status.prototype.get = function (msgid, reps)
  {
    var msgtext = this.messages[msgid];
    if ($.isArray(reps))
    {
      msgtext = vsprintf(msgtext, reps);
    }
    else if ($.isPlainObject(reps))
    {
      for (var rkey in reps)
      {
        msgtext = msgtext.replace(rkey, reps[rkey])
      }
    }
    return msgtext;
  }
  
  Nano.Status.prototype.clear = function (tag)
  {
    $(this.alerts+' div.'+tag).remove();
    if ($(this.alerts+' div').length == 0)
    {
      $(this.alerts).hide();
    }
  }
  
  Nano.Status.prototype.msg = function (msgid, tag, reps, type)
  {
    if (type === undefined)
      type = 'message';

    if ($.isPlainObject(msgid))
    {
      if ('args' in msgid)
        reps = msgid.args;
      else if ('vars' in msgid)
        reps = msgid.vars;

      if ('key' in msgid)
        msgid = msgid.key;
      else
        return console.log("msg() message missing 'key'.");
    }
    else if ($.isArray(msgid))
    {
      reps  = msgid.slice(1);
      msgid = msgid[0];
    }

    var message = this.get(msgid, reps);
    this.show(type, message, tag);
  }
  
  Nano.Status.prototype.warn = function (msgid, tag, reps)
  {
    this.msg(msgid, tag, reps, 'warning');
  }
  
  Nano.Status.prototype.err = function (msgid, tag, reps)
  {
    this.msg(msgid, tag, reps, 'error');
  }
 
})(jQuery);
