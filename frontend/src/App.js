import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserLogin from "./pages/auth/login";
import { ProtectedRoute, PublicRoute } from "./protected";
import HomePage from "./components/home-page";
import UserDetails from "./components/user-details";
import Status from "./pages/status/status";
import Setting from "./pages/settings/settings";
import { useUserStore } from "./store/use-user-store";
import { disconnectSocket, initializeSocket } from "./services/chat-service";

function App() {
  const {user} = useUserStore()

  useEffect(()=> {
    if(user?._id){
      const socket = initializeSocket()
    }

    return () => {
      disconnectSocket()
    }
  },[user])

  
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/user-login" element={<UserLogin />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/user-profile" element={<UserDetails />} />
            <Route path="/status" element={<Status />} />
            <Route path="/setting" element={<Setting />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
