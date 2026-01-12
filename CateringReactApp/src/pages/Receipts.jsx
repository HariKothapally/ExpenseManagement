import React from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";

const Receipts = () => {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <SparklesIcon className="w-20 h-20 text-blue-600 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Coming Soon</h1>
      <p className="text-gray-600 mb-2">
        We're working on bringing you a better way to manage your receipts.
      </p>
      <p className="text-gray-600 text-sm">
        This feature will be available in the next update.
      </p>
    </div>
  );
};

export default Receipts;
