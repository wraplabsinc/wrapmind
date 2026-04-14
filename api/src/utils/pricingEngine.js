const config = require('../config');

function calculatePricing(lineItems, settings) {
  const taxRate = (settings?.tax_rate || config.estimate.defaultTaxRate) / 100;
  const shopSuppliesPct = (settings?.shop_supplies_pct || config.estimate.defaultShopSuppliesPct) / 100;
  const ccFeePct = (settings?.cc_fee_pct || config.estimate.defaultCCFeePct) / 100;
  const depositPct = (settings?.deposit_pct || config.estimate.defaultDepositPct) / 100;
  const rushMultiplier = settings?.rush_multiplier || config.estimate.defaultRushMultiplier;
  const referralDiscount = config.estimate.referralDiscount;

  let laborSubtotal = 0;
  let materialSubtotal = 0;
  let feeSubtotal = 0;
  let discountTotal = 0;

  const processedItems = lineItems.map((item) => {
    let itemTotal = 0;

    if (item.type === 'labor') {
      let laborCost = item.labor_cost || 0;
      if (item.is_rush) {
        laborCost *= rushMultiplier;
      }
      laborSubtotal += laborCost;
      itemTotal = laborCost;
      item.taxable = false;
    } else if (item.type === 'material') {
      materialSubtotal += item.material_cost || 0;
      itemTotal = item.material_cost || 0;
      item.taxable = true;
    } else if (item.type === 'fee') {
      feeSubtotal += item.amount || 0;
      itemTotal = item.amount || 0;
      item.taxable = item.fee_taxable || false;
    } else if (item.type === 'discount') {
      discountTotal += item.amount || 0;
      itemTotal = -(item.amount || 0);
      item.taxable = false;
    } else if (item.type === 'surcharge') {
      feeSubtotal += item.amount || 0;
      itemTotal = item.amount || 0;
      item.taxable = false;
    }

    item.total = itemTotal;
    return item;
  });

  const shopSuppliesAmount = laborSubtotal * shopSuppliesPct;
  const taxableParts = materialSubtotal + feeSubtotal;
  const taxAmount = taxableParts * taxRate;

  const subtotal = laborSubtotal + materialSubtotal + feeSubtotal + shopSuppliesAmount - discountTotal;
  const total = subtotal + taxAmount;
  const depositAmount = total * depositPct;
  const ccFeeAmount = total * ccFeePct;

  return {
    line_items: processedItems,
    labor_subtotal: round(laborSubtotal),
    material_subtotal: round(materialSubtotal),
    fee_subtotal: round(feeSubtotal),
    shop_supplies: round(shopSuppliesAmount),
    discount_total: round(discountTotal),
    subtotal: round(subtotal),
    tax: round(taxAmount),
    total: round(total),
    deposit_amount: round(depositAmount),
    cc_fee: round(ccFeeAmount),
  };
}

function round(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

module.exports = { calculatePricing };
