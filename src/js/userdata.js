/**
 * Get a bunch of user data.
 */
Lum.lib(
{
  name: 'userdata',
  ns: 'UserData',
},
function(Lum, ns)
{
  /* jshint asi: true */
  "use strict";

  /**
   * Userdata related functions.
   * @namespace Lum.UserData
   */

  /**
   * Get the local time zone offset in seconds.
   * @method Lum.UserData.getTimezone
   */
  ns._add('getTimezone', function ()
  {
    return (new Date().getTimezoneOffset() * 60) * -1;
  });

  /**
   * Get a bunch of user information from the browser.
   *
   * All of the callback functions receive the info structure as their first
   * parameter. You can use it to save the data. Only one of the callbacks will
   * be called depending on settings and Geolocation approval.
   *
   * @param {object} opts  Options for what to get from the browser.
   * @param {object} [opts.geolocation] Geolocation options.
   * @param {function} opts.geolocation.onSuccess Callback if request succeeded.
   * @param {function} opts.geolocation.onError Callback if request failed.
   * @param {object} opts.geolocation.options Options to pass to Geolocation API.
   * See {@link https://dev.w3.org/geo/api/spec-source.html} for API options.
   * @param {function} [opts.fallbackCallback] If Geolocation is disabled, call this instead.
   *
   * @returns {object}  An info object with a bunch of useful stuff included.
   *
   * ```
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
   * ```
   *
   * You can save this data as JSON in a hidden form field on your login
   * page if you're using the Lum.php Accesslog feature. Just remember to add
   * the appropriate form field to the $request_expand_json property.
   * 
   * @method Lum.UserData.getInfo
   */
  ns._add('getInfo', function (opts)
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
  });

});