
"use client";
/**
 * @fileOverview This file defines the global Header component for the application.
 * It includes the main logo, desktop navigation, mobile navigation (sheet),
 * and user authentication controls (login button or user profile dropdown).
 */

import { cn } from "@/lib/utils";
import { BrainCircuit, Menu, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { Skeleton } from "../ui/skeleton";

/**
 * @component Header
 * @description A responsive header component that adapts to different screen sizes
 * and authentication states.
 */
export function Header() {
  const pathname = usePathname();
  const { user, logout, loading: authLoading } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Navigation items to be displayed in both desktop and mobile menus.
  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/quiz", label: "New Quiz" },
    { href: "/chat", label: "Chat" },
    { href: "/papers", label: "Papers" },
    { href: "/history", label: "History" },
  ];

  // Logic to hide main navigation on auth pages.
  const showNav = !pathname.includes("/login") && !pathname.includes("/register");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-custom-sm">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        {/* Left Side: Mobile Menu and Desktop Nav */}
        <div className="flex flex-1 justify-start">
          {showNav && (
            <>
              {/* Mobile Navigation (Sheet) */}
              <div className="flex items-center lg:hidden">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-full max-w-xs">
                    <SheetHeader className="mb-6">
                      <SheetTitle asChild>
                        <Link
                          href="/"
                          className="flex items-center space-x-2"
                          onClick={() => setIsSheetOpen(false)}
                        >
                          <BrainCircuit className="h-6 w-6 text-primary" />
                          <span className="font-bold font-headline">
                            Exam AI Prep
                          </span>
                        </Link>
                      </SheetTitle>
                      <SheetDescription className="sr-only">
                        Main navigation menu.
                      </SheetDescription>
                    </SheetHeader>
                    <nav className="flex flex-col gap-4">
                      {navItems.map((item) => (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "text-lg font-medium transition-colors hover:text-foreground/80",
                              pathname === item.href
                                ? "text-foreground"
                                : "text-foreground/60"
                            )}
                          >
                            {item.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden items-center gap-1 text-sm lg:flex lg:gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative px-3 py-2 rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary",
                      pathname === item.href
                        ? "text-primary bg-primary/10 font-medium"
                        : "text-foreground/70 hover:text-primary"
                    )}
                  >
                    {item.label}
                    {pathname === item.href && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
                    )}
                  </Link>
                ))}
              </nav>
            </>
          )}
        </div>

        {/* Center: Logo */}
        <div className="flex flex-1 justify-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <BrainCircuit className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
              <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="font-bold font-headline text-lg sm:inline-block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Exam AI Prep
            </span>
          </Link>
        </div>

        {/* Right side: User authentication controls */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          {authLoading ? (
            // Show skeleton while checking auth status.
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : user ? (
            // Show user profile dropdown if logged in.
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  className="relative h-9 w-9 rounded-full hover:scale-105 transition-transform shadow-custom-sm"
                >
                  <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                    <AvatarImage src={user.profilePicture || undefined} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground font-semibold">
                      {user.name?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Show login button if not logged in.
            showNav && (
              <Button asChild variant="outline" className="hidden sm:flex hover:scale-105 transition-transform shadow-custom-sm">
                <Link href="/login">Login</Link>
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
