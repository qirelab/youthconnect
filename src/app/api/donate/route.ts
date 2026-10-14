import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Create Stripe checkout session for donations
// This is optional - you can also use Stripe Payment Links directly

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  try {
    const { amount, currency = "eur" } = await req.json();

    if (!amount || typeof amount !== "number" || amount < 100) {
      return NextResponse.json(
        { error: "Invalid amount (minimum 1.00)" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: "Donation to YouthConnect Bible Quiz",
              description: "Thank you for supporting our project!",
            },
            unit_amount: amount, // in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin") || process.env.NEXT_PUBLIC_DOMAIN}/?donated=true`,
      cancel_url: `${req.headers.get("origin") || process.env.NEXT_PUBLIC_DOMAIN}/#donate`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
