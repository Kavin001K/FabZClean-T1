const DEFAULT_PUBLIC_WEBSITE_URL = 'https://www.myfabclean.com';

export const PUBLIC_WEBSITE_URL = (
  import.meta.env.VITE_PUBLIC_WEBSITE_URL || DEFAULT_PUBLIC_WEBSITE_URL
).replace(/\/$/, '');

export const getPublicTrackOrderUrl = (orderNumber?: string | null) =>
  `${PUBLIC_WEBSITE_URL}/trackorder/${encodeURIComponent(orderNumber || '')}`;

export const getPublicFeedbackUrl = ({
  orderId,
  orderNumber,
}: {
  orderId?: string | null;
  orderNumber?: string | null;
} = {}) => {
  const params = new URLSearchParams();

  if (orderId) {
    params.set('orderId', orderId);
  } else if (orderNumber) {
    params.set('orderNumber', orderNumber);
  }

  const query = params.toString();
  return `${PUBLIC_WEBSITE_URL}/feedback${query ? `?${query}` : ''}`;
};
