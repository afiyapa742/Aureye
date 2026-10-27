import Login from "./pages/login";
import Users from "./pages/dashboard";
import Category from "./pages/category";
import Adminlayout from "./layout/adminlayout";
import ProtectedRoute from "./combonent/ProtectedRoute";
import EditCategory from "./pages/editcategory";
import Material from "./pages/meterial";
import AddMeterial from "./pages/Add Material";
import EditMeterial from "./pages/editmeterial";
import Product from "./pages/product";
import AddProduct from "./pages/Addproduct";
import Addcategory from "./pages/categoryAdd";
import EditProduct from "./pages/editproduct";
import AdminOrders from "./pages/order";
import OrderDetail from "./pages/orderdetail";
import AdminViewOrder from "./pages/vieworder";
import Inventory from "./pages/inventory";
import ReturnOrders from "./pages/returnorder";
import Coupon from "./pages/coupon";
import AddCoupon from "./pages/addcoupon";
import EditCoupon from "./pages/editcoupon";
import Offer from "./pages/offer";
import AddOffer from "./pages/addoffer";
import EditOffer from "./pages/editoffer"
import SalesReport from"./pages/salesreport"
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* PROTECTED ADMIN */}
        <Route element={<ProtectedRoute />}>

          <Route
            path="/admin"
            element={<Adminlayout />}
          >

            {/* /admin */}
            <Route
              index
              element={<Users />}
            />

            {/* /admin/users */}
            <Route
              path="users"
              element={<Users />}
            />

            {/* /admin/categories */}
            <Route
              path="categories"
              element={<Category />}
            />

            {/* /admin/categories/add */}
            <Route
              path="categories/add"
              element={<Addcategory />}
            />

            {/* /admin/material */}
            <Route
              path="material"
              element={<Material />}
            />

            {/* /admin/material/add */}
            <Route
              path="material/add"
              element={<AddMeterial />}
            />

            {/* /admin/material/edit/:id */}
            <Route
              path="material/edit/:id"
              element={<EditMeterial />}
            />

            {/* /admin/category/edit/:id */}
            <Route
              path="category/edit/:id"
              element={<EditCategory />}
            />

            {/* /admin/product */}
            <Route
              path="product"
              element={<Product />}
            />

            {/* /admin/product/add */}
            <Route
              path="product/add"
              element={<AddProduct />}
            />

            {/* /admin/product/edit/:id */}
            <Route
              path="product/edit/:id"
              element={<EditProduct />}
            />

            {/* /admin/orders */}
            <Route
              path="/admin/orders"
              element={<AdminOrders />}
            />

            {/* /admin/orders/:orderId */}
            <Route
              path="/admin/orders/:orderId"
              element={<OrderDetail />}
            />

            {/* /admin/orders/vieworder/:orderId */}
            <Route
              path="/admin/orders/vieworder/:orderId"
              element={<AdminViewOrder />}
            />

            {/* /admin/coupon */}
            <Route
              path="/admin/coupon"
              element={<Coupon />}
            />

            {/* /admin/coupon/add */}
            <Route
              path="/admin/coupon/add"
              element={<AddCoupon />}
            />

            {/* /admin/coupon/edit/:id */}
            <Route
              path="/admin/coupon/edit/:id"
              element={<EditCoupon />}
            />

            {/* /admin/offer */}
            <Route
              path="/admin/offer"
              element={<Offer />}
            />
            <Route 
            path="/admin/offer/add"
            element={ <AddOffer />}
            />
           <Route
  path="/admin/offer/edit/:offerId"
  element={<EditOffer />}
/>
            {/* /admin/inventory */}
            <Route
              path="/admin/inventory"
              element={<Inventory />}
            />

            {/* /admin/returnorder */}
            <Route
              path="/admin/returnorder"
              element={<ReturnOrders />}
            />

{/* /admin/sales-report */}
<Route
  path="sales-report"
  element={<SalesReport />}
/>

          </Route>

        </Route>

        {/* DEFAULT */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;