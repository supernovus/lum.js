/**
* A Model API base core. Use this as the foundation for your API objects.
*
* In order to use this with the modular trigger mechanism in the webApp
* function, ensure you trigger the "ready" event on the API.
*/

import $ from 'ext/jquery';
import WebService from 'nano/webservice';
import addProperty from 'nano/coreutils';
import format_json from 'nano/format_json';
import 'nano/exists.jq';
import 'nano/json.jq';

export default class ModelBase
{
  constructor(conf)
  {
    /**
     * An observable reference to ourself.
     */
    var self = riot.observable(this);

    /**
     * The model property stores our model data and backend services.
     */
    self.model = {};

    /**
     * The conf property stores a copy of our initialization data.
     */
    self.conf = conf;

    /**
     * Debugging information. Can be a list of tags.
     */
    self.debugging = 'debug' in conf ? conf.debug : {};

    /**
     * See if we have debugging in the hash.
     */
    if (location.hash === '#debug')
    { // Enable all debugging.
      self.debugging['*'] = true;
    }

    /**
     * TODO: query string debugging, more flexible than #hash style.
     */
  
    /**
     * Stuff to do before loading our sources.
     */
    self.pre_init(conf);
   
    /**
     * Load our sources, and other such features.
     */
    self.init(conf);

    /**
     * Stuff to do after loading our sources.
     */
    self.post_init(conf);
  } // constructor()

  // predefined init groups.

  /**
   * Perform some initialization before loading our sources.
   * Override this in your sub-classes to do something useful.
   */
  pre_init(conf) {}

  /**
   * Load our sources.
   * If you override this, make sure to call super().
   */
  init(conf)
  {
    if (conf.sources === undefined || conf.sources === null)
    {
      return;
    }
   
    for (var name in conf.sources)
    {
      var source = conf.sources[name];
      this._loadModel(name, source);
    } // for (sources)
  }

  /**
   * Perform some initialization after loading our sources.
   * Override this in your sub-classes to do something useful.
   */
  post_init(conf) {}

  /**
   * Check to see if debugging is enabled on a certain tag.
   */
  isDebug(tag)
  {
    if (tag !== undefined && tag !== null && 
        tag in this.debugging && this.debugging[tag])
    { // Check for the explicit tag.
      return true;
    }
    else if ('*' in this.debugging && this.debugging['*'])
    { // Check for the wildcard tag.
      return true;
    }
    return false;
  }

  /**
   * Check debugging tag, and if true, send the rest of the arguments
   * to the console log.
   */
  onDebug(tag)
  {
    if (this.isDebug(tag))
    {
      var args = Array.prototype.slice.call(arguments, 1);
      console.log.apply(console, args);
    }
  }

  /**
   * Toggle debugging on tags.
   */
  debug(tag, toggle)
  {
    if ($.isArray(tag))
    { // An array of tags, recurse it.
      for (var t in tag)
      {
        this.debug(tag[t], toggle);
      }
    }
    else
    {
      if (toggle === undefined || toggle === null)
      { // Invert the current setting.
        toggle = this.debugging[tag] ? false : true;
      }
   
      // Update the debugging setting.
      this.debugging[tag] = toggle;
   
      // Check for web services that we can toggle debugging on.
      var models  = this.model;
      var sources = this.conf.sources;
      if (tag == '*')
      { // Wildcard. We will change all web services.
        for (var modelname in models)
        {
          if (modelname in sources && sources[modelname].type == 'ws')
          {
            models[modelname]._debug = toggle;
          }
        }
      }
      else
      { // Check for specific web service.
        if (tag in models && tag in sources && sources[tag].type == 'ws')
          models[tag]._debug = toggle;
      }
    }
  }

  /** 
   * Add a model source definition, then load the model.
   */
  addSource(name, source)
  {
    this.conf.sources[name] = source;
    this._loadModel(name, source);
  }

  /**
   * Load the actual model object.
   *
   * This is not usually called directly, but invoked either by the
   * constructor, or the addSource() method.
   *
   * This is now a stub function, that extracts the source type, and
   * looks for a _load_{type}_model() function, and calls it.
   */
  _loadModel(name, source)
  {
    var type = source.type;

    var loader = '_load_'+type+'_model';

    this.onDebug('loadModel', ' -- Calling', loader);

    if (typeof this[loader] === 'function')
    {
      this[loader](name, source);
    }

  }

  /**
   * Load a Web Service model.
   */
  _load_ws_model = function (name, source)
  {
    var opts = source.opts;
    this.onDebug('loadModel', '-- Loading web service', name, opts);
    var wsclass = 'class' in opts ? opts.class : WebService;
    if (name in this.debugging)
    {
      opts.debug = this.debugging[name];
    }
    this.model[name] = new wsclass(opts);
  }

  /**
   * Load a JSON data structure from a hidden element.
   *
   * We will add some magical methods to the object, including a save()
   * function that will save any changes back to the hidden element.
   */
  _load_json_model = function (name, source)
  {
    var elname;
    if ('element' in source)
      elname = source.element;
    else
      elname = '#' + name;
   
    var element = $(elname);
    if (element.exists())
    {
      this.onDebug('loadModel', '-- Loading JSON', name, elname);
      var jsondata = element.JSON();
      var save_changes = false;
      if (source.enforceObject === true)
      {
        if ($.isArray(jsondata) || jsondata.length == 0)
        {
          jsondata = {};
          save_changes = true;
        }
      }
   
     // Add a special "save" function.
      addProperty(jsondata, 'save', function (target)
      {
        if (!target)
          target = elname;
        $(target).JSON(this);
      });

      // Add a special "json" function. This requires the
      // format_json library to have been loaded.
      addProperty(jsondata, 'json', function (format)
      {
        var json = JSON.stringify(this);
        if (format)
          return format_json(json);
        else
         return json;
      });
   
      // We changed something, time to save.
      if (save_changes)
        jsondata.save();
   
      // Assign it to our model structure.
      this.model[name] = jsondata;
    } // if element exists
  }

} // class ModelBase

