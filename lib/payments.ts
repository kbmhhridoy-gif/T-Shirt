// lib/payments.ts
import Stripe from 'stripe';
import axios from 'axios';

// ─── Stripe ────────────────────────────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function createStripePaymentIntent(amount: number, currency = 'bdt') {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // in paisa
    currency,
    payment_method_types: ['card'],
  });
  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

export async function verifyStripePayment(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent.status === 'succeeded';
}

// ─── bKash (Sandbox) ───────────────────────────────────────────────────────
const BKASH_BASE = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

async function getBkashToken() {
  const res = await axios.post(
    `${BKASH_BASE}/tokenized/checkout/token/grant`,
    {
      app_key: process.env.BKASH_APP_KEY,
      app_secret: process.env.BKASH_APP_SECRET,
    },
    {
      headers: {
        username: process.env.BKASH_USERNAME,
        password: process.env.BKASH_PASSWORD,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data.id_token;
}

export async function createBkashPayment(amount: number, orderId: string) {
  const token = await getBkashToken();

  const res = await axios.post(
    `${BKASH_BASE}/tokenized/checkout/create`,
    {
      mode: '0011',
      payerReference: orderId,
      callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/bkash/callback`,
      amount: amount.toString(),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: orderId,
    },
    {
      headers: {
        Authorization: token,
        'X-APP-Key': process.env.BKASH_APP_KEY,
      },
    }
  );

  return {
    paymentID: res.data.paymentID,
    bkashURL: res.data.bkashURL,
  };
}

export async function executeBkashPayment(paymentID: string) {
  const token = await getBkashToken();

  const res = await axios.post(
    `${BKASH_BASE}/tokenized/checkout/execute`,
    { paymentID },
    {
      headers: {
        Authorization: token,
        'X-APP-Key': process.env.BKASH_APP_KEY,
      },
    }
  );

  return res.data.statusCode === '0000';
}

// ─── Nagad (Sandbox) ───────────────────────────────────────────────────────
const NAGAD_BASE = process.env.NAGAD_BASE_URL || 'https://sandbox.mynagad.com:10080';

export async function createNagadPayment(amount: number, orderId: string) {
  // Nagad requires crypto signing; this is a simplified version
  // In production, implement full RSA signing as per Nagad documentation
  const merchantId = process.env.NAGAD_MERCHANT_ID;
  const dateTime = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);

  const initRes = await axios.post(
    `${NAGAD_BASE}/api/dfs/check-out/initialize/${merchantId}/${orderId}`,
    {
      merchantId,
      orderId,
      currencyCode: '050',
      amount: amount.toFixed(2),
      challenge: orderId + dateTime,
    },
    {
      headers: {
        'X-KM-Api-Version': 'v-0.2.0',
        'X-KM-IP-V4': '127.0.0.1',
        'X-KM-Client-Type': 'PC_WEB',
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    redirectUrl: `${NAGAD_BASE}/api/dfs/check-out/checkout/${initRes.data.sensitiveData}`,
    paymentReferenceId: initRes.data.paymentReferenceId,
  };
}

export { stripe };
