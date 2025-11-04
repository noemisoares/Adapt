"use client";

import Sidebar from "../../components/Sidebar/Sidebar";
import { useState } from "react";
import "./dashboardLayout.css";

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="dashboard-wrapper">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main
        className={`dashboard-content ${
          isSidebarOpen ? "sidebar-open" : "sidebar-closed"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
