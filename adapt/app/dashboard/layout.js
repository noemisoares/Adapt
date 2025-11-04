"use client";

import Sidebar from "../../components/Sidebar/Sidebar";
import { useState } from "react";
import styles from "./page.module.css";

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className={styles["dashboard-wrapper"]}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main
        className={`${styles["dashboard-content"]} ${
          isSidebarOpen ? styles["sidebar-open"] : styles["sidebar-closed"]
        }`}
      >
        {children}
      </main>
    </div>
  );
}
