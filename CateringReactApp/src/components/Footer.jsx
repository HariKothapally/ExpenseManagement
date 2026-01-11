import React from "react";

const Footer = () => {
  return (
    <footer className="w-full py-4 bg-white border-t border-gray-200 mt-auto relative z-10">
      <p className="text-center text-gray-600 text-sm font-medium">
        © {new Date().getFullYear()} Catering Expense Management. All rights
        reserved.
      </p>
    </footer>
  );
};

export default Footer;
