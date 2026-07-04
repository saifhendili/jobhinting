"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/hooks/use-auth";
import { useTheme } from "@/components/providers/theme-provider";
import styles from "./sidebar.module.scss";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/companies", label: "Companies", icon: "🏢" },
  { href: "/jobs", label: "Jobs", icon: "💼" },
  { href: "/search", label: "Search", icon: "🔍" },
  { href: "/saved-searches", label: "Saved Searches", icon: "🔖" },
];

const adminItems = [
  { href: "/admin", label: "Admin Panel", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const items = user?.role === "ADMIN" ? [...navItems, ...adminItems] : navItems;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>🌍</span>
        <span className={styles.logoText}>Remote Intelligence</span>
      </div>

      <nav className={styles.nav}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${isActive(item.href) ? styles.active : ""}`}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.footer}>
        <button onClick={toggleTheme} className={styles.themeToggle}>
          <span className={styles.icon}>{theme === "dark" ? "☀️" : "🌙"}</span>
          <span className={styles.label}>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>
    </aside>
  );
}
