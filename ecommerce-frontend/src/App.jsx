import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Outlet,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";


// ==========================================
// COMPONENTS
// ==========================================

import Navbar from "./components/navbvar";
import MainNavbar from "./components/MainNavbar";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";


// ==========================================
// AUTH PAGES
// ==========================================

import Login from "./pages/login";
import Signup from "./pages/signup";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";


// ==========================================
// OTHER PAGES
// ==========================================
import ErrorPage from "./components/errorpage";
import Home from "./pages/Home";
import SearchPage from "./pages/Searchpage";
import Profile from "./pages/profile/Profile";
import ProfileAddress from "./pages/profile/ProfileAddress";
import AddAddress from "./pages/profile/addProfileAddress";
import Logout from "./pages/profile/Logout";
import EditAddress from"./pages/profile/Editaddress";
import ChangePassword from"./pages/profile/changepassword";
import CategoryPage from"./pages/categorypage"
import ProductDetails from"./pages/productdetail"
import Cart  from"./pages/cart";
import Wishlist from"./pages/wishlish";
import Checkout from "./pages/checkout";
import OrderSuccess from "./components/OrderSuccess";
import OrderDetails from "./pages/orderdetail";
import ViewDetails from"./pages/viewdetails";
import TrackOrder from "./pages/trackorder";
import OrderResult from "./pages/OrderResult";
import Wallet from"./pages/profile/wallet";
import Coupon from "./pages/profile/coupon";
import ReferralPage from "./pages/profile/referal";

// ==========================================
// AUTH NAVBAR ROUTES
// ==========================================

const authRoutes = [
  "/",
  "/login",
  "/signup",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
];


// ==========================================
// PROFILE LAYOUT
// ==========================================

function ProfileLayout() {

  return (

    <div className="profile-layout">

      <Sidebar />

      <div className="profile-layout-content">

        <Outlet />

      </div>

    </div>
  );
}


// ==========================================
// MAIN LAYOUT
// ==========================================

function Layout({ children }) {

  const location = useLocation();

  const isAuthPage =
    authRoutes.includes(
      location.pathname
    );


  const showFooter =
    location.pathname === "/home" ||
    location.pathname === "/wishlist" ||
    location.pathname === "/cart" ||
    location.pathname === "/about" ||
    location.pathname.startsWith(
      "/profile"
    ) ||
    location.pathname.startsWith(
      "/category/"
    )||
   location.pathname.startsWith("/productdetail/")||
location.pathname.startsWith("/cart/")||
location.pathname.startsWith("/wishlist")||
location.pathname.startsWith("/checkout")||
location.pathname.startsWith("/viewdetails")||
location.pathname.startsWith("/trackorder");
  return (
    <>

      {isAuthPage ? (
        <Navbar />
      ) : (
        <MainNavbar />
      )}


      {children}


      {showFooter && <Footer />}

    </>
  );
}


// ==========================================
// PUBLIC ROUTE
// ==========================================

function PublicRoute({ children }) {

  const token =
    localStorage.getItem("token");


  // Already logged in
  // Don't show Login again

  if (token) {

    return (
      <Navigate
        to="/home"
        replace
      />
    );
  }


  return children;
}


// ==========================================
// PROTECTED ROUTE
// ==========================================

function ProtectedRoute({ children }) {

  const token =
    localStorage.getItem("token");


  // Not logged in

  if (!token) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  return children;
}


// ==========================================
// APP
// ==========================================

