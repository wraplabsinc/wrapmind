const twilio = require('twilio');
const config = require('../config');

let twilioClient;
if (config.twilio.accountSid && config.twilio.authToken) {
  twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
}

async function sendSMS(to, message) {
  if (!twilioClient) {
    console.warn('[SMS] Twilio not configured, skipping:', message);
    return null;
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: config.twilio.fromNumber,
      to,
    });
    console.log(`[SMS] Sent to ${to}: ${result.sid}`);
    return result;
  } catch (err) {
    console.error('[SMS] Failed to send:', err.message);
    throw err;
  }
}

async function sendClientApprovalNotification(clientPhone, estimate) {
  const msg = `WrapIQ: Client ${estimate.client_name} approved estimate ${estimate.estimate_id} for ${estimate.vehicle}. Total: $${estimate.total}. Push to Shopmonkey?`;
  return sendSMS(clientPhone, msg);
}

async function sendLeadNotification(shopPhone, lead) {
  const msg = `WrapIQ: New lead from ${lead.name} - ${lead.vehicle}. Services: ${lead.services}. View: ${lead.intake_link}`;
  return sendSMS(shopPhone, msg);
}

async function sendEstimateExpiryNotification(shopPhone, estimate) {
  const msg = `WrapIQ: Estimate ${estimate.estimate_id} for ${estimate.client_name} expires ${estimate.expires_at}. Regenerate?`;
  return sendSMS(shopPhone, msg);
}

module.exports = {
  sendSMS,
  sendClientApprovalNotification,
  sendLeadNotification,
  sendEstimateExpiryNotification,
};
