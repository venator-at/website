export const CREDIT_PACKS = {
  starter: {
    priceId: "price_1TDDTB5Dtk43yD4HkNWN4qUJ",
    credits: 100,
    price: 5,
    name: "Starter",
    description: "10 complete architectures",
  },
  pro: {
    priceId: "price_1TDDTC5Dtk43yD4H6JAUXuEw",
    credits: 250,
    price: 10,
    name: "Pro",
    description: "25 complete architectures",
  },
} as const;

export type FixedPackKey = keyof typeof CREDIT_PACKS;
export type CreditPackKey = FixedPackKey | "custom";

/** Credits granted per euro for custom purchases (starter rate). */
export const CREDITS_PER_EURO = 20;
