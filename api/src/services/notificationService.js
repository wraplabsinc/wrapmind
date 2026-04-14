const smsService = require('../services/smsService');
const emailService = require('../services/emailService');
const slackService = require('../services/slackService');
const { supabaseAdmin } = require('../config/database');

async function logNotification(channel, triggerEvent, estimateId, data) {
  await supabaseAdmin.from('notifications_log').insert({
    channel,
    trigger_event: triggerEvent,
    estimate_id: estimateId,
    sent_at: new Date().toISOString(),
    data,
  });
}

async function notifyClientApproved(estimate, clientPhone, clientEmail) {
  const payload = {
    estimate_id: estimate.estimate_id,
    client_name: `${estimate.client?.first_name || ''} ${estimate.client?.last_name || ''}`,
    vehicle: `${estimate.vehicle_json?.year || ''} ${estimate.vehicle_json?.make || ''} ${estimate.vehicle_json?.model || ''}`,
    total: estimate.total,
  };

  const promises = [];

  if (clientPhone) {
    promises.push(
      smsService.sendClientApprovalNotification(clientPhone, payload)
        .then(() => logNotification('sms', 'client_approved', estimate.id, { to: clientPhone }))
        .catch((err) => logNotification('sms', 'client_approved_failed', estimate.id, { error: err.message }))
    );
  }

  if (clientEmail) {
    promises.push(
      emailService.sendApprovalConfirmationEmail(clientEmail, { ...payload, ...estimate })
        .then(() => logNotification('email', 'client_approved', estimate.id, { to: clientEmail }))
        .catch((err) => logNotification('email', 'client_approved_failed', estimate.id, { error: err.message }))
    );
  }

  promises.push(
    slackService.sendClientApprovedSlack(payload)
      .then(() => logNotification('slack', 'client_approved', estimate.id, {}))
      .catch((err) => logNotification('slack', 'client_approved_failed', estimate.id, { error: err.message }))
  );

  await Promise.allSettled(promises);
}

async function notifyLeadReceived(lead, shopPhone) {
  const payload = {
    name: `${lead.first_name} ${lead.last_name}`,
    vehicle: `${lead.year || ''} ${lead.make || ''} ${lead.model || ''}`,
    services: lead.services_requested?.join(', ') || 'Not specified',
    phone: lead.phone,
    intake_link: `${process.env.FRONTEND_URL}/leads/${lead.id}`,
  };

  const promises = [];

  if (shopPhone) {
    promises.push(
      smsService.sendLeadNotification(shopPhone, payload)
        .then(() => logNotification('sms', 'lead_received', null, { to: shopPhone }))
        .catch((err) => logNotification('sms', 'lead_received_failed', null, { error: err.message }))
    );
  }

  promises.push(
    slackService.sendLeadReceivedSlack(payload)
      .then(() => logNotification('slack', 'lead_received', null, {}))
      .catch((err) => logNotification('slack', 'lead_received_failed', null, { error: err.message }))
  );

  if (lead.email) {
    promises.push(
      emailService.sendIntakeAcknowledgmentEmail(lead.email)
        .then(() => logNotification('email', 'intake_acknowledgment', null, { to: lead.email }))
        .catch((err) => logNotification('email', 'intake_acknowledgment_failed', null, { error: err.message }))
    );
  }

  await Promise.allSettled(promises);
}

async function notifyEstimateExpired(estimate, shopPhone) {
  const payload = {
    estimate_id: estimate.estimate_id,
    client_name: `${estimate.client?.first_name || ''} ${estimate.client?.last_name || ''}`,
    expires_at: new Date(estimate.expires_at).toLocaleDateString(),
  };

  const promises = [];

  if (shopPhone) {
    promises.push(
      smsService.sendEstimateExpiryNotification(shopPhone, payload)
        .then(() => logNotification('sms', 'estimate_expired', estimate.id, { to: shopPhone }))
        .catch((err) => logNotification('sms', 'estimate_expired_failed', estimate.id, { error: err.message }))
    );
  }

  promises.push(
    slackService.sendEstimateExpiredSlack(payload)
      .then(() => logNotification('slack', 'estimate_expired', estimate.id, {}))
      .catch((err) => logNotification('slack', 'estimate_expired_failed', estimate.id, { error: err.message }))
  );

  await Promise.allSettled(promises);
}

async function notifyEstimateSent(estimate) {
  await logNotification('in_app', 'estimate_sent', estimate.id, {});
}

module.exports = {
  notifyClientApproved,
  notifyLeadReceived,
  notifyEstimateExpired,
  notifyEstimateSent,
  logNotification,
};
