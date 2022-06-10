/**
 * A helper for ServiceWorker instances.
 *
 * This has two different APIs depending on if it is loaded in a webpage context
 * or inside the service worker context. 
 *
 * Use in a webpage context:
 *
 * ```
 * <script src="/scripts/nano/core.js"></script>
 * <script src="/scripts/nano/service_worker.js"></script>
 * <script>
 *   "use strict";
 *   const sw = new Lum.ServiceWorker('/service-worker.js')
 *     .onRegister((reg) => console.debug("registered", reg))
 *     .onFailure((err) => console.error("registration failed", err))
 *     .onSubscribe((sub) => console.debug("push subscription", sub))
 *     .run(); // Registers the service worker, then gets a push subscription.
 *
 *   // Do web page stuff here.
 * </script>
 * ```
 *
 * Use in a ServiceWorker context:
 *
 * ```
 *   // At the top of your service-worker.js file.
 *   const LJS = '/scripts/nano/';
 *   self.importScripts(LJS+'core.js', LJS+'service_worker.js');
 *   const sw = new Lum.ServiceWorker();
 *
 *   // Do service-worker stuff here.
 * ```
 *
 */
(function(Lum)
{
  "use strict";

  if (Lum === undefined) throw new Error("Lum core not found");

  const {O,F,S,DESC,is_obj} = Lum._;

  function urlBase64ToUint8Array(base64String) 
  {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
 
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
 
    for (var i = 0; i < rawData.length; ++i) 
    {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (Lum.context.isServiceWorker)
  { // We're running in a ServiceWorker context.

    const root = Lum.context.root;

    const CACHE_SEP = '-cache-v';

    // TODO: Add in push subscription stuff to ServiceWorker context.

    class LSW
    {
      constructor()
      {
        this.cacheSeparator = CACHE_SEP;

        Lum.prop(this, '$eventHandlers', {});
        Lum.prop(this, '$modules', {});

        Lum.prop(this, 'caches', {});

        const cprop = Lum.prop(this.caches);

        cprop('add', function(key, cmod)
        {
          this[key] = new CC(key,cmod, this);
        }, DESC.CONF);

        cprop('addAll', function(cacheDefs)
        {
          if (is_obj(cacheDefs))
          {
            for (const cname in cacheDefs)
            {
              this.add(cname, cacheDefs[cname]);
            }
          }
          else 
          {
            console.error("Invalid cache definitions", cacheDefs);
          }
        }, DESC.CONF);
      
        cprop('keys', function()
        {
          return Object.keys(this);
        }, null, DESC.CONF);
      
        cprop('values', function()
        {
          return Object.values(this);
        }, null, DESC.CONF);

        cprop('length', function()
        {
          return Object.keys(this).length;
        }, null, DESC.CONF);
      
        cprop('has', function(name)
        {
          for (let key in this)
          {
            const cache = this[key];
            if (cache.name === name)
            { // We found a match.
              return true;
            }
          }
          // No matching cache found.
          return false;
        }, DESC.CONF);
      
        cprop('installCaches', function()
        {
          const me = this;
          return Promise.allSettled(
            me.values.map(function(cc)
            {
              if (cc.installer)
              {
                return cc.open().then(function(cache)
                {
                  console.debug(`Auto-installing ${cc.key} cache URLs…`);
                  cache.addAll(cc.conf.urls);
                });
              } // if cc.installer
              else
              {
                return Promise.resolve(null);
              }
            })
          )
        }, DESC.CONF); // installCaches()
      
        cprop('match', function(event, response)
        {
          for (const cc of this.values)
          {
            if (cc.match(event))
            { // This cache matched the request, cache it.
              cc.open().then(function(cache)
              {
                cache.put(event.request, response);
              });
      
              break;
            }
          } // for this.values 
        }, DESC.CONF); // match()

      } // Lum.ServiceWorker::construct();

      setCacheSeparator(sep)
      {
        if (typeof sep === S)
        {
          this.cacheSeparator = sep;
        }
        return this;
      }

      on()
      {
        root.addEventListener(...arguments);
        return this;
      }

      off()
      {
        root.removeEventListener(...arguments);
        return this;
      }

      onInstall()
      {
        return this.on('install', ...arguments);
      }

      onActivate()
      {
        return this.on('activate', ...arguments);
      }

      onFetch()
      {
        return this.on('fetch', ...arguments);
      }

      useCaches(cacheDefs)
      {
        if (this.$cachesInitialized) return; // We only initialize once.

        if (is_obj(cacheDefs))
        {
          this.caches.addAll(cacheDefs);
        }

        if (this.caches.length > 0)
        {
          this.onInstall(CacheHandlerFactory.install(this));
          this.onActivate(CacheHandlerFactory.activate(this));
          this.onFetch(CacheHandlerFactory.fetch(this));

          // Now mark it as having been done.
          this.$cachesInitialized = true;
        }
      }

    } // Lum.ServiceWorker for ServiceWorker context.

    Lum.ServiceWorker = LSW;

    const SWNAME = 'ServiceWorker';

    const CacheHandlerFactory =
    {
      install: function (sw)
      {
        return function (event)
        { // We'll use the install event to cache the current resources.
          const EHNAME = SWNAME+':install[Caches]';
          console.debug(EHNAME, event);
          event.waitUntil(sw.caches.installCaches());
        }
      }, // install()
      activate: function (sw)
      {
        return function (event)
        { // We'll use the active event to clean up old caches.
          const EHNAME = SWNAME+':activate[Caches]';
          console.debug(EHNAME, event);
          clients.claim();
          event.waitUntil(
            caches.keys().then(function(cacheNames)
            {
              return Promise.all(
                cacheNames.map(function(cacheName)
                {
                  if (!sw.caches.has(cacheName))
                  {
                    console.debug(EHNAME, 'Deleting stale cache', cacheName);
                    return caches.delete(cacheName);
                  } // if !currentCaches.has
                }) // cacheNames.map()
              ); // Promise.all()
            }) // keys.then()
          ) // waitUntil
        }
      }, // activate()
      fetch: function (sw)
      {
        return function (event)
        { // Finally the fetch event handles getting cached content, as well as
          // adding content to a cache if the content matches.
          const EHNAME = SWNAME+':fetch[Caches]';
          event.respondWith(
            caches.match(event.request.clone()).then(function(response)
            {
              if (response)
              { // Response was cached, we're good to go.
                console.debug(EHNAME, event, response.clone());
                return response;
              }
        
              return fetch(event.request.clone()).then(function (response)
              {
                let resClone = response.clone();
        
                if (response.status < 400)
                { // Not an error response.
                  console.debug(EHNAME, event, resClone.clone());
                  sw.caches.match(event, resClone);
                }
        
                // Okay, all done, return the response.
                return response; 
        
              }).catch(function(e)
              { // An error occurred.
                console.error('Error in fetch handler', e);
              });
            })
          );
        }
      }, // fetch() 
    }

    LSW.CacheEventHandlerFactory = CacheHandlerFactory;

    function getFunc(func, factory, thisVal, args, fallback)
    {
      if (typeof func === F)
      {
        return func;
      }
      else if (typeof func === S && typeof factory[func] === F)
      {
        return factory[func].apply(thisVal, args);
      }
      else
      {
        console.error("Invalid function definition", func, factory, thisVal, args, fallback);
        return fallback;
      }
    }

    LSW.getFunc = getFunc;

    // A small wrapper class for caches.
    class CC
    {
      constructor(key, cmod, sw)
      {
        this.serviceWorker = sw;
        this.key = key;
        this.ver = cmod.ver ?? 0;
        this.name = key + sw.cacheSeparator + this.ver;
        this.installer = cmod.installer ?? false;
        this.events = {};
        this.conf = cmod;

        // Set our match() function.
        this.match = getFunc((cmod.match ?? 'default'), MatchFactory, this, [], function () { return false; });

        if (is_obj(cmod.events))
        { // Set some event functions.
          for (const ename in cmod.events)
          {
            const efunc = cmod.events[ename];
            this.events[ename] = getFunc(efunc, EventFactory, this, [ename]);
          }
        }

      } // constructor()

      open()
      {
        let promise = caches.open(this.name);
        if (typeof this.events.onOpen === F)
        { // Call the opOpen event.
          promise = promise.then(this.events.onOpen);
        }
        return promise;
      }

    }

    LSW.Cache = CC;

    const EventFactory = 
    {

      logOpen()
      {
        const cc = this;
        return function(cache)
        {
          console.debug(`Opened ${cc.key} cache version ${cc.ver}…`);
          return cache;
        }
      },

    } // EventFactory

    LSW.EventFactory = EventFactory;

    const MatchFactory =
    {

      default()
      { // If we have a list of URLs, see if the request URL is one of them.
        return function(event)
        {
          const urls = this.conf.urls;
          const req = event.request.clone();
          return (Array.isArray(urls) && urls.includes(req.url));
        }
      },

      byRegex()
      { // Match by a regular expression, optionally checking rules for submatches.
        return function(event)
        {
          const regex = this.conf.regex;
          const submatch = this.conf.submatch;
          const req = event.request.clone();
          if (typeof regex === O)
          {
            let matches = regex.exec(req.url);
            if (matches)
            {
              if (typeof submatch === F)
              { // One extra filter.
                return submatch.call(this, matches);
              }
              return true;
            }
          }
          return false;
        }
      },

    } // MatchFactory

    LSW.MatchFactory = MatchFactory;

  }
  else if (Lum.context.isWindow)
  { // We're running in a browser window context.

    Lum.ServiceWorker = class
    {
      constructor(url, noHandlers=false)
      {
        if (typeof url !== S)
        {
          throw new Error("Invalid URL parameter passed to ServiceWorker()");
        }

        this.url = url;
        this.events = {};
        this.vapidPublicKey  = null;
        this.vapidKeyUrl     = null;
        this.vapidHttpMethod = null;
        this.subscriptionUrl = null;
        this.subHttpMethod   = 'POST';

        function add(name, def)
        {
          if (typeof def === F)
          {
            this.events[name] = def;
          }

          this[name] = function (func)
          {
            if (typeof func === F)
            { // A valid event handler.
              this.events[name] = func;
            }
            else
            { // Clear the event handler
              delete(this.events[name]);
            }

            return this;
          }
        }
     
        // Event for successful registration.
        add('onRegister', (reg) => 
          console.debug('ServiceWorker registered', this, reg));
        // Event for failed registration.
        add('onFailure', (err) =>
            console.error('ServiceWorker registration failed', this, err));
        // Event for successful push subscription.
        add('onSubscribe');
      }

      setVapidKey (key)
      {
        if (typeof key === S)
        { // Convert the base64 key to a Uint8Array object.
          key = urlBase64ToUint8Array(key);
        }

        if (key instanceof Uint8Array)
        { // That's valid.
          this.vapidPublicKey = key;
        }
        else
        { // That's not.
          throw new Error("Invalid Vapid Key");
        }

        return this;
      }

      setVapidUrl (url, httpMethod)
      {
        if (typeof url !== S)
        {
          throw new Error("Invalid Vapid URL");
        }
        
        this.vapidKeyUrl = url;

        if (typeof httpMethod === S)
        {
          this.vapidHttpMethod = httpMethod;
        }

        return this;
      }

      setSubscriptionUrl (url, httpMethod)
      {
        if (typeof url !== S)
        {
          throw new Error("Invalid Subscription URL");
        }
        
        this.subscriptionUrl = url;

        if (typeof httpMethod === S)
        {
          this.subHttpMethod = httpMethod;
        }

        return this;
      }

      register()
      {
        if (!('serviceWorker' in navigator))
        { // Uh...
          if (typeof self.Promise === F)
          { // Return a rejected promise.
            return Promise.reject(new Error("No serviceWorker API found"));
          }
          else
          { // This should never happen, but...
            throw new Error("No support for Promise");
          }
        }

        const promise = navigator.serviceWorker.register(this.url);
        const ev = this.events;

        if (typeof ev.onRegister === F || typeof ev.onFailure === F)
        { // Return the chained promise.
          return promise.then(ev.onRegister, ev.onFailure);
        }
        else
        { // Return the registration promise.
          return promise;
        }

      } // register()

      get ready()
      {
        return navigator.serviceWorker.ready;
      }

      subscribe(reg)
      {
        const swork = this;
        const ev = this.events;
        let promise = reg.pushManager.getSubscription()
        .then(async function(sub)
        { // If a subscripion already exists, use it.
          if (sub)
          {
            return sub;
          }

          const subOpts = {userVisibleOnly: true};

          if (swork.vapidPublicKey instanceof Uint8Array)
          { // A key has been explicitly set.
            subOpts.applicationServerKey = swork.vapidPublicKey;
          }
          else if (typeof swork.vapidKeyUrl === S)
          { // We're going to get the key from the server.
            const fetchOpts = {};
            if (typeof swork.vapidHttpMethod === S)
            {
              fetchOpts.method = swork.vapidHttpMethod;
            }
            const keyRes = await fetch(swork.vapidKeyUrl, fetchOpts);
            const keyStr = await keyRes.text();
            const keyObj = urlBase64ToUint8Array(keyStr);
            subOpts.applicationServerKey = keyObj;
          }
          
          return reg.pushManager.subscribe(subOpts);
        });

        if (typeof this.subscriptionUrl === S)
        {
          const subUrl = this.subscriptionUrl;
          const subMeth = this.subHttpMethod;
          promise = promise.then(function(sub)
          {
            fetch(subUrl,
            {
              method: subMeth,
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({subscription: sub}),
            });

            return sub;
          });
        }

        if (typeof ev.onSubscribe === F)
        { // Get the chained promise.
          promise = promise.then(ev.onSubscribe);
        }

        // Finally, return the promise.
        return promise;

      } // subscribe()

      /**
       * A wrapper around register() and subscribe() that is meant as the
       * primary way to start the service worker process.
       */
      run()
      {
        const out = {};

        // We always call register.
        out.registration = this.register();

        // Now a bit of conditional stuff.
        if ( typeof this.events.onSubscribe === F
          || typeof this.vapidPublicKey     === O
          || typeof this.vapidKeyUrl        === S)
        { // Let's do the subscription.
          out.subscription = this.ready.then((reg) => this.subscribe(reg));
        }

        // Finally return all the promises.
        return out;
      }

    } // Lum.ServiceWorker for Browser context.

  }
  else
  { // Invalid context.
    throw new Error("Context is neither a browser window or a service worker");
  }

  // Static reference to the helper function.
  Lum.ServiceWorker.urlBase64ToUint8Array = urlBase64ToUint8Array;

})(self.Lum);