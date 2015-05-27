/**
 * Status messages, compatible with Nano.php's message format.
 *
 * TODO: replace hard coded HTML with riot template support.
 * TODO: support 'vars' like PHP version.
 */
 
"use strict";

import $ from 'ext/jquery';
import vsprintf from 'ext/vsprintf';
import 'json.jq';

export default class Status
{
  construct (options)
  {
    if (options === undefined || options === null)
      options = {};
  
    var msgs = options.msgElement !== undefined 
        ? options.msgElement 
        : '#status_messages';
  
    this.messages = $(msgs).JSON();
   
    this.alerts = options.uiElement !== undefined
        ? options.uiElement
        : '#alerts';
  
    this.onShow = options.onShow;
  
    var default_symbols = {"error":"!", "warning":"?", "message":"*"};
  
    this.symbols = options.symbols !== undefined
        ? options.symbols
        : default_symbols;
  }
  
  show (type, message, tag)
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
  
  get (msgid, reps)
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
  
  clear (tag)
  {
    $(this.alerts+' div.'+tag).remove();
    if ($(this.alerts+' div').length == 0)
    {
      $(this.alerts).hide();
    }
  }
  
  msg (msgid, tag, reps, type)
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
  
  warn (msgid, tag, reps)
  {
    this.msg(msgid, tag, reps, 'warning');
  }
  
  err (msgid, tag, reps)
  {
    this.msg(msgid, tag, reps, 'error');
  }
 
} // class Status

