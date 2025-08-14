"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { Moon, Sun, Menu, X, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="text-2xl font-bold text-orange-500 cursor-pointer"
            onClick={() => router.push("/")}
          >
            Vconnect
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              className="text-gray-700 dark:text-gray-300 hover:text-orange-500 font-medium"
              onClick={() => router.push("/")}
            >
              Home
            </button>

            <button
              className="text-gray-700 dark:text-gray-300 hover:text-orange-500 font-medium"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </button>

            <button
              className="text-gray-700 dark:text-gray-300 hover:text-orange-500 font-medium"
              onClick={() => router.push("/events")}
            >
              Events
            </button>
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {user.displayName || user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => router.push("/signup")}
                >
                  Are you a volunteer?
                </Button>
                <Button variant="outline" onClick={() => router.push("/login")}>
                  Log in
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <button
                className="text-left text-gray-700 dark:text-gray-300 hover:text-orange-500"
                onClick={() => {
                  router.push("/events");
                  setMobileMenuOpen(false);
                }}
              >
                Events
              </button>

              {user ? (
                <>
                  <button
                    className="text-left text-gray-700 dark:text-gray-300 hover:text-orange-500"
                    onClick={() => {
                      router.push("/profile");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Profile
                  </button>
                  <button
                    className="text-left text-gray-700 dark:text-gray-300 hover:text-orange-500"
                    onClick={() => {
                      router.push("/dashboard");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Dashboard
                  </button>
                  <button
                    className="text-left text-red-600 hover:text-red-700"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => {
                      router.push("/signup");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Are you a volunteer?
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push("/login");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Log in
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
