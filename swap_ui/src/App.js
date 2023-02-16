import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Swap from "./public/swap";
export default function App() {
  return (
    <BrowserRouter>
    <div className="max-h-screen items-center">
      <Routes>
          <Route path="/" index element={<Swap />} />
      </Routes>
</div>
    </BrowserRouter>
  );
}
