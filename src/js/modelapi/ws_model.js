/**
 * Add some boiler plate code for working with a web service that handles the
 * model data (listing, get, save, etc.)
 *
 * DEPRECATION NOTICE: 
 *
 * While I'm not removing this library, I'm deprecating it, and not
 * using it anymore, and have plans to replace it eventually with
 * something better that has separate classes and is easier to manage.
 *
 * With the advent of proper classes, native promises, and better overall
 * native APIs, a lot of what this extension did is no longer necessary.
 */
Lum.lib(
{
  name: ['modelapi/ws_model', 'modelapi.ws_model'],
  deps: ['modelapi', 'promise'],
},
function(Lum)
{
  "use strict";

  let map = Lum.ModelAPI.prototype;

  /**
   * Set up the defaults for the web service model.
   */
  map.post_init.webserviceModel = function (conf)
  {
    this.model.doc_cache = {};
    if (this.__ws === undefined)
      this.__ws = {};
    if (this.__ws.model === undefined)
      this.__ws.model = 'ws';
    if (this.__ws.deferred === undefined)
      this.__ws.deferred = true;
    if (this.__ws.list === undefined)
      this.__ws.list = 'list';
    if (this.__ws.get === undefined)
      this.__ws.get = 'get';
    if (this.__ws.update === undefined)
      this.__ws.update = 'update';
    if (this.__ws.create === undefined)
      this.__ws.create = 'create';
    if (this.__ws.delete === undefined)
      this.__ws.delete = 'delete';
    if (this.__ws.patch === undefined)
      this.__ws.patch = true;
    if (this.__ws.watch === undefined)
      this.__ws.watch = true;
  }

  /**
   * Get our web service, optionally check that it can handle a specific method.
   */
  map.get_ws = function (can)
  {
    if (this.__ws.model !== undefined && this.model !== undefined && this.model[this.__ws.model] !== undefined)
    {
      var ws = this.model[this.__ws.model];
      if (can === undefined)
      {
        return ws;
      }
      else
      {
        if (ws[can] !== undefined)
        {
          return ws;
        }
      }
    }
  }

  /**
   * Return an error response as a promise.
   */
  map.no_ws = function (name)
  {
    var promise = new Lum.Promise(this.__ws.deferred);
    promise.deferDone({success: false, error: "no web service can handle method: "+name});
    return promise;
  }

  /**
   * Get a list of documents.
   *
   * @param bool  reload    Reload from the server (default false)
   * @param mixed listopts  Options to pass to list web service call.
   *
   * @return Promise  Use promise.done() to get the list.
   *                  The promise is either a jqXHR, or a Lum.Promise
   (                  if the list was cached, and reload was false.
   */
  map.list = function (reload, listopts)
  {
    var self = this;
    if (reload || this.model.cached_list === undefined)
    {
      var meth = this.__ws.list;
      var ws = this.get_ws(meth);
      if (ws === undefined)
        return this.no_ws(meth);
      var ret = ws[meth](listopts);
      ret.done(function(list)
      {
        if (list.error === undefined)
        {
          self.trigger('onList', list);
          self.model.cached_list = list;
          if (reload)
            self.trigger('listReload', list);
        }
      });
      return ret;
    }
    else
    {
      var promise = new Lum.Promise(self.__ws.deferred);
      promise.deferDone(self.model.cached_list);
      return promise;
    }
  }

  /**
   * When using get() if we are getting from server, pass the promise here.
   */
  map._get_doc = function (ret, id, reload)
  {
    var self = this;
    ret.done(function(doc)
    {
      if (doc.error === undefined)
      {
        if (typeof self.deserialize === 'function')
        {
          doc = self.deserialize(doc);
        }
        self.extendObject(doc, id);
        self.trigger('onLoad', doc, id);
        self.model.doc_cache[id] = doc;
        if (reload)
          self.trigger('getReload', doc, id);
      }
    });
  }

  /**
   * Get a document.
   *
   * @param string  id         The document id.
   * @param bool    reload     Reload from the server (default false)
   * @param bool    noTriggers Don't run triggers (default false)
   *
   * @return Promise  Use promise.done() to get the document.
   *                  The promise is either a jqXHR, or a Lum.Promise
   *                  if the list was cached, and reload was false.
   */
  map.get = function (id, reload, noTriggers)
  {
    var self = this;
    if (reload || this.model.doc_cache[id] === undefined)
    {
      var meth = this.__ws.get;
      var ws = this.get_ws(meth);
      if (ws === undefined)
        return this.no_ws(meth);
      var ret = ws[meth]({id: id});
      if (!noTriggers)
        this._get_doc(ret, id, reload);
      return ret;
    }
    else
    {
      var promise = new Lum.Promise(self.__ws.deferred);
      promise.deferDone(self.model.doc_cache[id]);
      if (!noTriggers)
        self.trigger('onLoad', self.model.doc_cache[id], id);
      return promise;
    }
  }

  // Internal method used by extendObject()
  function add_watch_list (doc, name, subdoc)
  {
    var get_list;
    if (subdoc)
    {
      get_list = function (name)
      {
        var subdoc = {};
        for (var p in this[name].props)
        {
          var prop  = this[name].props[p];
          var value = this[prop];
          subdoc[prop] = value;
        }
        return subdoc;
      }
    }
    else
    {
      get_list = function (name)
      {
        return this[name].props;
      }
    }

    Lum.addProperty(doc, name, function (props)
    {
//      console.log(name, this);
      if (props === undefined)
      {
        return get_list.call(this, name);
      }
      else if (typeof props === 'string')
      {
        if (this[name].props.indexOf(props) === -1)
        {
          this[name].props.push(props);
        }
      }
      else if (Array.isArray(props))
      {
        for (var p in props)
        {
          this[name](props[p]);
        }
      }
      else
      {
        console.error("unknown props sent to doc."+name+"()");
      }
    });
    doc[name].props = [];
  }

  /**
   * Extend a document retrieved from get(). This is called automatically.
   *
   * Methods added to the document:
   *
   *  .changed(string)   Mark a property as having been changed.
   *  .changed(array)    Mark a bunch of properties as having been changed.
   *  .changed()         Get a document with just changed properties.
   *  .removed(string)   Mark a property as having been removed.
   *  .removed(array)    Mark a bunch of properties as having been removed.
   *  .removed()         Get a list of properties which have been removed.
   *  .set(string, any)  Set a property to a value, marking it as changed.
   *  .set(object)       Set a bunch of properties, marking them as changed.
   *  .unset(string)     Unset a property, and mark it as removed.
   *  .unset(array)      Unset a bunch of properties, marking them as removed.
   *  .save()            Save any changes using the API.save() method.
   *
   */
  map.extendObject = function (doc)
  {
    if (doc === undefined)
      doc = {};
    var self = this;

    Lum.observable(doc, this._extend_observable);
    
    if (self.__ws.watch)
    {
      add_watch_list(doc, 'changed', true);
      add_watch_list(doc, 'removed', false);
    }

    Lum.addProperty(doc, 'set', function (prop, value)
    {
      if (typeof prop === 'string' && value !== undefined)
      {
        var meth = 'set_'+prop;
        if (typeof this[meth] === 'function')
        {
          this[meth](value);
        }
        else
        {
          this[prop] = value;
        }
        if (self.__ws.watch)
          this.changed(prop);
      }
      else if (typeof prop === 'object' && value === undefined)
      {
        for (var name in prop)
        {
          var value = prop[name];
          this.set(name, value);
        }
      }
      else
      {
        console.error("Unknown parameters sent to doc.set()", prop, value);
      }
    });

    Lum.addProperty(doc, 'unset', function (props)
    {
      if (typeof props === 'string')
      {
        var meth = 'unset_'+prop;
        if (typeof this[meth] === 'function')
        {
          this[meth]();
        }
        else
        {
          delete this[props];
        }
        if (self.__ws.watch)
          this.removed(props);
      }
      else if (Array.isArray(props))
      {
        for (var p in props)
        {
          var prop = props[p];
          this.unset(prop);
        }
      }
      else
      {
        console.error("Uknown parameters sent to doc.unset()", props);
      }
    });

    Lum.addProperty(doc, 'save', function ()
    {
      return self.save(this);
    });

    self.trigger('extendObject', doc);

    return doc;
  }
 
  /**
   * Delete a document. Returns a jqXHR object.
   * Also will trigger a 'refresh' event if successful.
   */
  map.delete = function (id)
  {
    var meth = this.__ws.delete;
    var ws = this.get_ws(meth); 
    if (ws === undefined)
      return this.no_ws(meth);
    var self = this;
    var ret = ws[meth]({id: id});
    ret.done(function(data)
    {
      if (data.success)
      {
        self.trigger("onDelete", id, data);
        self.list(true).done(function(list)
        {
          self.trigger('refresh', list);
        });
        // Clear out the cached copy, we don't need it any more.
        if (id in self.model.doc_cache)
        {
          delete self.model.doc_cache[id];
        }
      }
      else
      {
        console.error("delete client failed", data);
      }
    });
    return ret;
  }

  /**
   * Save a document. Returs a jqXHR object.
   * Also will trigger a 'refresh' event if successful.
   */
  map.save = function (doc)
  {
    var self = this;
    var ret, ws, meth;
    this.trigger("preSave", doc);
    if (doc.id !== undefined)
    { // We're making changes to an existing document.
      var savedoc;
      if (this.__ws.watch)
      { // Find changes.
        var changed = doc.changed();
        var removed = doc.removed();
        var ccount = Object.keys(changed).length;
        var rcount = removed.length;
        if (ccount === 0 && rcount === 0)
        {
          var promise = new Lum.Promise(true);
          promise.deferDone({success:false, debugMsg:"no changes"});
          return promise;
        }
        if (this.__ws.patch)
        { // Use our custom patch format to save changes.
          savedoc =
          {
            id: doc.id,
          };
          if (ccount > 0)
          {
            savedoc.$set = changed;
          }
          if (rcount > 0)
          {
            savedoc.$unset = removed;
          }
  //      console.log("patch", savedoc);
        }
      }

      if (savedoc === undefined)
      { // We're not using the patch format.
        if (typeof doc.serialize === 'function')
          savedoc = doc.serialize(); // serialized format.
        else
          savedoc = doc;             // use the raw document.
      }

      meth = this.__ws.update;
      this.trigger("preSaveChanges", savedoc, doc);
      ws = this.get_ws(meth);
      if (ws === undefined)
        return this.no_ws(meth);
      ret = ws[meth](savedoc);
      this.trigger("postSaveChanges", ret, savedoc, doc);
    }
    else
    { // We're saving a new document.
      // The doc should be the complete document, and removed is ignored.
      meth = this.__ws.create;
      var savedoc = (typeof doc.serialize === 'function')
                  ? doc.serialize()
                  : doc;
      this.trigger("preSaveNew", savedoc, doc);
      ws = this.get_ws(meth);
      if (ws === undefined)
        return this.no_ws(meth);
      ret = ws[meth](savedoc);
      this.trigger("postSaveNew", ret, savedoc, doc);
    }
    ret.done(function(data)
    {
      if (data.success)
      {
        self.trigger("postSave", doc, data, ret);
        self.list(true).done(function(list)
        {
          self.trigger('refresh', list);
        });
        // Make sure the doc is reloaded from the server next time.
        if (doc.id in self.model.doc_cache)
        {
          delete self.model.doc_cache[doc.id];
        }
      }
      else
      {
        console.error("save failed", data);
      }
    });
    return ret;
  }

});
