import React from "react";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { Bars3Icon } from "@heroicons/react/24/outline";

const Header = ({ onMenuClick }) => {
  return (
    <header className="bg-blue-600 shadow-md relative z-20">
      <div className="flex items-center justify-between h-16 px-3 sm:px-4 md:px-6">
        {/* Left side - Logo and Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <SparklesIcon className="w-5 sm:w-6 text-white flex-shrink-0" />
          <h1 className="text-base sm:text-lg md:text-xl font-semibold text-white truncate">
            Expense Management
          </h1>
        </div>

        {/* Right side - Menu button (mobile only) */}
        <button
          className="md:hidden p-2 -mr-2 text-white hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white transition"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;
