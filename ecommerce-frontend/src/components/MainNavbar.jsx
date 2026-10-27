import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  ChevronDown
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import API from '../api/axios';
import './MainNavbar.css';
import OfferAnnouncement from "./offer";

// ==========================================
// HELPERS - find the item count in any response shape
// ==========================================

const findList = (data, depth = 0) => {

  if (Array.isArray(data)) return data;

  if (!data || typeof data !== 'object' || depth > 3) return null;

  const preferredKeys = [
    'items',
    'products',
    'cartItems',
    'wishlistItems',
    'cart',
    'wishlist',
    'data'
  ];

  for (const key of preferredKeys) {

    if (data[key] !== undefined) {

      const found = findList(data[key], depth + 1);

      if (found) return found;

    }

  }

  for (const key of Object.keys(data)) {

    const found = findList(data[key], depth + 1);

    if (found) return found;

  }

  return null;

};

const findCount = (data) => {

  const list = findList(data);

  if (list) return list.length;

  const countKeys = [
    'count',
    'total',
    'totalItems',
    'cartCount',
    'wishlistCount'
  ];

  const sources = [data, data?.data];

  for (const source of sources) {

    if (!source || typeof source !== 'object') continue;

    for (const key of countKeys) {

      if (Number.isFinite(Number(source[key])) && source[key] !== null) {

        return Number(source[key]);

      }

    }

  }

  return null;

};

