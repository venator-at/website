import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminAuth } from "@/lib/firebase/admin";
import { CREDIT_PACKS, type CreditPackKey } from "@/lib/stripe/packs";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(request: Request) {
  try {
    // Verify Firebase auth token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const { pack } = (await request.json()) as { pack: CreditPackKey };
    const selected = CREDIT_PACKS[pack];

    if (!selected) {
      return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: selected.priceId, quantity: 1 }],
      metadata: {
        userId,
        credits: String(selected.credits),
        pack,
      },
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/buy-credits`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[checkout] Error creating session", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
