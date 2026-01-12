import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Header from "./Header";
import Footer from "./Footer";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      {/* Header - Takes space in flow */}
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content area - grows to fill available space between header and footer spacer */}
      <div className="flex flex-1 min-h-0 w-full">
        {/* Desktop Navbar - Always visible on desktop, hidden on mobile */}
        <div className="hidden md:block w-60 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <Navbar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Mobile Sidebar Overlay - Only on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Navbar - Slides in from right on mobile */}
        <div
          className={`fixed top-0 right-0 bottom-0 w-60 z-30 transform transition-transform duration-300 md:hidden bg-white border-l border-gray-200 flex flex-col ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <Navbar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content - Scrollable with footer spacing */}
        <div className="flex-1 flex flex-col min-w-0 w-full overflow-y-auto">
          <main className="flex-1 w-full mx-auto py-4 md:py-6 px-3 md:px-4 max-w-7xl">
            <Outlet />
          </main>
          {/* Footer Spacer - Prevents content from hiding under fixed footer */}
          <div className="h-20 flex-shrink-0" />
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <Footer />
    </div>
  );
};

export default Layout;
