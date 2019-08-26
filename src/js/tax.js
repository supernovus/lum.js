(function($)
{
  "use strict";
  if (window.Nano === undefined)
  {
    console.log("fatal error: Nano core not loaded");
    return;
  }

  /**
   * A class to calculate tax values.
   *
   * Can be used as an instance, or statically.
   */
  Nano.Tax = class
  {
    /**
     * Construct a Tax object.
     *
     * @param {number[]} taxRates A flat array of tax rates, e.g. [0.05, 0.07]
     * @param {boolean} [round=true] Round all values to two digits by default?
     *
     */
    constructor (taxRates, round=true)
    {
      this.taxRates = taxRates;
      this.round = round;
    }

    /**
     * Calculate the tax values from a sub-total.
     *
     * @param {number} subtotal   The total before taxes.
     * @param {boolean} [round]   Override the 'round' property.
     *
     * @return {number[]}  See {@link Nano.Tax.calculateTaxes} for the output.
     */
    calculateTaxes (subtotal, round)
    {
      if (round === undefined) round = this.round;
      return Nano.Tax.calculateTaxes(subtotal, this.taxRates, round);
    }

    /**
     * Given a total and a list of tax rates, figure out what the
     * subtotal, and the individual taxes on the item where.
     *
     * @param {number} total     The total after taxes.
     * @param {boolean} [round]  Override the 'round' property.
     *
     * @return {number[]}  See {@link Nano.Tax.extractTaxes} for the output.
     */
    extractTaxes (total, round)
    {
      if (round === undefined) round = this.round;
      return Nano.Tax.extractTaxes(total, this.taxRates, round);
    }

    /**
     * Return an array with tax values.
     *
     * @param {number} subtotal       The total before taxes.
     * @param {number[]} taxRates     A flat array of tax rates.
     * @param {boolean} [round=true] Round all the values to two digits?
     *
     * @return {number[]} An array of tax values.
     *
     *  The first number will be the total after taxes.
     *  The second number will be the total tax amount.
     *  The rest will be the taxes for each tax rate specified.
     *
     */
    static calculateTaxes (subtotal, taxRates, round=true)
    {
      if (round)
        subtotal = Math.round(subtotal*100)/100;
      var taxes = [];
      var taxsum = 0;
      for (var t in taxRates)
      {
        var tax = taxRates[t] * subtotal;
        if (round)
          tax = Math.round(tax*100)/100;
        taxes.push(tax);
        taxsum += tax;
      }
      if (round)
        taxsum = Math.round(taxsum*100)/100;
      taxes.unshift(taxsum);
      var total = subtotal+taxsum;
      if (round)
        total = Math.round(total*100)/100;
      taxes.unshift(total);
      return taxes;
    }
  
    /**
     * Given a total and a list of tax rates, figure out what the
     * subtotal, and the individual taxes on the item where.
     *
     * @param {number} total     The total after taxes.
     * @param {number[]}  taxRates  A flat array of tax rates.
     * @param {boolean} [round=true] Round all the values to two digits?
     *
     * @return {number[]}  An array of values.
     *
     *  The first element will be the subtotal before taxes.
     *  The second element will be the total tax amount.
     *  The rest will be the taxes for each tax rate specified.
     *
     */
    static extractTaxes (total, taxRates, round=true)
    {
      if (round)
        total = Math.round(total*100)/100;
      var taxes = [];
      var tax = 0;
      var t;
      for (t in taxRates)
      {
        tax += taxRates[t];
      }
      tax += 1;
      var subtotal = total/tax;
      if (round)
        subtotal = Math.round(subtotal*100)/100;
      taxes.push(subtotal);
      var taxsum = total-subtotal;
      if (round)
        taxsum = Math.round(taxsum*100)/100;
      taxes.push(taxsum);
      for (t in taxRates)
      {
        tax = taxRates[t] * subtotal;
        if (round)
          tax = Math.round(tax*100)/100;
        taxes.push(tax);
      }
      return taxes;
    }

  } // class Nano.Tax

})();
