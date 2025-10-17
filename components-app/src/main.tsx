import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppShell from "./routes/AppShell";
import Dashboard from "./routes/Dashboard";
import Journal from "./routes/Journal";
import Insights from "./routes/Insights";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}> 
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/insights" element={<Insights />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
