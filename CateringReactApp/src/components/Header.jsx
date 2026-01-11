import React from "react";
import { SparklesIcon } from "@heroicons/react/24/solid";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-blue-600 z-50 shadow-md">
      <div className="flex items-center h-16 px-6">
        <SparklesIcon className="w-6 h-6 text-white mr-3" />
        <h1 className="text-xl font-semibold text-white flex-1">
          Catering Expense Management
        </h1>
      </div>
    </header>
  );
};

export default Header;
