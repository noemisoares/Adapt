"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Parse from "../../app/back4app/parseConfig";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus,
  FolderOpen,
  Lightbulb,
  MessageSquare,
  LogOut,
} from "lucide-react";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = Parse.User.current();
    setUser(currentUser);
  }, []);

  const handleLogout = async () => {
    await Parse.User.logOut();
    window.location.href = "/";
  };

  const links = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      href: "/dashboard/upload",
      label: "Criar nova prova adaptada",
      icon: <FilePlus size={18} />,
    },
    {
      href: "/dashboard/salvas",
      label: "Provas Salvas",
      icon: <FolderOpen size={18} />,
    },
    {
      href: "/dashboard/boas-praticas",
      label: "Boas Práticas",
      icon: <Lightbulb size={18} />,
    },
    {
      href: "/dashboard/chatbot",
      label: "ChatBot",
      icon: <MessageSquare size={18} />,
    },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles["sidebar-logo"]}>
        <h2>Adapt</h2>
      </div>

      <nav className={styles["sidebar-links"]}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles["sidebar-item"]} ${
              pathname === link.href ? styles.active : ""
            }`}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles["sidebar-footer"]}>
        <div className={styles["user-info"]}>
          <div className={styles["user-avatar"]}>
            {user ? user.get("username").charAt(0).toUpperCase() : "?"}
          </div>
          <span>{user ? user.get("username") : "Usuário"}</span>
        </div>

        <button onClick={handleLogout} className={styles["logout-button"]}>
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
