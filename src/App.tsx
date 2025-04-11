import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Page from "./page";
import LoginForm from "./Login";
import Settings from "./Settings";
import Users from "./components/Users";
import Profile from "./components/Profile";
import Operators from "./components/Operators";
import StopReason from "./components/StopReason";
import SpeedLossReasons from "./components/SpeedLossReasons";
import ScrapReasons from "./components/ScrapReasons";
import Locations from "./components/Locations";
import Stations from "./components/Stations";
import Products from "./components/Products";
import Shifts from "./components/Shifts";
import Logout from "./components/Logout";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./components/NotFound";
import Sidebar from "./components/Sidebar";
import Layout from "./components/Layout";


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/logout" element={<Logout />} />

          {/* ✅ Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Page />} />
            <Route path="/settings" element={<Settings />} />
            <Route element={<Layout />}>
            <Route path="/settings/users" element={<Users />} />
            <Route path="/settings/profile" element={<Profile />} />
            <Route path="/settings/operators" element={<Operators />} />
            <Route path="/settings/stop-reasons" element={<StopReason />} />
            <Route path="/settings/speed-loss-reasons" element={<SpeedLossReasons />} />
            <Route path="/settings/scrap-reasons" element={<ScrapReasons />} />
            <Route path="/settings/locations" element={<Locations />} />
            <Route path="/settings/stations" element={<Stations />} />
            <Route path="/settings/products" element={<Products />} />
            <Route path="/settings/shifts" element={<Shifts />} />
            </Route>
            </Route>

          {/* ✅ Catch-All Route for 404 Pages */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
