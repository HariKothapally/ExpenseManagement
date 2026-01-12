import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  RectangleStackIcon,
  ClockIcon,
  ReceiptPercentIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Navbar = ({ onClose }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const handleNavigate = () => {
    if (onClose) {
      onClose();
    }
  };

  const menuItems = [
    { text: "Dashboard", path: "/dashboard", icon: RectangleStackIcon },
    { text: "Recent", path: "/recent", icon: ClockIcon },
    { text: "Expenditures", path: "/expenditures", icon: ReceiptPercentIcon },
    { text: "Receipts", path: "/receipts", icon: DocumentTextIcon },
    { text: "Upload", path: "/upload", icon: ArrowUpTrayIcon },
    { text: "Downloads", path: "/downloads", icon: ArrowDownTrayIcon },
  ];

  return (
    <nav className="w-full bg-white flex flex-col h-full">
      {/* Mobile Close Button - Hidden on desktop */}
      <div className="md:hidden flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
        <button
          onClick={onClose}
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none transition rounded"
          aria-label="Close menu"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Menu Items Container - Scrollable only if needed */}
      <ul className="flex-1 overflow-y-auto min-h-0">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <li key={item.text}>
              <Link
                to={item.path}
                onClick={handleNavigate}
                className={`flex items-center gap-3 px-3 md:px-4 py-3 transition-all border-l-4 md:border-l-4 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-700 border-transparent hover:border-blue-300"
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive ? "text-blue-700" : "text-gray-500"
                  }`}
                />
                <span className="text-sm">{item.text}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop-only footer section */}
      <div className="hidden md:block border-t border-gray-200 p-4 text-center flex-shrink-0">
        <p className="text-xs text-gray-500">Logout available in footer</p>
      </div>
    </nav>
  );
};

export default Navbar;
