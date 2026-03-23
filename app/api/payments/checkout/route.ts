import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminAuth } from "@/lib/firebase/admin";
import { CREDIT_PACKS, CREDITS_PER_EURO, type CreditPackKey } from "@/lib/stripe/packs";

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

    const { pack, customAmount } = (await request.json()) as {
      pack: CreditPackKey;
      customAmount?: number;
    };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const stripe = getStripe();

    if (pack === "custom") {
      if (!customAmount || customAmount < 1 || customAmount > 1000) {
        return NextResponse.json(
          { error: "Betrag muss zwischen 1€ und 1.000€ liegen." },
          { status: 400 },
        );
      }

      const amountInCents = Math.round(customAmount * 100);
      const credits = Math.floor((amountInCents / 100) * CREDITS_PER_EURO);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: { name: "Venator Credits" },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        metadata: { userId, credits: String(credits), pack: "custom" },
        success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/buy-credits`,
      });

      return NextResponse.json({ url: session.url });
    }

    const selected = CREDIT_PACKS[pack];
    if (!selected) {
      return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: selected.priceId, quantity: 1 }],
      metadata: { userId, credits: String(selected.credits), pack },
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
