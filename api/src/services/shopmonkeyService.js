const axios = require('axios');
const config = require('../config');

function getShopmonkeyHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Shopmonkey-Version': '2024-01-01',
  };
}

async function shopmonkeyRequest(method, path, token, body) {
  const url = `${config.shopmonkey.baseUrl}${path}`;
  const response = await axios({
    method,
    url,
    headers: getShopmonkeyHeaders(token),
    data: body,
  });
  return response.data;
}

async function validateToken(token) {
  try {
    const data = await shopmonkeyRequest('GET', '/v3/user/me', token);
    return { valid: true, shop: data };
  } catch (err) {
    return { valid: false, error: err.response?.data?.message || err.message };
  }
}

async function getLaborRates(token) {
  return shopmonkeyRequest('GET', '/v3/labor_rate', token);
}

async function getWorkflowStatuses(token) {
  return shopmonkeyRequest('GET', '/v3/workflow_status', token);
}

async function getUsers(token) {
  return shopmonkeyRequest('GET', '/v3/user', token);
}

async function getShopInfo(token) {
  return shopmonkeyRequest('GET', '/v3/shop', token);
}

async function searchCustomer(token, searchQuery) {
  return shopmonkeyRequest('GET', `/v3/customer?search=${encodeURIComponent(searchQuery)}`, token);
}

async function createCustomer(token, customerData) {
  return shopmonkeyRequest('POST', '/v3/customer', token, customerData);
}

async function createOrder(token, orderData) {
  return shopmonkeyRequest('POST', '/v3/order', token, orderData);
}

async function addOrderLineItem(token, orderId, lineItemData) {
  return shopmonkeyRequest('POST', `/v3/order/${orderId}/line`, token, lineItemData);
}

async function updateOrder(token, orderId, updateData) {
  return shopmonkeyRequest('PATCH', `/v3/order/${orderId}`, token, updateData);
}

async function getOrder(token, orderId) {
  return shopmonkeyRequest('GET', `/v3/order/${orderId}`, token);
}

async function deleteOrder(token, orderId) {
  return shopmonkeyRequest('DELETE', `/v3/order/${orderId}`, token);
}

async function pushEstimateToShopmonkey(token, estimate, settings) {
  const results = { steps: [], success: false, orderUrl: null, orderId: null };

  try {
    // Step 1: Customer Lookup
    const searchQuery = estimate.client?.phone || estimate.client?.email;
    let customerId;

    if (searchQuery) {
      try {
        const customers = await searchCustomer(token, searchQuery);
        if (customers && customers.length > 0) {
          customerId = customers[0].id;
          results.steps.push({ step: 1, action: 'customer_lookup', status: 'found_existing', customerId });
        }
      } catch (err) {
        results.steps.push({ step: 1, action: 'customer_lookup', status: 'search_failed', error: err.message });
      }
    }

    if (!customerId && estimate.client) {
      const newCustomer = await createCustomer(token, {
        first_name: estimate.client.first_name,
        last_name: estimate.client.last_name,
        phone: estimate.client.phone,
        email: estimate.client.email,
      });
      customerId = newCustomer.id;
      results.steps.push({ step: 1, action: 'customer_lookup', status: 'created_new', customerId });
    } else {
      results.steps.push({ step: 1, action: 'customer_lookup', status: 'no_client_data' });
    }

    // Step 2: Create Order
    const orderData = {
      customerId,
      vehicle: estimate.vehicle_json,
      status: settings?.shopmonkey_default_status || 'New Estimate',
      notes: `WrapIQ Estimate: ${estimate.estimate_id}\n${estimate.details_json?.notes || ''}`,
    };

    const order = await createOrder(token, orderData);
    const orderId = order.id;
    results.orderId = orderId;
    results.steps.push({ step: 2, action: 'create_order', status: 'success', orderId });

    // Step 3: Add Line Items
    const lineItems = estimate.line_items_json || [];
    for (const item of lineItems) {
      const lineItemData = {
        description: item.description || item.service,
        type: item.type === 'labor' ? 'labor' : 'part',
        quantity: item.type === 'labor' ? item.labor_hours : 1,
        unitPrice: item.type === 'labor' ? item.labor_rate || item.labor_cost / item.labor_hours : item.material_cost,
      };
      await addOrderLineItem(token, orderId, lineItemData);
    }
    results.steps.push({ step: 3, action: 'add_line_items', status: 'success', count: lineItems.length });

    // Step 4: Apply Discount (if referral)
    if (estimate.details_json?.referral_discount) {
      await updateOrder(token, orderId, {
        discount: estimate.details_json.referral_discount,
      });
      results.steps.push({ step: 4, action: 'apply_discount', status: 'success' });
    } else {
      results.steps.push({ step: 4, action: 'apply_discount', status: 'skipped' });
    }

    // Step 5: Return Order URL
    results.orderUrl = `${config.shopmonkey.baseUrl}/orders/${orderId}`;
    results.success = true;
    results.steps.push({ step: 5, action: 'complete', status: 'success', orderUrl: results.orderUrl });

    return results;
  } catch (err) {
    results.success = false;
    results.error = err.message;

    // Rollback: delete order if created
    if (results.orderId) {
      try {
        await deleteOrder(token, results.orderId);
        results.steps.push({ step: 'rollback', action: 'delete_order', status: 'success' });
      } catch (rollbackErr) {
        results.steps.push({ step: 'rollback', action: 'delete_order', status: 'failed', error: rollbackErr.message });
      }
    }

    return results;
  }
}

module.exports = {
  validateToken,
  getLaborRates,
  getWorkflowStatuses,
  getUsers,
  getShopInfo,
  searchCustomer,
  createCustomer,
  createOrder,
  addOrderLineItem,
  updateOrder,
  getOrder,
  deleteOrder,
  pushEstimateToShopmonkey,
};
