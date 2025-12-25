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
  const [loading, setLoading] = useState(false); // New state for loading indicator

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Netbanking details
  const [bankCode, setBankCode] = useState('');

  // Wallet details
  const [wallet, setWallet] = useState('');

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

    setLoading(true); // Start loading

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
        setLoading(false); // Stop loading on error
        return;
      }

      const orderData = await res.json();
      const { order_id, rzp_api_key, order_amount } = orderData;

      const rzp = new window.Razorpay({
        key: rzp_api_key,
        redirect: true,
      });

      let paymentData: any = {
        order_id: order_id,
        amount: order_amount * 100,
        currency: 'INR',
        method: paymentMethod,
        email: email,
        contact: '9999999999', // Replace with actual contact number
      };

      if (paymentMethod === 'card') {
        const [expiry_month, expiry_year] = cardExpiry.split('/');
        paymentData.card = {
          number: cardNumber,
          expiry_month: expiry_month.trim(),
          expiry_year: expiry_year.trim(),
          cvv: cardCvv,
          name: cardName,
        };
      } else if (paymentMethod === 'netbanking') {
        paymentData.bank = bankCode;
      } else if (paymentMethod === 'wallet') {
        paymentData.wallet = wallet;
      }

      rzp.createPayment(paymentData);

      rzp.on('payment.success', function (response: any) {
        alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
        setLoading(false); // Stop loading on success
      });

      rzp.on('payment.error', function (response: any) {
        alert(`Payment failed! Error: ${response.error.description}`);
        setLoading(false); // Stop loading on error
      });


    } catch (error) {
      console.error('An unexpected error occurred:', error);
      alert('An unexpected error occurred. Please try again.');
      setLoading(false); // Stop loading on unexpected error
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="w-full max-w-lg p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-md">
        <h1 className="text-3xl font-semibold text-center text-black dark:text-zinc-50 mb-6">
          Checkout
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... existing form fields for name, email, amount ... */}
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
              Order Amount (in rupees)
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
              <div className="flex items-center">
                <input
                  id="wallet"
                  name="paymentMethod"
                  type="radio"
                  value="wallet"
                  checked={paymentMethod === 'wallet'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-zinc-300"
                />
                <label htmlFor="wallet" className="ml-2 block text-sm text-zinc-900 dark:text-zinc-100">
                  Wallet
                </label>
              </div>
            </div>
          </div>

          {paymentMethod === 'card' && (
            <div className="space-y-4 rounded-md bg-zinc-100 dark:bg-zinc-800 p-4">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Card Details</h3>
              <input
                type="text"
                placeholder="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <input
                type="text"
                placeholder="Cardholder Name"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <input
                  type="text"
                  placeholder="CVV"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'netbanking' && (
            <div className="space-y-4 rounded-md bg-zinc-100 dark:bg-zinc-800 p-4">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Netbanking Details</h3>
              <input
                type="text"
                placeholder="Enter Bank Code (e.g., HDFC, SBIN)"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          )}

          {paymentMethod === 'wallet' && (
            <div className="space-y-4 rounded-md bg-zinc-100 dark:bg-zinc-800 p-4">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Wallet Details</h3>
              <input
                type="text"
                placeholder="Enter Wallet Code (e.g., paytm, phonepe)"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          )}


          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading} // Disable button when loading
          >
            {loading ? 'Processing...' : 'Pay'}
          </button>
        </form>
      </main>
    </div>
  );
}