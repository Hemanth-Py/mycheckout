import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { name, email, amount } = await req.json();

  const eventId = "fd4d6cd3-03cc-4ab9-93b1-593f0a1a5ddd";
  const ticketId = process.env.NEXT_PUBLIC_TICKET_ID;
  const apiDomain = "https://dev-api.konfhub.com";

  try {
    // 1. Add Lead
    const leadResponse = await fetch(`${apiDomain}/event/${eventId}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_amount: parseInt(amount),
        currency_id: 1, // Assuming INR
        registration_tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        registration_details: {
          "176516": [
            {
              name: name,
              email_id: email,
            },
          ],
        },
      }),
    });

    if (!leadResponse.ok) {
      const errorData = await leadResponse.json();
      return NextResponse.json({ error: 'Failed to create lead', details: errorData }, { status: leadResponse.status });
    }

    const leadData = await leadResponse.json();
    const khOrderId = leadData.kh_order_id;

    // 2. Create Order
    const orderResponse = await fetch(`${apiDomain}/event/${eventId}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kh_order_id: khOrderId,
        order_amount: parseInt(amount),
        currency_id: 1,
        payment_method: 1, // Assuming UPI
      }),
    });

    if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        return NextResponse.json({ error: 'Failed to create order', details: errorData }, { status: orderResponse.status });
    }

    const orderData = await orderResponse.json();

    return NextResponse.json({ ...leadData, ...orderData });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
