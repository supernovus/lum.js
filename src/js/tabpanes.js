(function(Nano, $)
{
  if (Nano === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Nano.needLibs('hash');

  Nano.markLib('tabpanes');

  /**
   * A GUI library to make tabbed panes.
   *
   * Requires jQuery and Nano.Hash. Supports a wide variety of tab/pane styles.
   *
   * @property {object} urlHash  A Nano.Hash instance.
   */
  Nano.TabPanes = class
  {
    /**
     * Create a TabPanes instance.
     *
     * If neither 'showClass' or 'hideClass' are used, we use the
     * jQuery's show() and hide() methods to toggle the panes.
     *
     * @param {object} opts Options to build this instance.
     * @param {object} [opts.hash] Either a Nano.Hash instance, or options to build a Nano.Hash instance. If the latter, and 'shortOpt' is not set, it will be set to true by default. The instance will be set to the 'urlHash' property.
     * @param {string} [opts.paneSelector='div.pane'] The selector to find panes.
     * @param {string} [opts.tabsSelector='.tabs a'] The selector to find tabs.
     * @param {string} [opts.activeClass='current'] The class to add to the tab currently selected.
     * @param {string} [opts.default] The default tab/pane to be open.
     *
     * If not specified, the first pane matching the paneSelector will be used
     * as the default once the register() method is called.
     *
     * @param {string} [opts.showAll] A virtual tab that if used will open _all_ panes.
     * @param {string} [opts.showClass] If we need to apply a class to show a pane, specify it here. Mutually exclusive with 'hideClass'.
     * @param {string} [opts.hideClass] If we need to apply a class to hide a pane, specify it here. Mutually exclusive with 'showClass'.

     * @param {string} [opts.hashTabName='tab'] The Hash option name that contains the current tab.
     * @param {boolean} [opts.registerOnLoad=true] Call register() on construction.
     * @param {boolean} [opts.triggerOnLoad=true] Trigger a 'hashchange' event handler on construction (only useful if 'registerOnLoad' was also true.)
     *
     * @param {function} [opts.onChange] A function to call when the 'hashchange' event is triggered, after we've shown the pane, and marked the tab as active. Will be passed the name of the tab/pane we've switched to, an element set representing all panes, and an element set representing all tabs. Will have the TabPanes instance as it's context.
     * @param {function} [opts.getPane]  Override our getPane() method with a custom function. Will be passed the requested tab/pane name, and an element set of all panes. Will have the TabPanes instance as it's context. Must return a jQuery element representing the pane.
     * @param {function} [opts.getTab]  Override our getTab() method with a custom function. Will be passed the requested tab/pane name, and an element set of all tabs. Will have the TabPanes instance as it's context. Must return a jQuery element representing the tab.
     */
    constructor (opts={})
    {
      if (typeof opts.hash === 'object')
      {
        if (opts.hash instanceof Nano.Hash)
        { // The Hash instance was passed directly.
          this.urlHash = opts.hash;
        }
        else
        { // We passed options to build a Hash instance.
          let hashOpts = opts.hash;
          if (hashOpts.shortOpt === undefined)
          {
            hashOpts.shortOpt = true;
          }
          this.urlHash = new Nano.Hash(hashOpts);
        }
      }
      else
      { // Build a Nano.Hash with 'shortOpts'.
        this.urlHash = new Nano.Hash({shortOpt: true});
      }

      this.paneSelector = 'paneSelector' in opts ? opts.paneSelector : 'div.pane';
      this.tabsSelector = 'tabsSelector' in opts ? opts.tabsSelector : '.tabs a';
      this.showAll = opts.showAll;
      this.showClass = opts.showClass;
      this.hideClass = opts.hideClass;
      this.hashTabName = 'hashTabName' in opts ? opts.hashTabName : 'tab';
      this.activeClass = 'activeClass' in opts ? opts.activeClass : 'current';
      this.onChange = opts.onChange;

      // If no 'default' is set, the register() command will overwrite this.
      this.default = opts.default;

      if (typeof opts.getPane === 'function')
      { // Overriding the getPane method.
        this.getPane = opts.getPane;
      }
      if (typeof opts.getTab === 'function')
      { // Overriding the getTab method.
        this.getTab = opts.getTab;
      }

      let registerOnLoad = 'registerOnLoad' in opts ? opts.registerOnLoad : true;
      if (registerOnLoad)
      {
        let triggerOnLoad = 'triggerOnLoad' in opts ? opts.triggerOnLoad : true;
        this.register(triggerOnLoad);
      }

    } // constructor()

    /**
     * Register a 'hashchange' event that will be used to switch tabs.
     *
     * @param {boolean} [triggerNow=false] Trigger the 'hashchange' right away?
     */
    register(triggerNow=false)
    {
      let self = this;
      $(window).on('hashchange', function (e)
      {
        let pane = self.urlHash.getOpt(self.hashTabName, {default: self.default});
        self._showPane(pane);
      });

      if (!this.default)
      { // Find a default tab. We use the id of the first pane.
        let firstPane = $(this.panesSelector).first();
        this.default = firstPane.prop('id');
      }

      if (triggerNow)
      {
        $(window).trigger('hashchange');
      }
    } // register()

    /**
     * Internal function used by the 'hashchange' event to actually change
     * the panes. You should never have to call this manually.
     *
     * @param {string} pane  The tab/pane we are switching to.
     */
    _showPane (pane)
    {
      let panes = $(this.paneSelector);
      if (this.showAll && pane === this.showAll)
      { // Show all panes.
        if (this.showClass)
        { // We have a class to show panes.
          panes.not(this.showClass).addClass(this.showClass);
        }
        else if (this.hideClass)
        { // We have a class to hide panes.
          panes.removeClass(this.hideClass);
        }
        else
        { // Using the show/hide jQuery methods.
          panes.show();
        }
      }
      else
      { // Show a specific pane.
        if (this.showClass)
        { // We have a class to show panes.
          panes.removeClass(this.showClass);
          this.getPane(pane, panes).addClass(this.showClass);
        }
        else if (this.hideClass)
        { // We have a class to hide panes.
          panes.not(this.hideClass).addClass(this.hideClass);
          this.getPane(pane, panes).removeClass(this.hideClass);
        }
        else
        { // Using the show/hide jQuery methods.
          panes.hide();
          this.getPane(pane, panes).show();
        }
      }

      let tabs = $(this.tabsSelector);
      tabs.removeClass(this.activeClass);
      let currentTab = this.getTab(pane, tabs);
      if (currentTab)
      {
        currentTab.addClass('current');
      }

      if (typeof this.onChange === 'function')
      {
        this.onChange(pane, panes, tabs);
      }
    } // showPane()

    /**
     * Change the URL hash to switch to a new tab/pane.
     *
     * @param {string} pane  The pane we are switching to.
     */
    select (pane)
    {
      let opts = {};
      opts[this.hashTabName] = pane;
      this.urlHash.update(opts);
    }

    /**
     * Default implementation of the getPane method.
     *
     * By default we expand the panes to simply be in the
     * style of ```<div id="paneid"></div>``` and this method
     * only works if they are.
     *
     * May be overridden in the constructor.
     *
     * @param {string} pane   The pane we want to get.
     * @param {jQuery} panes  All panes found on the page.
     */
    getPane (pane, panes)
    {
      return $('#'+pane);
    }

    /**
     * Default implementation of the getTab method.
     *
     * Only works if the tabs are in the ```<a href="#tab=paneid"></a>``` or
     * ```<a href="#paneid"></a>``` format.
     *
     * We look through all of the current tabs, and parse their 'href' using
     * the urlHash object, and the one which matches will be returned.
     *
     * If none match, returns null.
     */
    getTab (wantTab, tabs)
    {
      let foundTab = null;
      let self = this;

      tabs.each(function ()
      {
        let tab = $(this);
        let href = tab.attr('href');
        let pane = self.urlHash.getOpt(self.hashTabName, {hash: href});
        if (pane === wantTab)
        { // It matched.
          foundTab = tab;
          return false;
        }
      });

      return foundTab;
    }

  } // class Nano.TabPanes

})(window.Lum, window.jQuery);