const MainNavbar = () => {

  const { cartCount, wishlistCount } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');

  const [showCategoryDropdown, setShowCategoryDropdown] =
    useState(false);

  const [categories, setCategories] = useState([]);

  // Live counts (null = not loaded, use context value)
  const [liveCartCount, setLiveCartCount] = useState(null);
  const [liveWishlistCount, setLiveWishlistCount] = useState(null);

  const dropdownRef = useRef(null);
  const headerRef = useRef(null);


  // ==========================================
  // HEADER HEIGHT -> --header-h (CSS variable)
  // Keeps the page content from hiding under the
  // fixed navbar + offer bar at every screen size.
  // ==========================================

  useEffect(() => {

    const el = headerRef.current;

    if (!el) return;

    const updateHeaderHeight = () => {

      document.documentElement.style.setProperty(
        '--header-h',
        `${el.offsetHeight}px`
      );

    };

    updateHeaderHeight();

    const observer = new ResizeObserver(updateHeaderHeight);

    observer.observe(el);

    window.addEventListener('resize', updateHeaderHeight);

    return () => {

      observer.disconnect();

      window.removeEventListener('resize', updateHeaderHeight);

    };

  }, []);


  // ==========================================
  // LIVE CART + WISHLIST COUNT
  // ==========================================

  const refreshCounts = useCallback(async () => {

    try {

      const cartResponse = await API.get('/cart');

      console.log('NAVBAR CART RESPONSE:', cartResponse.data);

      const count = findCount(cartResponse.data);

      if (count !== null) setLiveCartCount(count);

    } catch (error) {

      console.error('NAVBAR CART COUNT ERROR:', error);

    }

    try {

      const wishlistResponse = await API.get('/wishlist');

      console.log('NAVBAR WISHLIST RESPONSE:', wishlistResponse.data);

      const count = findCount(wishlistResponse.data);

      if (count !== null) setLiveWishlistCount(count);

    } catch (error) {

      console.error('NAVBAR WISHLIST COUNT ERROR:', error);

    }

  }, []);

  // First load + every page change
  useEffect(() => {

    refreshCounts();

  }, [location.pathname, refreshCounts]);

  // After any successful add / update / delete on cart or wishlist
  useEffect(() => {

    const interceptorId = API.interceptors.response.use(
      (response) => {

        const method = String(
          response?.config?.method || ''
        ).toLowerCase();

        const url = String(response?.config?.url || '');

        if (
          method !== 'get' &&
          (url.includes('cart') || url.includes('wishlist'))
        ) {

          setTimeout(refreshCounts, 300);

        }

        return response;

      },
      (error) => Promise.reject(error)
    );

    return () => {

      API.interceptors.response.eject(interceptorId);

    };

  }, [refreshCounts]);

  // Tab focus + manual event from any page
  useEffect(() => {

    const handleRefresh = () => refreshCounts();

    window.addEventListener('focus', handleRefresh);
    window.addEventListener('counts-updated', handleRefresh);

    return () => {

      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('counts-updated', handleRefresh);

    };

  }, [refreshCounts]);


  // ==========================================
  // FETCH CATEGORIES
  // ==========================================

  useEffect(() => {

    const fetchCategories = async () => {

      try {

        const response = await API.get(
          '/admin/category'
        );

        console.log(
          'NAVBAR CATEGORIES:',
          response.data
        );

        setCategories(
          response.data.data ||
          response.data ||
          []
        );

      } catch (error) {

        console.error(
          'NAVBAR CATEGORY ERROR:',
          error
        );

      }

    };

    fetchCategories();

  }, []);


  // ==========================================
  // SEARCH
  // ==========================================

  const handleSearchSubmit = (e) => {

    e.preventDefault();

    // Empty search prevent
    if (!searchQuery.trim()) {
      return;
    }

    // Navigate to search page
    navigate(
      `/search?query=${encodeURIComponent(
        searchQuery.trim()
      )}&category=${encodeURIComponent(
        category
      )}`
    );

  };


  // ==========================================
  // CLOSE CATEGORY DROPDOWN
  // ==========================================

  useEffect(() => {

    const handleClickOutside = (e) => {

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {

        setShowCategoryDropdown(false);

      }

    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {

      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );

    };

  }, []);


  return (

    <div className="main-navbar-container" ref={headerRef}>

      <nav className="main-navbar">


        {/* ==========================================
            LOGO
        ========================================== */}

        <div className="nav-brand">

          <Link
            to="/"
            className="logo-link"
          >

            <img
              src={logo}
              alt="Aureya Logo"
              className="logo"
            />

          </Link>

        </div>


        {/* ==========================================
            NAV LINKS
        ========================================== */}

        <ul className="nav-links">


          {/* HOME */}

          <li>

            <Link to="/home">
              Home
            </Link>

          </li>


          {/* DYNAMIC CATEGORIES */}

          {categories
            .filter(
              (cat) =>
                cat.status === 'Active'
            )
            .slice(0, 3)
            .map((cat) => (

              <li key={cat._id}>

                <Link
                  to={`/category/${cat._id}`}
                >

                  {cat.categoryName}

                </Link>

              </li>

            ))}

        </ul>


        {/* ==========================================
            SEARCH BAR
        ========================================== */}

        <form
          className="search-gold"
          onSubmit={handleSearchSubmit}
          ref={dropdownRef}
        >


          {/* ==========================================
              CATEGORY DROPDOWN
          ========================================== */}

          <div className="search-category">

            <button
              type="button"
              className="category-btn"
              onClick={() =>
                setShowCategoryDropdown(
                  (value) => !value
                )
              }
            >

              {category}

              <ChevronDown size={14} />

            </button>


            {showCategoryDropdown && (

              <ul className="category-dropdown">


                {/* ALL */}

                <li
                  onClick={() => {

                    setCategory('All');

                    setShowCategoryDropdown(
                      false
                    );

                  }}
                >

                  All

                </li>


                {/* DYNAMIC CATEGORIES */}

                {categories
                  .filter(
                    (cat) =>
                      cat.status === 'Active'
                  )
                  .map((cat) => (

                    <li
                      key={cat._id}
                      onClick={() => {

                        setCategory(
                          cat.categoryName
                        );

                        setShowCategoryDropdown(
                          false
                        );

                      }}
                    >

                      {cat.categoryName}

                    </li>

                  ))}

              </ul>

            )}

          </div>


          {/* ==========================================
              SEARCH INPUT
          ========================================== */}

          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
          />


          {/* ==========================================
              SEARCH BUTTON
          ========================================== */}

          <button
            type="submit"
            className="search-gold-submit"
            aria-label="Submit search"
          >

            <Search size={18} />

          </button>

        </form>


        {/* ==========================================
            ACTION ICONS
        ========================================== */}

        <div className="nav-actions">


          {/* USER */}

          <Link
            to="/profile"
            className="icon-btn"
            aria-label="User account"
          >

            <User size={20} />

          </Link>


          {/* WISHLIST */}

          <Link
            to="/wishlist"
            className="icon-btn"
            aria-label="Wishlist"
          >

            <Heart size={20} />

            <span className="icon-badge">
              {liveWishlistCount ?? wishlistCount}
            </span>

          </Link>


          {/* CART */}

          <Link
            to="/cart"
            className="icon-btn cart-btn"
            aria-label="Shopping Cart"
          >

            <ShoppingBag size={20} />

            <span className="cart-label">
              CART ({liveCartCount ?? cartCount})
            </span>

          </Link>

        </div>

      </nav>


      {/* ==========================================
          OFFER ANNOUNCEMENT
      ========================================== */}

      <div className="navbar-offer-wrapper">
        <OfferAnnouncement />
      </div>

    </div>

  );

};

export default MainNavbar;