const axios = require('axios');
const config = require('../config');

async function sendEmail(to, templateId, dynamicData) {
  if (!config.sendgrid.apiKey) {
    console.warn('[Email] SendGrid not configured, skipping');
    return null;
  }

  try {
    await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [{
          to: [{ email: to }],
          dynamic_template_data: dynamicData,
        }],
        from: { email: config.email?.from || 'noreply@wraplabs.com' },
        template_id: templateId,
      },
      {
        headers: {
          Authorization: `Bearer ${config.sendgrid.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`[Email] Sent to ${to} using template ${templateId}`);
  } catch (err) {
    console.error('[Email] Failed to send:', err.response?.data || err.message);
    throw err;
  }
}

async function sendEstimateLinkEmail(clientEmail, estimate) {
  return sendEmail(clientEmail, 'estimate_link', {
    client_name: estimate.client_name,
    vehicle: estimate.vehicle,
    total: estimate.total,
    expiry_date: estimate.expires_at,
    estimate_link: estimate.view_url,
    shop_name: estimate.shop_name,
  });
}

async function sendApprovalConfirmationEmail(clientEmail, estimate) {
  return sendEmail(clientEmail, 'approval_confirmation', {
    client_name: estimate.client_name,
    vehicle: estimate.vehicle,
    total: estimate.total,
    deposit_amount: estimate.deposit_amount,
    estimate_id: estimate.estimate_id,
    deposit_instructions: estimate.deposit_instructions,
    shop_name: estimate.shop_name,
  });
}

async function sendDepositReminderEmail(clientEmail, estimate) {
  return sendEmail(clientEmail, 'deposit_reminder', {
    client_name: estimate.client_name,
    vehicle: estimate.vehicle,
    deposit_amount: estimate.deposit_amount,
    estimate_id: estimate.estimate_id,
    shop_name: estimate.shop_name,
  });
}

async function sendEstimateExpiryWarningEmail(clientEmail, estimate) {
  return sendEmail(clientEmail, 'estimate_expiry_warning', {
    client_name: estimate.client_name,
    vehicle: estimate.vehicle,
    expiry_date: estimate.expires_at,
    estimate_id: estimate.estimate_id,
    shop_name: estimate.shop_name,
  });
}

async function sendIntakeAcknowledgmentEmail(clientEmail) {
  return sendEmail(clientEmail, 'intake_acknowledgment', {
    shop_name: config.shop?.name || 'Wrap Labs',
  });
}

module.exports = {
  sendEmail,
  sendEstimateLinkEmail,
  sendApprovalConfirmationEmail,
  sendDepositReminderEmail,
  sendEstimateExpiryWarningEmail,
  sendIntakeAcknowledgmentEmail,
};
