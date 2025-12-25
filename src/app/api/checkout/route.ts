import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('[Checkout API] Received POST request');
  const body = await req.json();
  const { name, email, amount } = body;
  console.log('[Checkout API] Request body:', body);

  const eventId = "68cfeb2f-458a-407c-89a4-271297d90932";
  const ticketId = process.env.NEXT_PUBLIC_TICKET_ID;
  const apiDomain = "https://api.konfhub.com";

  try {
    // 1. Add Lead
    const leadPayload = {
      order_amount: parseInt(amount),
      currency_id: 1, // Assuming INR
      registration_tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      registration_details: {
        "69683": [
          {
            name: name,
            email_id: email,
            donation_price: parseInt(amount),
          },
        ],
      },
    };
    console.log('[Checkout API] Creating lead with payload:', leadPayload);
    const leadResponse = await fetch(`${apiDomain}/event/${eventId}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadPayload),
    });
    console.log(`[Checkout API] Lead creation response status: ${leadResponse.status}`);

    if (!leadResponse.ok) {
      const errorData = await leadResponse.json();
      console.error('[Checkout API] Failed to create lead:', errorData);
      return NextResponse.json({ error: 'Failed to create lead', details: errorData }, { status: leadResponse.status });
    }

    const leadData = await leadResponse.json();
    const khOrderId = leadData.kh_order_id;
    console.log('[Checkout API] Lead created successfully. kh_order_id:', khOrderId);

    // 2. Create Order
    const orderPayload = {
      kh_order_id: khOrderId,
      order_amount: parseInt(amount),
      donation_price: parseInt(amount),
      currency_id: 1,
      payment_method: 1, // Assuming UPI
    };
    console.log('[Checkout API] Creating order with payload:', orderPayload);
    const orderResponse = await fetch(`${apiDomain}/event/${eventId}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });
    console.log(`[Checkout API] Order creation response status: ${orderResponse.status}`);

    if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        console.error('[Checkout API] Failed to create order:', errorData);
        return NextResponse.json({ error: 'Failed to create order', details: errorData }, { status: orderResponse.status });
    }

    const orderData = await orderResponse.json();
    console.log('[Checkout API] Order created successfully:', orderData);
    
    const responseData = { ...leadData, ...orderData };
    console.log('[Checkout API] Sending final response:', responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[Checkout API] Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
