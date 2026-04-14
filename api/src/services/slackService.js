const axios = require('axios');
const config = require('../config');

async function sendSlackNotification(payload) {
  if (!config.slack.webhookUrl) {
    console.warn('[Slack] Webhook not configured, skipping');
    return null;
  }

  try {
    await axios.post(config.slack.webhookUrl, payload);
    console.log('[Slack] Notification sent');
  } catch (err) {
    console.error('[Slack] Failed to send:', err.message);
  }
}

async function sendClientApprovedSlack(estimate) {
  return sendSlackNotification({
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: ':white_check_mark: Estimate Approved' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Estimate:*\n${estimate.estimate_id}` },
          { type: 'mrkdwn', text: `*Client:*\n${estimate.client_name}` },
          { type: 'mrkdwn', text: `*Vehicle:*\n${estimate.vehicle}` },
          { type: 'mrkdwn', text: `*Total:*\n$${estimate.total}` },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Push to Shopmonkey' },
            url: `${config.frontendUrl}/estimate/${estimate.id}/push`,
            style: 'primary',
          },
        ],
      },
    ],
  });
}

async function sendLeadReceivedSlack(lead) {
  return sendSlackNotification({
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: ':incoming_envelope: New Lead Received' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Name:*\n${lead.name}` },
          { type: 'mrkdwn', text: `*Vehicle:*\n${lead.vehicle}` },
          { type: 'mrkdwn', text: `*Services:*\n${lead.services}` },
          { type: 'mrkdwn', text: `*Phone:*\n${lead.phone}` },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Convert to Estimate' },
            url: `${config.frontendUrl}/leads/${lead.id}/convert`,
            style: 'primary',
          },
        ],
      },
    ],
  });
}

async function sendEstimateExpiredSlack(estimate) {
  return sendSlackNotification({
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: ':warning: Estimate Expired' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Estimate:*\n${estimate.estimate_id}` },
          { type: 'mrkdwn', text: `*Client:*\n${estimate.client_name}` },
          { type: 'mrkdwn', text: `*Expired:*\n${estimate.expires_at}` },
        ],
      },
    ],
  });
}

module.exports = {
  sendSlackNotification,
  sendClientApprovedSlack,
  sendLeadReceivedSlack,
  sendEstimateExpiredSlack,
};
