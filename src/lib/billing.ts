export interface BillingBreakdown {
  subtotal: number;
  platformFee: number;
  cgst: number;
  sgst: number;
  deliveryFee: number;
  grandTotal: number;
}

const PLATFORM_FEE = 15;
const DELIVERY_FEE = 50;
const FREE_DELIVERY_THRESHOLD = 500;

export function calculateBillingBreakdown(subtotal: number): BillingBreakdown {
  const platformFee = PLATFORM_FEE;
  const cgst = subtotal * 0.025;
  const sgst = subtotal * 0.025;
  const deliveryFee = subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;
  
  const grandTotal = subtotal + platformFee + cgst + sgst + deliveryFee;

  return {
    subtotal,
    platformFee,
    cgst,
    sgst,
    deliveryFee,
    grandTotal,
  };
}
