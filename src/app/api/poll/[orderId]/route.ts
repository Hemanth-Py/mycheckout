import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ orderId: string }> }
) {
    const { orderId } = await context.params;

    if (!orderId) {
        return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    try {
        // This should be an environment variable, but for now I will hardcode it
        const pollerApiUrl = `https://dev-api.konfhub.com/event/${orderId}/status`;
        const res = await fetch(pollerApiUrl);

        if (!res.ok) {
            const errorData = await res.json();
            return NextResponse.json(errorData, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
