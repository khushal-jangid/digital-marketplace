import React, { createContext, useContext, useState, useEffect } from 'react';
import { request } from '../utils/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (_) {
      return [];
    }
  });

  const [coupon, setCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);

  const getItemEffectivePrice = (item) => {
    const basePrice = Number(item.price || 0);
    if (item.licenseType === 'commercial') {
      return Math.round(basePrice * 2.2);
    }
    return basePrice;
  };

  const subtotal = cartItems.reduce((acc, curr) => acc + getItemEffectivePrice(curr), 0);

  // Recalculate preview discount when cart or coupon changes
  const calculatePreviewDiscount = (couponData, items) => {
    if (!couponData) {
      setDiscount(0);
      return;
    }

    const currentSubtotal = items.reduce((acc, curr) => acc + getItemEffectivePrice(curr), 0);

    // Minimum order check
    if (couponData.minOrderAmount && currentSubtotal < couponData.minOrderAmount) {
      setDiscount(0);
      return;
    }

    let disc = 0;

    // Target project restriction check
    if (couponData.targetProject && couponData.targetProject !== 'all') {
      const targetIdStr = couponData.targetProject.toString();
      const targetItem = items.find(
        (i) => (i._id || i.projectId || i.id || '').toString() === targetIdStr
      );
      if (!targetItem) {
        setDiscount(0);
        return;
      }
      const targetPrice = getItemEffectivePrice(targetItem);
      if (couponData.discountType === 'percentage') {
        disc = (targetPrice * Number(couponData.discountValue)) / 100;
      } else {
        disc = Math.min(targetPrice, Number(couponData.discountValue));
      }
    } else {
      if (couponData.discountType === 'percentage') {
        disc = (currentSubtotal * Number(couponData.discountValue)) / 100;
      } else {
        disc = Math.min(currentSubtotal, Number(couponData.discountValue));
      }
    }

    if (couponData.maxDiscount && disc > couponData.maxDiscount) {
      disc = couponData.maxDiscount;
    }

    setDiscount(Math.max(0, Math.min(currentSubtotal, Math.round(disc))));
  };

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (_) {}

    if (coupon) {
      calculatePreviewDiscount(coupon, cartItems);
    } else {
      setDiscount(0);
    }
  }, [cartItems, coupon]);

  const addToCart = (project, licenseType = 'personal') => {
    const existingIndex = cartItems.findIndex((item) => item._id === project._id);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex] = { ...updated[existingIndex], licenseType };
      setCartItems(updated);
      return true;
    }
    setCartItems([...cartItems, { ...project, licenseType }]);
    return true;
  };

  const updateLicense = (projectId, licenseType) => {
    setCartItems((prev) =>
      prev.map((item) => (item._id === projectId ? { ...item, licenseType } : item))
    );
  };

  const removeFromCart = (projectId) => {
    setCartItems(cartItems.filter((item) => item._id !== projectId));
  };

  const clearCart = () => {
    setCartItems([]);
    setCoupon(null);
    setDiscount(0);
  };

  const applyCoupon = async (code) => {
    if (!code || typeof code !== 'string' || !code.trim()) {
      throw new Error('Please enter a valid coupon code.');
    }

    try {
      const data = await request('/coupons/validate', 'POST', {
        code: code.trim().toUpperCase(),
        cartAmount: subtotal,
        cartItems,
      });

      if (data.success && data.coupon) {
        const couponData = {
          code: data.coupon.code,
          discountType: data.coupon.discountType,
          discountValue: data.coupon.discountValue,
          maxDiscount: data.coupon.maxDiscount,
          minOrderAmount: data.coupon.minOrderAmount,
          targetProject: data.coupon.targetProject,
          targetProjectTitle: data.coupon.targetProjectTitle,
        };
        setCoupon(couponData);
        if (data.discount !== undefined) {
          setDiscount(data.discount);
        } else {
          calculatePreviewDiscount(couponData, cartItems);
        }
        return { success: true, message: data.message || `Coupon ${couponData.code} applied successfully!` };
      }
      throw new Error(data.message || 'Invalid coupon code');
    } catch (error) {
      setCoupon(null);
      setDiscount(0);
      throw error;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setDiscount(0);
  };

  const total = Math.max(0, subtotal - discount);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateLicense,
        getItemEffectivePrice,
        removeFromCart,
        clearCart,
        coupon,
        discount,
        subtotal,
        total,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
