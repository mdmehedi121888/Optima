import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Page from "./pages/Home/page";
import LoginForm from "./pages/Auth/Login";
import Settings from "./pages/Settings/Settings";
import Users from "./components/settings/users/Users";
import Profile from "./components/settings/profile/Profile";
import Operators from "./components/settings/operators/Operators";
import StopReason from "./components/settings/stopReasons/StopReasons";
import SpeedLossReasons from "./components/settings/speedLoss/SpeedLossReasons";
import ScrapReasons from "./components/settings/scrap/ScrapReasons";
import Locations from "./components/settings/locations/Locations";
import Stations from "./components/settings/stations/Stations";
import Products from "./components/settings/products/Products";
import Shifts from "./components/settings/shifts/Shifts";
import Logout from "./pages/Auth/Logout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import NotFound from "./components/common/NotFound";
import Sidebar from "./components/common/Sidebar";
import Layout from "./components/common/Layout";
import { Bounce, ToastContainer } from "react-toastify";
import AdminRoute from "./components/common/AdminRoute";
import NotAuthenticated from "./components/common/NotAuthenticated";
import FactoryOverview from "./pages/FactoryOverview/FactoryOverview";
import Dashboards from "./pages/Dashboards/Dashboards";
import Reports from "./pages/Reports/Reports";
import InchargeRoute from "./components/common/InchargeRoute";


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/not-authenticated" element={<NotAuthenticated />} />

          {/* ✅ Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Page />} />
            <Route element={<Layout />}>
            <Route path="/settings/profile" element={<Profile />} />

                  <Route element={<InchargeRoute />}>
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/settings/users" element={<Users />} />
                    <Route path="/settings/operators" element={<Operators />} />
                    <Route path="/settings/stop-reasons" element={<StopReason />} />
                    <Route path="/settings/speed-loss-reasons" element={<SpeedLossReasons />} />
                    <Route path="/settings/scrap-reasons" element={<ScrapReasons />} />
                    <Route path="/settings/locations" element={<Locations />} />
                    <Route path="/settings/stations" element={<Stations />} />
                    <Route path="/settings/products" element={<Products />} />
                    <Route path="/settings/shifts" element={<Shifts />} />
                    <Route path="/factory-overview" element={<FactoryOverview />} />
                    <Route path="/dashboards" element={<Dashboards />} />
                    <Route path="/reports" element={<Reports />} />
                </Route>

            </Route>
          </Route>

          {/* ✅ Catch-All Route for 404 Pages */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer
position="top-right"
autoClose={2000}
hideProgressBar={false}
newestOnTop={false}
closeOnClick={false}
rtl={false}
pauseOnFocusLoss
draggable
pauseOnHover
theme="colored"
transition={Bounce}
/>
    </div>
  );
}

export default App;
