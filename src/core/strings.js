//++ core/strings ++//

  /**
   * Get the locale/language string.
   * 
   * 1. If `navigator.language` exists it will be used.
   * 2. If `Intl` exists it will be used.
   * 3. If neither of those exist, uses `'en-US'` as a default.
   * 
   * @returns string - The locale/language string.
   * 
   * @method Lum._.getLocale
   */
   function getLocale()
   {
     if (isObj(root.navigator) && typeof root.navigator.language === S)
     {
       return root.navigator.language;
     }
     else if (isObj(root.Intl))
     {
       try 
       {
         const lang = root.Intl.DateTimeFormat().resolvedOptions().locale;
         return lang;
       }
       catch (err)
       {
         console.warn("Attempt to get locale from Intl failed", err);
       }
     }
 
     // A last-ditch fallback.
     return 'en-US';
   }
 
   /**
    * Make the first character of a string uppercase.
    * 
    * @param {string} string - The input string.
    * @param {boolean} [lcrest=false] Make the rest of the string lowercase? 
    * @param {string} [locale=getLocale()] The locale/language of the string.
    * 
    * @returns string - The output string.
    * 
    * @method Lum._.ucfirst
    */
   function ucfirst ([ first, ...rest ], lcrest = false, locale = getLocale())
   {
     first = first.toLocaleUpperCase(locale);
     rest  = rest.join('');
     if (lcrest)
     {
       rest = rest.toLocaleLowerCase(locale);
     }
     return first + rest;
   }
 
   /**
    * Make the first character of each *word* in a string uppercase.
    *  
    * @param {string} string - The input string. 
    * @param {boolean} [unicode=false] Use Unicode words? (Only uses ASCII words otherwise)
    * @param {boolean} [lcrest=false] Make the rest of each word lowercase? 
    * @param {string} [locale=getLocale()] The locale/language of the string. 
    * 
    * @returns {string} - The output string.
    * 
    * @method Lum._.ucwords
    */
   function ucwords(string, unicode = false, lcrest = false, locale = getLocale())
   {
     const regex = unicode ? /[0-9\p{L}]+/ug : /\w+/g;
     return string.replace(regex, word => ucfirst(word, lcrest, locale));
   }

   //-- core/strings --//
   