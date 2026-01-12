import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

const Footer = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <footer className="w-full py-3 md:py-4 bg-white border-t border-gray-300 fixed bottom-0 left-0 right-0 z-50 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 px-3 md:px-4 max-w-full">
        <p className="text-gray-600 text-xs md:text-sm font-medium text-center md:text-left order-2 md:order-1 flex-1">
          © {new Date().getFullYear()} Expense Management. All rights reserved.
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 text-sm md:text-base bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition duration-200 w-full md:w-auto order-1 md:order-2 font-semibold flex-shrink-0 shadow-md hover:shadow-lg"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4 md:w-5 md:h-5" />
          Logout
        </button>
      </div>
    </footer>
  );
};

export default Footer;