function App() {

  return (

    <AuthProvider>

      <BrowserRouter>

        <Layout>

          <Routes>


            {/* ======================================
                LOGIN
            ====================================== */}

            <Route
              path="/"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />


            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />


            {/* ======================================
                SIGNUP
            ====================================== */}

            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />


            {/* ======================================
                SIGNUP / FORGOT OTP
            ====================================== */}

            <Route
              path="/verify-otp"
              element={ <PublicRoute>
                <VerifyOtp /> </PublicRoute>
              }
            />


            {/* ======================================
                FORGOT PASSWORD
            ====================================== */}

            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />


            {/* ======================================
                RESET PASSWORD
            ====================================== */}

            <Route
              path="/reset-password"
              element={  <PublicRoute>
                <ResetPassword /> </PublicRoute>
              }
            />
           <Route
  path="/"
  element={
    <PublicRoute>
      <Login />
    </PublicRoute>
  }
/>

<Route
  path="/login"
  element={
    <PublicRoute>
      <Login />
    </PublicRoute>
  }
/>

<Route
  path="/signup"
  element={
    <PublicRoute>
      <Signup />
    </PublicRoute>
  }
/>

<Route
  path="/verify-otp"
  element={<VerifyOtp />}
/>

<Route
  path="/forgot-password"
  element={<ForgotPassword />}
/>

<Route
  path="/reset-password"
  element={<ResetPassword />}
/>

            {/* ======================================
                HOME
            ====================================== */}

        <Route
  path="/home"
  element={<Home />}
/>
<Route
  path="/search"
  element={<SearchPage />}
/>

            {/* ======================================
                PROFILE
            ====================================== */}

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileLayout />
                </ProtectedRoute>
              }
            >

              <Route
                index
                element={<Profile />}
              />

              <Route
                path="address"
                element={<ProfileAddress />}
              />

              <Route
                path="address/add"
                element={<AddAddress />}
              />
                 <Route
                path="address/edit/:addressId"
                element={<EditAddress />}
              />
              <Route
                path="logout"
                element={<Logout />}
              />
<Route
path="changepassword"
element={<ChangePassword />}

/>

<Route 
path="myorder"
element={
  <OrderDetails />
}
/>

<Route
  path="orders/:orderId/track/:itemId"
  element={<TrackOrder />}
/>
              <Route
                path="wishlist"
                element={
                  <h1>My Wishlist</h1>
                }
              />

              <Route
                path="wallet"
                element={
                  <Wallet/>
                }
              />
<Route
  path="referral"
  element={<ReferralPage />}
/>

              <Route
                path="coupon"
                element={
                  <Coupon />
                }
              />

             
<Route
  path="*"
  element={
    <ErrorPage
      title="Page Not Found"
      message="The page you are looking for doesn't exist."
    />
  }
/>
            </Route>


            {/* ======================================
                ORDER RESULT
                SUCCESS / FAILURE
            ====================================== */}

            <Route
              path="/order-result/:orderId"
              element={
                <ProtectedRoute>
                  <OrderResult />
                </ProtectedRoute>
              }
            />


            {/* ======================================
                VIEW DETAILS
            ====================================== */}

            <Route
              path="/viewdetails"
              element={
                <ProtectedRoute>
                  <ViewDetails />
                </ProtectedRoute>
              }
            />

            {/* ======================================
                OTHER PROTECTED PAGES
            ====================================== */}

            <Route
  path="/category/:type"
  element={
    <ProtectedRoute>
      <CategoryPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/productdetail/:productId"
  element={
    <ProtectedRoute>
      <ProductDetails />
    </ProtectedRoute>
  }
/>


            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                 <Wishlist />
                </ProtectedRoute>
              }
            />


     <Route
  path="/cart"
  element={
    <ProtectedRoute>
      <Cart />
    </ProtectedRoute>
  }
/>

 <Route
  path="/checkout"
  element={
    <ProtectedRoute>
      <Checkout />
    </ProtectedRoute>
  }
/>
<Route
  path="/order-success/:orderId"
  element={
    <ProtectedRoute>
      <OrderSuccess />
    </ProtectedRoute>
  }
/>

            <Route
              path="/about"
              element={
                <ProtectedRoute>
                  <h1>About Us Page</h1>
                </ProtectedRoute>
              }
            />


            {/* ======================================
                UNKNOWN URL
            ====================================== */}

            <Route
              path="*"
              element={
                <ErrorPage
                  title="Page Not Found"
                  message="The page you are looking for doesn't exist."
                />
              }
            />

          </Routes>

        </Layout>

      </BrowserRouter>

    </AuthProvider>
  );
}

export default App;