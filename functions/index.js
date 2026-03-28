// ============================================================
//  functions/index.js  –  CCAT Mastery  –  Stripe webhook
//
//  HOW TO DEPLOY
//  -------------
//  1.  cd functions && npm install
//  2.  Set secrets (do NOT commit these to git):
//        firebase functions:secrets:set STRIPE_SECRET_KEY
//        firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
//  3.  firebase deploy --only functions
//
//  HOW TO WIRE THE WEBHOOK
//  -----------------------
//  In the Stripe Dashboard → Developers → Webhooks → Add endpoint:
//    URL:   https://<your-region>-ccat-mastery.cloudfunctions.net/stripeWebhook
//    Events to listen for:  checkout.session.completed
//  Copy the "Signing secret" and save it:
//    firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
// ============================================================

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin  = require("firebase-admin");
const stripe = require("stripe");

admin.initializeApp();

const STRIPE_SECRET_KEY     = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

exports.stripeWebhook = onRequest(
  {
    secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET],
    // Stripe requires the raw body for signature verification
    rawBody: true,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const stripeClient = stripe(STRIPE_SECRET_KEY.value());
    const sig          = req.headers["stripe-signature"];

    let event;
    try {
      // Verify the webhook signature – this is what prevents anyone from
      // hitting this URL directly and granting themselves paid access.
      event = stripeClient.webhooks.constructEvent(
        req.rawBody,
        sig,
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Only act on successful checkouts
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // We appended ?client_reference_id=UID in stripeUrlForUser()
      const uid = session.client_reference_id;

      if (!uid) {
        console.error("No client_reference_id in session:", session.id);
        // Return 200 so Stripe doesn't retry – we can't do anything without a UID
        return res.status(200).send("No UID – skipped");
      }

      try {
        await admin.firestore().collection("users").doc(uid).set(
          { hasPaid: true, paidAt: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true }
        );
        console.log(`Marked hasPaid=true for user ${uid}`);
      } catch (err) {
        console.error("Firestore write failed:", err);
        // Return 500 so Stripe retries the webhook
        return res.status(500).send("Firestore error");
      }
    }

    return res.status(200).json({ received: true });
  }
);
