'use strict';

const crypto = require('node:crypto');
const { handleEvent } = require('./eventHandlers');

const _processedIds = new Set();

async function handleWebhook(req, res) {
  try {
    // 1. Verify the HMAC-SHA256 signature.
    const signature = req.headers['x-webhook-signature'];
    const secret = process.env.WEBHOOK_SECRET || 'testsecret';

    if (
      !signature ||
      typeof signature !== 'string' ||
      !/^sha256=[a-fA-F0-9]{64}$/.test(signature) ||
      !Buffer.isBuffer(req.body)
    ) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(req.body)
      .digest();

    const received = Buffer.from(signature.slice(7), 'hex');

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(expected, received)
    ) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Parse the body only after signature verification.
    const event = JSON.parse(req.body.toString('utf8'));

    if (!event.id) {
      return res.status(400).json({ error: 'Missing event ID' });
    }

    // 3. Check whether this event was already processed.
    if (_processedIds.has(event.id)) {
      return res.status(200).json({
        status: 'already_processed',
      });
    }

    // 4. Mark the event as processed before handling it.
    _processedIds.add(event.id);

    // 5. Acknowledge immediately.
    res.status(200).json({ status: 'received' });

    // Process asynchronously after sending the response.
    setImmediate(() => {
      handleEvent(event).catch((err) => {
        console.error('Webhook event processing failed:', err);
      });
    });

  } catch (err) {
    console.error('Webhook error:', err);

    if (!res.headersSent) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }
  }
}

module.exports = { handleWebhook, _processedIds };