(function($)
{
  "use strict";

  if (window.Lum === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Lum.needLibs('observable');
  Lum.markLib('elementeditor');

  const T_STR    = 0;
  const T_INT    = 1;
  const T_FLOAT  = 2;
  const T_BOOL   = 3;
  const T_PASS   = 4;

  const T_MIN_VAL = T_STR;
  const T_MAX_VAL = T_PASS;

  const E_SAVE = "save";
  const E_CANCEL = "cancel";
  const E_CLOSE = "close";
  const E_OPEN = "open";

  /**
   * A super simple class for making certain element fields editable.
   */
  Lum.ElementEditor = class
  {
    static get STR() { return T_STR; }
    static get INT() { return T_INT; }
    static get FLOAT() { return T_FLOAT; }
    static get BOOL() { return T_BOOL; }
    static get SAVE() { return E_SAVE; }
    static get CANCEL() { return E_CANCEL; }
    static get CLOSE() { return E_CLOSE; }
    static get OPEN() { return E_OPEN; }

    constructor (element, type, options={})
    {
      if (typeof element === 'string')
      { // A selector.
        element = $(element);
      }
      else if (element instanceof Element)
      { // A raw DOM element, convert it to a jQuery object.
        element = $(element);
      }
      else if (!(element instanceof $))
      { // Anything else, sorry, we can't do it.
        throw new Error("Editor element needs to be a selector, DOM Element, or jQuery result object.");
      }

      if (type === undefined)
      { // If we didn't specify a type, assume it's a string.
        type = T_STR;
      }
      else 
      { // Ensure a valid value was passed.
        if (typeof type !== 'number' || !Number.isInteger(type))
        { // Something invalid was passed.
          throw new Error("Editor type must be an integer");
        }
        if (type < T_MIN_VAL || type > T_MAX_VAL)
        { // Not in a valid range, whoops.
          throw new Error("Editor type is not a valid value");
        }
      }

      this.uiElement = element;  // Element from the UI we're editing.
      this.type      = type;     // Type of value we're editing.

      Lum.observable(this);

      if (options.onSave)
      {
        this.on(E_SAVE, options.onSave);
      }
      if (options.onCancel)
      {
        this.on(E_CANCEL, options.onCancel);
      }
      if (options.onClose)
      {
        this.on(E_CLOSE, options.onClose);
      }
      if (options.onOpen)
      {
        this.on(E_OPEN, options.onOpen);
      }

      if (options.validValues)
      {
        this.setValidValues(options.validValues);
      }

      this.closeOnBlur = ('closeOnBlur' in options) 
        ? options.closeOnBlur : true;

      this.useEditKeys  = ('useEditKeys' in options)  
        ? options.useEditKeys  : false;
    }

    _getTypedValue(string)
    {
      if (typeof string !== 'string')
      {
        throw new Error("Invalid string value found");
      }
      string = string.trim();
      switch (this.type)
      {
        case T_INT:
          return parseInt(string);
        case T_FLOAT:
          return parseFloat(string);
        case T_BOOL:
          return (string === 'true');
        default:
          return string;
      }
    }

    _setEditElement(element, options={})
    {
      if (element instanceof $)
      {
        let self = this;
        this.editElement = element;

        let cob = ('closeOnBlur' in options) 
          ? options.closeOnBlur : this.closeOnBlur;
        
        let uek = ('useEditKeys' in options)
          ? options.useEditKeys : this.useEditKeys;

        if (cob)
        { // Close the editor on blur event.
          element.on('blur', function (e)
          { 
            self.close(); // Detect if changes were made.
          });
        }

        if (uek)
        { // Close the editor when certain keys are pressed.
          element.on('keydown', function (e)
          {
            switch (e.key)
            {
              case "Enter":
                e.preventDefault();
                self.close(true);      // Save changes if Enter pressed.
                break;
              case "Esc":
              case "Escape":
                e.preventDefault();
                self.close(false);     // Cancel changes if Escape pressed.
                break;
            }
          });
        }

      }
      else
      {
        throw new Error("Non jQuery object sent to _setEditElement");
      }
    }

    setValidValues(validValues)
    {
      if (typeof validValues === 'object' && validValues !== null)
      {
        this.validValues = validValues;
      }
      else
      {
        throw new Error("Invalid 'validValues' passed to Editor");
      }
    }

    /**
     * Open the editor.
     */
    open(options={})
    {
      let curVal = this.currentVal = 
        this._getTypedValue(this.uiElement.text());

      let validValues = options.values ? options.values : this.validValues;

      let editBox;
      if (typeof validValues === 'object' && validValues !== null)
      { // Let's build a select box.
        editBox = $('<select></select>');
        if ($.isArray(validValues))
        { // A flat array the value and label are the same.
          for (let v = 0; v < validValues.length; v++)
          {
            let val = validValues[v];
            let option = '<option value="'+val+'"';
            if (curVal == val)
            {
              option += ' selected="selected"';
            }
            option += '>'+val+'</option>';
            editBox.append(option);
          }
        }
        else
        { // A hash map in {"value": "label"} format.
          for (let key in validValues)
          {
            let val = this._getTypedValue(key);
            let label = validValues[val];
            let option = '<option value="'+val+'"';
            if (curVal == val)
            {
              option += ' selected="selected"';
            }
            option += '>'+label+'</option>';
            editBox.append(option);
          }
        }
      }
      else if (this.type === T_BOOL)
      { // A special case select box.
        editBox = $('<select><option value="false">false</option><option value="true">true</option></selec>');
        if (curVal)
        {
          editBox.find('option[value="true"]').prop('selected', true);
        }
        else
        {
          editBox.find('option[value="false"]').prop('selected', true);
        }
      }
      else
      { // Use an input box, with a few extra settings based on type.
        editBox = $('<input value="'+curVal+'">');
        if (this.type === T_INT || this.type === T_FLOAT)
        { // Some common properties for both int and float types.
          editBox.prop("type", "number");
          if (typeof options.min === 'number')
          {
            editBox.prop("min", options.min);
          }
          if (typeof options.max === 'number')
          {
            editBox.prop("max", options.max);
          }
          if (typeof options.step === 'number')
          {
            editBox.prop("step", options.step);
          }
          else
          { // Set some default step values.
            if (this.type === T_INT)
            {
              editBox.prop("step", 1);
            }
            else
            {
              editBox.prop("step", 0.1);
            }
          }
        }
        else if (this.type === T_PASS)
        { // A password box.
          editBox.prop("type", "password");
        }
        else
        { // A common old text box.
          editBox.prop("type", "text");
        }
      }

      this.trigger(E_OPEN, editBox);
      this._setEditElement(editBox, options);
      this.uiElement.empty().append(editBox);

    } // open()

    close(save)
    {
      let newVal = this._getTypedValue(this.editElement.val());
      let curVal = this.currentVal;
      let setVal;

      if (typeof save !== 'boolean')
      { // Determine save automatically.
        save = (newVal != curVal);
      }

      if (save)
      {
        this.trigger(E_SAVE, newVal, curVal);
        setVal = newVal;
      }
      else
      {
        this.trigger(E_CANCEL, curVal, newVal);
        setVal = curVal;
      }

      this.trigger(E_CLOSE, setVal, save, curVal, newVal);

      this.uiElement.empty().text(setVal);
    } // close()

  } // class Lum.ElementEditor

})(jQuery);