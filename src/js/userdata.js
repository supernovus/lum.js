/**
 * Get a bunch of user data.
 */
(function()
{
  /* jshint asi: true */
  "use strict";

  if (window.Nano === undefined)
  {
    window.Nano = {};
  }

  Nano.UserData = {};

  /**
   * Get the local time zone offset in seconds.
   */
  Nano.UserData.getTimezone = function ()
  {
    return (new Date().getTimezoneOffset() * 60) * -1;
  }

  /**
   * Get a bunch of user information from the browser.
   *
   * @param object opts   A bunch of options, see below.
   *
   * {
   *    geolocation:  object  Geolocation API parameters (optional.)
   *    {
   *      onSuccess:  function  The Geolocation request succeeded.
   *      onError:    function  The Geolocation request failed.
   *      options:    object    Geolocation API options (optional.)
   *      // see: https://dev.w3.org/geo/api/spec-source.html for API options.
   *    }
   *    fallbackCallback: function  If Geolocation disabled, call this instead.
   *                                (optional.)
   * }
   *
   * All of the callback functions receive the info structure as their first
   * parameter. You can use it to save the data. Only one of the callbacks will
   * be called depending on settings and Geolocation approval.
   *
   * @return object  An info object with a bunch of useful stuff included.
   *
   * {
   *   app:
   *   {
   *     codename:  "browser codename",
   *     name:      "browser app name",
   *     version:   "browser version",
   *     engine:    "browser engine",
   *     platform:  "browser platform",
   *     userAgent: "browser user agent"
   *   },
   *   hasCookies: true,
   *   lang: "en",
   *   screen:
   *   {
   *     availHeight: 920,
   *     availWidth:  1440,
   *     colorDepth:  24,
   *     height:      1080,
   *     width:       1920,
   *     pixeldepth:  24
   *   },
   *   // If the 'geolocation' parameter is passed, and is successful:
   *   geolocation:
   *   {
   *     latitude:  lat,
   *     longitude: long,
   *     altitude:  alt,
   *     heading:   head,
   *     speed:     speed,
   *     timestamp: ts,
   *     accuracy:
   *     {
   *       position: posAcc,
   *       altitude: altAcc
   *     }
   *   }
   *   // If the 'geolocation' parameter is passed, and is denied.
   *   geolocation:
   *   {
   *     error: positionErrorObject // see the API specs link above.
   *   }
   *   // NOTE: if the 'geolocation' parameter is passed, but the browser
   *   //       doesn't support the API, there will be no 'geolocation'
   *            property in the returned structure.
   * }
   *
   * You can save this data as JSON in a hidden form field on your login
   * page if you're using the Nano.php Accesslog feature. Just remember to add
   * the appropriate form field to the $request_expand_json property.
   */
  Nano.UserData.getInfo = function (opts)
  {
    var info = 
    {
      app:
      {
        codename:   navigator.appCodeName,
        name:       navigator.appName,
        version:    navigator.appVersion,
        engine:     navigator.product,
        platform:   navigator.platform,
        userAgent:  navigator.userAgent,
      },
      hasCookies:   navigator.cookieEnabled,
      lang:         navigator.language,
      screen:
      {
        availHeight: screen.availHeight,
        availWidth:  screen.availWidth,
        colorDepth:  screen.colorDepth,
        height:      screen.height,
        width:       screen.width,
        pixelDepth:  screen.pixelDepth,
      },
    };

    if (
      opts.geolocation && 
      opts.geolocation.onSuccess &&
      opts.geolocation.onError && 
      navigator.geolocation
    )
    { // The Geolocation API uses asynchronous callbacks.
      var onSuccess = function (pos)
      {
        info.geolocation =
        {
          latitude:    pos.coords.latitude,
          longitude:   pos.coords.longitude,
          altitude:    pos.coords.altitude,
          heading:     pos.coords.heading,
          speed:       pos.coords.speed,
          timestamp:   pos.timestamp,
          accuracy:    
          {
            position: pos.coords.accuracy,
            altitude: pos.coords.altitudeAccuracy,
          },
        };
        opts.geolocation.onSuccess(info, pos);
      }
      var onError = function (error)
      {
        info.geolocation =
        {
          error: error
        }
        opts.geolocation.onError(info, error);
      }
      var geoOpts = opts.geolocation.options;
      navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOpts);
    }
    else if (opts.fallbackCallback)
    { // An optional callback for when no Geolocation callbacks are used.
      opts.fallbackCallback(info);
    }
    return info;
  }

})();