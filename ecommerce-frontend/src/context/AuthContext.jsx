import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';

import API from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [cartCount, setCartCount] = useState(0);

  const [wishlistCount, setWishlistCount] = useState(0);


  // ==========================================
  // LOGIN
  // ==========================================

  const login = () => {
    setIsLoggedIn(true);
  };


  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {

    setIsLoggedIn(false);

    setCartCount(0);

    setWishlistCount(0);

  };


  // ==========================================
  // FETCH WISHLIST COUNT
  // ==========================================

  const fetchWishlistCount = async () => {

    try {

      const response = await API.get('/wishlist');

      console.log(
        'WISHLIST COUNT RESPONSE:',
        response.data
      );

      const items =
        response.data?.wishlist?.items || [];

      setWishlistCount(items.length);

    } catch (error) {

      console.error(
        'WISHLIST COUNT ERROR:',
        error
      );

      setWishlistCount(0);

    }

  };


  // ==========================================
  // FETCH CART COUNT
  // ==========================================

  const fetchCartCount = async () => {

    try {

      const response = await API.get('/cart');

      console.log(
        'CART COUNT RESPONSE:',
        response.data
      );

      const cartItems =
        response.data?.cart?.cartitems ||
        response.data?.data?.cartitems ||
        [];

      const totalQuantity = cartItems.reduce(
        (total, item) =>
          total + (item.quantity || 0),
        0
      );

      setCartCount(totalQuantity);

    } catch (error) {

      console.error(
        'CART COUNT ERROR:',
        error
      );

      setCartCount(0);

    }

  };


  // ==========================================
  // FETCH COUNTS WHEN LOGGED IN
  // ==========================================

  useEffect(() => {

    const token =
      localStorage.getItem('token');

    if (!token) {
      return;
    }

    setIsLoggedIn(true);

    fetchWishlistCount();

    fetchCartCount();

  }, []);


  return (

    <AuthContext.Provider
      value={{

        isLoggedIn,

        login,

        logout,


        // CART
        cartCount,
        setCartCount,
        fetchCartCount,


        // WISHLIST
        wishlistCount,
        setWishlistCount,
        fetchWishlistCount

      }}
    >

      {children}

    </AuthContext.Provider>

  );

};


export const useAuth = () =>
  useContext(AuthContext);