"use client";
import { useState, FormEvent, useEffect } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Home() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/razorpay.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!scriptLoaded) {
      alert('Razorpay script not loaded yet. Please try again.');
      return;
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, amount }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Failed to create order:', errorData);
        alert(`Error: ${errorData.error}. ${errorData.details?.error || ''}`);
        return;
      }

      const orderData = await res.json();
      const { order_id, rzp_api_key } = orderData;

      const rzp = new window.Razorpay({
        key: rzp_api_key,
        // redirect: true, // Uncomment this for redirection flow
      });

      const paymentData = {
        order_id: order_id,
        amount: parseInt(amount) * 100,
        currency: 'INR',
        method: paymentMethod,
        email: email,
        contact: '9999999999', // Replace with actual contact number
      };

      rzp.createPayment(paymentData);

      rzp.on('payment.success', function (response: any) {
        alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
      });

      rzp.on('payment.error', function (response: any) {
        alert(`Payment failed! Error: ${response.error.description}`);
      });


    } catch (error) {
      console.error('An unexpected error occurred:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-md">
        <h1 className="text-3xl font-semibold text-center text-black dark:text-zinc-50 mb-6">
          Checkout
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Order Amount (in smallest currency unit, e.g., paisa)
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Payment Method
            </label>
            <div className="mt-2 flex space-x-4">
              <div className="flex items-center">
                <input
                  id="upi"
                  name="paymentMethod"
                  type="radio"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-zinc-300"
                />
                <label htmlFor="upi" className="ml-2 block text-sm text-zinc-900 dark:text-zinc-100">
                  UPI
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="card"
                  name="paymentMethod"
                  type="radio"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-zinc-300"
                />
                <label htmlFor="card" className="ml-2 block text-sm text-zinc-900 dark:text-zinc-100">
                  Card
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="netbanking"
                  name="paymentMethod"
                  type="radio"
                  value="netbanking"
                  checked={paymentMethod === 'netbanking'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-zinc-300"
                />
                <label htmlFor="netbanking" className="ml-2 block text-sm text-zinc-900 dark:text-zinc-100">
                  Netbanking
                </label>
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Pay
          </button>
        </form>
      </main>
    </div>
  );
}
