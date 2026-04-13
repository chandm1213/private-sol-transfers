
export const dynamic = "force-dynamic";
import { Suspense } from 'react';
import PaymentLinkContent from '@/components/PaymentLinkContent';

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading payment link...</div>}>
      <PaymentLinkContent />
    </Suspense>
  );
}

