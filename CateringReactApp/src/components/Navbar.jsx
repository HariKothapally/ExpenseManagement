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
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";

const Navbar = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { text: "Dashboard", path: "/dashboard", icon: RectangleStackIcon },
    { text: "Recent", path: "/recent", icon: ClockIcon },
    { text: "Expenditures", path: "/expenditures", icon: ReceiptPercentIcon },
    { text: "Receipts", path: "/receipts", icon: DocumentTextIcon },
    { text: "Upload", path: "/upload", icon: ArrowUpTrayIcon },
    { text: "Downloads", path: "/downloads", icon: ArrowDownTrayIcon },
  ];

  return (
    <nav className="w-60 bg-white border-r border-gray-200 flex flex-col h-full">
      <ul className="flex-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <li key={item.text}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-blue-700"
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? "text-blue-700" : "text-gray-500"
                  }`}
                />
                <span
                  className={`text-sm ${isActive ? "font-semibold" : "font-normal"}`}
                >
                  {item.text}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:border-red-800 hover:bg-red-50 transition-colors text-sm font-medium"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
