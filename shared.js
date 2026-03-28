// ============================================================
//  shared.js  –  CCAT Mastery  –  shared Firebase config & helpers
//  Import as ES module:  import { auth, db, STRIPE_URL } from './shared.js';
// ============================================================

import { initializeApp }          from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth }                 from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore }            from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── Firebase project config ──────────────────────────────────
// ⚠️  Replace with your live project values if you ever rotate keys.
export const firebaseConfig = {
  apiKey:            "AIzaSyBmzy47td8xUSSAVEGkkjGWJd8IrHKYrF4",
  authDomain:        "ccat-mastery.firebaseapp.com",
  projectId:         "ccat-mastery",
  storageBucket:     "ccat-mastery.firebasestorage.app",
  messagingSenderId: "178388911839",
  appId:             "1:178388911839:web:8fa4126e67fd007dd1cb6a"
};

// ── Stripe ──────────────────────────────────────────────────
// ⚠️  BEFORE GO-LIVE: replace this test-mode link with your live Stripe
//     Payment Link from the Stripe dashboard (Payments → Payment Links).
//     The test_ prefix means real cards are NOT charged yet.
export const STRIPE_PAYMENT_LINK_BASE = "https://buy.stripe.com/test_3cIfZg63T7hW0b39zk4Ni00";

// Append the logged-in user's UID so the Stripe webhook knows whose
// Firestore doc to update when payment is confirmed server-side.
export function stripeUrlForUser(uid) {
  return `${STRIPE_PAYMENT_LINK_BASE}?client_reference_id=${encodeURIComponent(uid)}`;
}

// ── Initialise once ─────────────────────────────────────────
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
