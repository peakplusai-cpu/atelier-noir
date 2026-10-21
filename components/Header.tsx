"use client";

import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <Link href="/" className="wordmark" onClick={() => setOpen(false)}>
          <span className="wordmark-zh">Car House</span>
          <span className="wordmark-en">TPE</span>
        </Link>
        <nav className="nav">
          <Link href="/#collection">庫存</Link>
          <Link href="/inquiry">預約</Link>
          <Link href="/admin">員工</Link>
        </nav>
        <button className="nav-toggle" type="button" onClick={() => setOpen(true)}>
          Menu
        </button>
      </header>
      <div className={`mobile-nav${open ? " open" : ""}`}>
        <button className="nav-toggle" type="button" onClick={() => setOpen(false)}>
          Close
        </button>
        <Link href="/" onClick={() => setOpen(false)}>
          首頁
        </Link>
        <Link href="/#collection" onClick={() => setOpen(false)}>
          庫存
        </Link>
        <Link href="/inquiry" onClick={() => setOpen(false)}>
          預約
        </Link>
        <Link href="/admin" onClick={() => setOpen(false)}>
          員工
        </Link>
      </div>
    </>
  );
}
