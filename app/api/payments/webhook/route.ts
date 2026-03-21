import { NextResponse } from "next/server";
import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not set" }, { status: 500 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("[webhook] Verification failed", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const { userId, credits } = session.metadata ?? {};

    if (!userId || !credits) {
      console.error("[webhook] Missing metadata", { userId, credits });
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const creditsToAdd = Number(credits);
    const db = getAdminDb();
    const userRef = db.collection("users").doc(userId);

    // Atomically add credits (or create doc if missing)
    await db.runTransaction(async (t) => {
      const snap = await t.get(userRef);
      if (!snap.exists) {
        t.set(userRef, {
          credits: creditsToAdd,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        t.update(userRef, {
          credits: FieldValue.increment(creditsToAdd),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    // Record transaction for audit trail
    await db.collection("credit_transactions").add({
      userId,
      amount: creditsToAdd,
      reason: "purchase",
      stripeSessionId: session.id,
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log("[webhook] Credits added", { userId, creditsToAdd });
  }

  return NextResponse.json({ received: true });
}
