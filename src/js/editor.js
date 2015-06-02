/**
 * Editor framework
 *
 * Makes web based code editors easy to use.
 * Currently using Ace as it's backend component.
 */

(function(root, $, ace, CryptoJS)
{
  "use strict";

  if (root.Nano === undefined)
  {
    console.log("fatal error: missing Nano global namespace");
    return;
  }

  Nano.Editor = function (opts)
  {
    this.lang = lang in opts ? opts.lang : 'xml';
    this.srcType = sourceEncoding ? opts.sourceEncoding : false;
    this.srcElement = sourceElement in opts ? opts.sourceElement : null;
    this.srcUrl = sourceUrl in opts ? opts.sourceUrl : null;
    this.editElement = editElement in opts ? opts.editElement : 'editor';
  }

  Nano.Editor.prototype.load = function (data)
  {
    var editor = this.editor = ace.edit(this.editElement);

    if (this.lang)
      editor.getSession().setMode("ace/mode/"+this.lang);

    var dtype = typeof data;

    if (dtype === "string")
    {
      editor.setValue(data);
    }
    else if (dtype === "function")
    {
      editor.setValue(data(this));
    }
    else if (this.srcElement !== null)
    {
      data = $(this.srcElement).val();
      if (this.srcType === 'base64')
      {
        data = CryptoJS.enc.Base64.parse(data);
      }
      editor.setValue(data);
    }
    else if (this.srcUrl !== null)
    {
      var self = this;
      $.get(this.srcUrl, function (data, textStatus,jq)
      {
        if (self.srcType === 'base64')
        {
          data = CryptoJS.enc.Base64.parse(data);
        }
        editor.setValue(data);
      }); 
    }
  }

  Nano.Editor.prototype.save = function (callback)
  {
    var data = editor.getValue();

    if (this.srcType === 'base64')
    {
      data = CryptoJS.enc.Base64.stringify(data);
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
      if (this.srcType === 'base64')
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
        method:      'PUT',
        processData: false,
      };

      return $.ajax(this.srcUrl, ajaxopts);
    }
    else
    {
      return data;
    }
  }

})(window, jQuery, ace, CryptoJS);
