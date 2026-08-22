import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

const USD_RATE = 0.012; // 1 INR ~ 0.012 USD (or ~83.3 INR per USD)

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('apex_currency') || 'INR';
  });

  useEffect(() => {
    localStorage.setItem('apex_currency', currency);
  }, [currency]);

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'INR' ? 'USD' : 'INR'));
  };

  /**
   * Convert and format an amount in INR to current selected currency
   * @param {number} amountInINR - Price in INR
   * @returns {string} Formatted price string (e.g. "₹299" or "$3.99")
   */
  const formatPrice = (amountInINR) => {
    if (amountInINR === undefined || amountInINR === null || isNaN(amountInINR)) {
      return currency === 'USD' ? '$0' : '₹0';
    }
    const num = Number(amountInINR);
    if (currency === 'USD') {
      const usdVal = (num * USD_RATE).toFixed(2);
      return `$${usdVal}`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  /**
   * Get raw numerical price in current currency
   */
  const getRawPrice = (amountInINR) => {
    const num = Number(amountInINR || 0);
    if (currency === 'USD') {
      return Number((num * USD_RATE).toFixed(2));
    }
    return num;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        formatPrice,
        getRawPrice,
        currencySymbol: currency === 'USD' ? '$' : '₹',
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
