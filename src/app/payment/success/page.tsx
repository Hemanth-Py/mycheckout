"use client";
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const khOrderId = searchParams.get('kh_order_id');
    const [ticketDetails, setTicketDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!khOrderId) {
            setError("Order ID not found.");
            setLoading(false);
            return;
        }

        const pollingInterval = 3000; // 3 seconds
        const pollingDuration = 2 * 60 * 1000; // 2 minutes
        let pollingTimer: NodeJS.Timeout;
        const startTime = Date.now();

        const pollApi = async () => {
            if (Date.now() - startTime > pollingDuration) {
                clearInterval(pollingTimer);
                setError("Polling timed out. Please contact support.");
                setLoading(false);
                return;
            }

            try {
                // The API endpoint needs to be proxied through the Next.js app
                // to avoid CORS issues. I will assume a proxy is set up at /api/poll.
                // I will create this proxy later.
                const res = await fetch(`/api/poll/${khOrderId}`);
                
                if (res.status === 200) {
                    console.log("[SuccessContent] Raw response from /api/poll:", res);
                    let data = await res.json();
                    if (typeof data === 'string') {
                        try {
                            data = JSON.parse(data);
                        } catch (e) {
                            console.error("Failed to parse stringified JSON:", e);
                            setError("Failed to parse API response.");
                            setLoading(false);
                            return;
                        }
                    }
                    console.log("[SuccessContent] Parsed data from /api/poll:", data);
                    setTicketDetails(data.message);
                    setLoading(false);
                    clearInterval(pollingTimer);
                } else if (res.status === 404) {
                    console.log("[SuccessContent] Poll API returned 404. Continuing polling.");
                    // Still processing, continue polling
                } else {
                    const errorData = await res.json();
                    console.error("[SuccessContent] Error response from /api/poll:", errorData);
                    setError(errorData.message?.error?.error_message || "An error occurred while fetching ticket details.");
                    setLoading(false);
                    clearInterval(pollingTimer);
                }
            } catch (err) {
                setError("An unexpected error occurred during polling.");
                setLoading(false);
                clearInterval(pollingTimer);
            }
        };

        pollingTimer = setInterval(pollApi, pollingInterval);
        pollApi(); // Initial call

        return () => clearInterval(pollingTimer);
    }, [khOrderId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
            <div className="bg-white dark:bg-zinc-800 p-10 rounded-lg shadow-lg text-center">
                {loading && (
                    <>
                        <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-200 mb-4">Processing your ticket...</h1>
                        <p className="text-zinc-600 dark:text-zinc-400">Please wait while we fetch your ticket details.</p>
                    </>
                )}
                {error && (
                    <>
                        <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h1>
                        <p className="text-zinc-700 dark:text-zinc-300 mb-6">{error}</p>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Go to Home Page
                        </button>
                    </>
                )}
                {ticketDetails && (
                    <>
                        <h1 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">Payment Successful!</h1>
                        <div className="text-left">
                            {ticketDetails.message && <p><strong>Message:</strong> {ticketDetails.message}</p>}
                            {Array.isArray(ticketDetails.booking_id) && <p><strong>Booking IDs:</strong> {ticketDetails.booking_id.join(', ')}</p>}
                            {ticketDetails.url && Object.keys(ticketDetails.url).map(key => {
                                if(key !== 'zip' && key !== 'bulk_invoice') {
                                    return (
                                        <div key={key} className="my-4 p-4 border border-zinc-200 dark:border-zinc-700 rounded-md">
                                            <p><strong>Name:</strong> {ticketDetails.url[key].name}</p>
                                            <p><strong>Ticket Name:</strong> {ticketDetails.url[key].ticket_name}</p>
                                            <a href={ticketDetails.url[key].ticket} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline">View Ticket</a>
                                        </div>
                                    )
                                }
                                return null;
                            })}
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Go to Home Page
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
