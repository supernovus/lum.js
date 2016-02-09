/**
 * Editor framework
 *
 * Makes web based code editors easy to use.
 * Currently using Ace as it's backend component.
 */

(function($, ace, CryptoJS)
{
  "use strict";

  if (window.Nano === undefined)
  {
    console.log("fatal error: Nano core not loaded");
    return;
  }

  /**
   * Build an editor object.
   */ 
  Nano.Editor = function (opts)
  {
    this.lang = 'lang' in opts ? opts.lang : 'xml';
    this.srcType = 'sourceEncoding' ? opts.sourceEncoding : false;
    this.srcElement = 'sourceElement' in opts ? opts.sourceElement : null;
    this.srcUrl = 'sourceUrl' in opts ? opts.sourceUrl : null;
    this.editElement = 'editElement' in opts ? opts.editElement : 'editor';
    this.saveMethod = 'saveMethod' in opts ? opts.saveMethod : 'PUT';
  }

  var BASE64 = Nano.Editor.BASE64 = 'base64'; // virtual constant.

  Nano.Editor.prototype.getEditor = function ()
  {
    if (this.editor === undefined)
    {
      this.editor = ace.edit(this.editElement);
      if (this.lang)
        this.editor.getSession().setMode("ace/mode/"+this.lang);

    }
    return this.editor;
  }

  Nano.Editor.prototype.setLang = function (lang)
  {
    this.getEditor().getSession().setMode("ace/mode/"+lang);
    this.lang = lang;
  }

  Nano.Editor.prototype.load = function (data)
  {
    var dtype = typeof data;

    if (dtype === "string")
    { // The data is from a string.
      this.setData(data);
    }
    else if (dtype === "function")
    { // The data is from a function.
      this.setData(data(this));
    }
    else if (this.srcElement !== null)
    { // The data is from an element.
      data = $(this.srcElement).val();
      this.setData(data);
    }
    else if (this.srcUrl !== null)
    { // The data is from a URL.
      var self = this;
      $.get(this.srcUrl, function (data, textStatus, jq)
      {
        self.setData(data);
      }); 
    }
    else
    { // Unknown data.
      return false;
    }

    return true;
  }

  Nano.Editor.prototype.setData = function (data)
  {
    var editor = this.getEditor();
    if (this.srcType === BASE64)
    {
//      console.log("decoding base64: "+data);
      data = CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8);
//      console.log("decoded as: "+data);
    }
    editor.setValue(data);
  }

  Nano.Editor.prototype.loadUrl = function (url)
  {
    this.srcElement = null;
    this.srcUrl = url;
    return this.load();
  }

  Nano.Editor.prototype.loadTag = function (tag)
  {
    this.srcElement = tag;
    this.srcUrl = null;
    return this.load();
  }

  Nano.Editor.prototype.save = function (callback, method)
  {
    var editor = this.getEditor();

    if (method === undefined || method === null)
      method = this.saveMethod;

    var data = editor.getValue();

    if (this.srcType === BASE64)
    {
//      console.log("encoding text: "+data);
      data = CryptoJS.enc.Utf8.parse(data);
      data = CryptoJS.enc.Base64.stringify(data);
//      console.log("encoded to: "+data);
    }

    if (typeof callback === "function")
    {
      var newdata = callback(data, this);
      if (typeof newdata === "string")
        data = newdata;
    }

    if (this.srcElement !== null)
    {
      $(this.srcElement).val(data);
    }
    else if (this.srcUrl !== null)
    {
      var ctype;
      if (this.srcType === BASE64)
      {
        ctype = 'text/base64';
      }
      else if (this.lang === 'xml')
      {
        ctype = 'application/xml';
      }
      else if (this.lang === 'json')
      {
        ctype = 'application/json';
      }
      else
      {
        ctype = 'text/plain';
      }

      var ajaxopts =
      {
        contentType: ctype,
        data:        data,
        method:      method,
        processData: false,
      };

      return $.ajax(this.srcUrl, ajaxopts);
    }
    else
    {
      return data;
    }
  }

})(jQuery, ace, CryptoJS);
