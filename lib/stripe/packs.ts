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
  power: {
    priceId: "price_1TDDTC5Dtk43yD4HiuIVKnvh",
    credits: 600,
    price: 20,
    name: "Power",
    description: "60 complete architectures",
  },
} as const;

export type CreditPackKey = keyof typeof CREDIT_PACKS;
