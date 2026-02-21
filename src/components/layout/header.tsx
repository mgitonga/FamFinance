"use client";

import Link from "next/link";
import { Bell, User, LogOut, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface HeaderProps {
  userName?: string;
  onMenuClick?: () => void;
}

export function Header({ userName = "User", onMenuClick }: HeaderProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [notificationCount] = useState(3); // TODO: Get from notifications API

  useEffect(() => {
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>

      {/* Logo - Mobile only */}
      <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
        <span className="text-xl">💰</span>
        <span className="font-bold text-primary">FamFin</span>
      </Link>

      {/* Spacer */}
      <div className="hidden lg:block" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs text-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </Link>

        {/* User menu */}
        <div className="flex items-center gap-2 border-l border-border pl-2">
          <Link href="/settings/profile">
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{userName}</span>
            </Button>
          </Link>
          
          <form action="/api/auth/logout" method="POST">
            <Button variant="ghost" size="icon" type="submit" title="Log out">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Log out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
