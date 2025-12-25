import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ kh_order_id: string }> }
) {
    const { kh_order_id } = await context.params;
    console.log(`[Poll API] Received request for kh_order_id: ${kh_order_id}`);

    if (!kh_order_id) {
        console.error('[Poll API] kh_order_id is missing');
        return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    try {
        // This should be an environment variable, but for now I will hardcode it
        const pollerApiUrl = `https://dev-api.konfhub.com/event/${kh_order_id}/status`;
        console.log(`[Poll API] Fetching from: ${pollerApiUrl}`);
        const res = await fetch(pollerApiUrl);
        console.log(`[Poll API] Response status from Konfhub: ${res.status}`);

        if (!res.ok) {
            const errorData = await res.json();
            console.error('[Poll API] Error from Konfhub:', errorData);
            return NextResponse.json(errorData, { status: res.status });
        }

        const data = await res.json();
        console.log('[Poll API] Success data from Konfhub:', data);
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error('[Poll API] Internal Server Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
