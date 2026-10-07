"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppNav() {
  const pathname = usePathname();
  const links = [{ href: "/home", label: "Home" }, { href: "/data", label: "Data" }, { href: "/about", label: "About" }];
  return <header className="site-header"><div className="nav-shell">
    <Link className="brand" href="/home">GCScrape</Link>
    <nav className="site-nav" aria-label="Main navigation">{links.map(link =>
      <Link key={link.href} className={"nav-link" + (pathname === link.href ? " active" : "")} href={link.href}>{link.label}</Link>
    )}</nav>
    <a className="nav-connect" href="/api/auth/login">Reconnect</a>
  </div></header>;
}
