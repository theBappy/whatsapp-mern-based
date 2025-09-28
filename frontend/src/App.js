import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import UserLogin from "./pages/auth/login";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/user-login" element={<UserLogin />} />
      </Routes>
    </Router>
  )
}

export default App;
