import { OrderDetailsWrapper } from "@/features/orders/components/order-details-wrapper";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function OrderPage({ params }: PageProps) {
  const { id, locale } = await params;

  return <OrderDetailsWrapper orderId={id} locale={locale} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;

  return {
    title: `Order ${id.slice(0, 8)}...`,
    description: "View your order details and tracking information",
  };
}
