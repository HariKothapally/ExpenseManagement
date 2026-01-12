import React from "react";
import { useQuery } from "react-query";
import { BanknotesIcon } from "@heroicons/react/24/solid";
import { ShoppingCartIcon } from "@heroicons/react/24/solid";
import { ReceiptRefundIcon } from "@heroicons/react/24/solid";
import { DocumentTextIcon } from "@heroicons/react/24/solid";

import { api } from "../services/api";

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    success: "bg-green-50 text-green-600",
    info: "bg-blue-50 text-blue-600",
    warning: "bg-amber-50 text-amber-600",
  };

  const valueColorClasses = {
    success: "text-green-600",
    info: "text-blue-600",
    warning: "text-amber-600",
  };

  return (
    <div className="h-full bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <h3 className="ml-4 text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <p className={`text-3xl font-bold ${valueColorClasses[color]}`}>
        {value}
      </p>
    </div>
  );
};

const Dashboard = () => {
  const {
    data: expenses,
    isLoading,
    error,
  } = useQuery("expenses", async () => {
    const response = await api.get("/api/bills");
    return response.data;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        Error loading dashboard data: {error.message}
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
  const averageExpense = totalExpenses / (expenses.length || 1);
  const recentExpenses = expenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const monthlyTotals = expenses.reduce((acc, exp) => {
    const month = new Date(exp.date).getMonth();
    acc[month] = (acc[month] || 0) + exp.totalAmount;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sticky Title */}
      <div className="sticky top-0 bg-white z-10 pb-4 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
      </div>

      {/* Content - No scrolling, fits nicely */}
      <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
          <StatCard
            title="Total Expenses"
            value={`₹${totalExpenses.toFixed(2)}`}
            icon={<BanknotesIcon className="w-6 h-6" />}
            color="success"
          />
          <StatCard
            title="Average Expense"
            value={`₹${averageExpense.toFixed(2)}`}
            icon={<ShoppingCartIcon className="w-6 h-6" />}
            color="info"
          />
          <StatCard
            title="Total Bills"
            value={expenses.length}
            icon={<DocumentTextIcon className="w-6 h-6" />}
            color="warning"
          />
        </div>

        {/* Charts and Transactions */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 flex-1 overflow-hidden min-h-0">
          {/* Monthly Expenses Chart */}
          <div className="md:col-span-4 bg-white rounded-lg shadow p-6 flex flex-col overflow-hidden">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 flex-shrink-0">
              Monthly Expenses
            </h2>
            <div className="flex-1 flex items-end justify-around gap-2 min-h-0">
              {Object.entries(monthlyTotals).map(([month, total]) => (
                <div key={month} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full max-w-10 bg-blue-600 rounded-t"
                    style={{
                      height: `${(total / totalExpenses) * 200}px`,
                      minHeight: "20px",
                    }}
                  />
                  <p className="text-xs text-gray-600 mt-2 truncate">
                    {new Date(2024, month).toLocaleString("default", {
                      month: "short",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="md:col-span-3 bg-white rounded-lg shadow p-6 flex flex-col overflow-hidden">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 flex-shrink-0">
              Recent Transactions
            </h2>
            <div className="flex-1 overflow-y-auto space-y-0 min-h-0">
              {recentExpenses.map((expense, index) => (
                <React.Fragment key={expense.id}>
                  <div className="py-3 flex justify-between items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {expense.vendor}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-semibold text-green-600 flex-shrink-0">
                      ₹{expense.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  {index < recentExpenses.length - 1 && (
                    <div className="border-t border-gray-200"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
