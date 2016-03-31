(function($)
{
  "use strict";
  if (window.Nano === undefined)
  {
    console.log("fatal error: Nano core not loaded");
    return;
  }

  Nano.tax = {};

  /**
   * Return an array with tax values.
   *
   * @param number subtotal   The total before taxes.
   * @param array  taxrates   A flat array of tax rates, e.g. [0.05, 0.07]
   *
   * @return array  An array of tax values.
   *                The first element will be the total after taxes.
   *                The second element will be the total tax amount.
   *                The rest will be the taxes for each tax rate specified.
   *
   */
  Nano.tax.calculateTaxes = function (subtotal, taxrates, round)
  {
    if (round)
      subtotal = Math.round(subtotal*100)/100;
    var taxes = [];
    var taxsum = 0;
    for (var t in taxrates)
    {
      var tax = taxrates[t] * subtotal;
      if (round)
        tax = Math.round(tax*100)/100;
      taxes.push(tax);
      taxsum += tax;
    }
    if (round)
      taxsum = Math.round(taxsum*100)/100;
    taxes.unshift(taxsum);
    taxes.unshift(subtotal+taxsum);
    return taxes;
  }

  /**
   * Given a total and a list of tax rates, figure out what the
   * subtotal, and the individual taxes on the item where.
   *
   * @param number total     The total after taxes.
   * @param array  taxrates  A flat array of tax rates.
   *
   * @return array  An array of values.
   *                The first element will be the subtotal before taxes.
   *                The second element will be the total tax amount.
   *                The rest will be the taxes for each tax rate specified.
   */
  Nano.tax.extractTaxes = function (total, taxrates, round)
  {
    if (round)
      total = Math.round(total*100)/100;
    var taxes = [];
    var tax = 0;
    var t;
    for (t in taxrates)
    {
      tax += taxrates[t];
    }
    tax += 1;
    var subtotal = total/tax;
    if (round)
      subtotal = Math.round(subtotal*100)/100;
    taxes.push(subtotal);
    taxes.push(total-subtotal);
    for (t in taxrates)
    {
      tax = taxrates[t] * subtotal;
      if (round)
        tax = Math.round(tax*100)/100;
      taxes.push(tax);
    }
    return taxes;
  }

})();
