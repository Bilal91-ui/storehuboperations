import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Home from "./home"

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Home />} />
        <Route path="/signup" element={<Home />} />
        <Route path="/checkout" element={<Home />} />
        <Route path="/track-order" element={<Home />} />
        <Route path="/orders" element={<Home />} />
        <Route path="/order/:orderId" element={<Home />} />
        <Route path="/account" element={<Home />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
