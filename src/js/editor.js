/**
 * Editor framework
 *
 * Makes web based code editors easy to use.
 * Currently using Ace as it's backend component.
 */

(function($, ace, CryptoJS, Nano)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Luminaryn core");
  }

  if (ace === undefined )
  {
    throw new Error("Missing ace library");
  }

  if (CryptoJS === undefined)
  {
    throw new Error("Missing CryptoJS library");
  }

  Nano.markLib('editor');

  const BASE64 = 'base64';

  /**
   * Build an editor object.
   */ 
  Nano.Editor = class 
  {
    constructor (opts)
    {
      this.lang = 'lang' in opts ? opts.lang : 'xml';
      this.srcType = 'sourceEncoding' ? opts.sourceEncoding : false;
      this.srcElement = 'sourceElement' in opts ? opts.sourceElement : null;
      this.srcUrl = 'sourceUrl' in opts ? opts.sourceUrl : null;
      this.editElement = 'editElement' in opts ? opts.editElement : 'editor';
      this.saveMethod = 'saveMethod' in opts ? opts.saveMethod : 'PUT';
    }

    getEditor ()
    {
      if (this.editor === undefined)
      {
        this.editor = ace.edit(this.editElement);
        if (this.lang)
          this.editor.getSession().setMode("ace/mode/"+this.lang);
  
      }
      return this.editor;
    }
  
    setLang (lang)
    {
      this.getEditor().getSession().setMode("ace/mode/"+lang);
      this.lang = lang;
    }
  
    load (data)
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
  
    setData (data)
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
  
    loadUrl (url)
    {
      this.srcElement = null;
      this.srcUrl = url;
      return this.load();
    }
  
    loadTag (tag)
    {
      this.srcElement = tag;
      this.srcUrl = null;
      return this.load();
    }
  
    save (callback, method)
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

    // A static read-only property that returns the BASE64 constant.
    static get BASE64() { return BASE64; }
  }

})(window.jQuery, window.ace, window.CryptoJS, window.Luminaryn);
