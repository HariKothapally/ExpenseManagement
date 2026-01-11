import React, { useState } from "react";
import { useQuery } from "react-query";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import dayjs from "dayjs";
import { api } from "../services/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const Downloads = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filterType, setFilterType] = useState("custom");
  const [loading, setLoading] = useState(false);

  const { data: expenses, isLoading: fetchingData } = useQuery(
    "expenses",
    async () => {
      const response = await api.get("/api/bills");
      return response.data;
    },
  );

  const filterExpenses = (expenses) => {
    if (!expenses) return [];

    return expenses.filter((expense) => {
      const expenseDate = dayjs(expense.date);

      if (filterType === "custom") {
        if (!startDate || !endDate) return false;
        return expenseDate.isAfter(startDate) && expenseDate.isBefore(endDate);
      }

      const now = dayjs();
      switch (filterType) {
        case "thisMonth":
          return (
            expenseDate.isAfter(now.startOf("month")) &&
            expenseDate.isBefore(now.endOf("month"))
          );
        case "lastMonth":
          return (
            expenseDate.isAfter(now.subtract(1, "month").startOf("month")) &&
            expenseDate.isBefore(now.subtract(1, "month").endOf("month"))
          );
        case "thisYear":
          return (
            expenseDate.isAfter(now.startOf("year")) &&
            expenseDate.isBefore(now.endOf("year"))
          );
        case "lastYear":
          return (
            expenseDate.isAfter(now.subtract(1, "year").startOf("year")) &&
            expenseDate.isBefore(now.endOf("year"))
          );
        default:
          return true;
      }
    });
  };

  const handleDownload = () => {
    setLoading(true);
    try {
      const filteredExpenses = filterExpenses(expenses);

      if (filteredExpenses.length === 0) {
        toast.error("No expenses found for the selected period");
        return;
      }

      // Prepare data for Excel with inline items
      const excelData = [];
      filteredExpenses.forEach((expense) => {
        // Add main expense row
        excelData.push({
          Date: new Date(expense.date).toLocaleDateString(),
          Vendor: expense.vendor,
          "Total Amount": expense.totalAmount.toFixed(2),
          "Payment Method": expense.paymentMethod,
          "Items Count": expense.lineItems?.length || 0,
          "Item Name": "",
          Quantity: "",
          "Unit Price": "",
          "Item Total": "",
        });

        // Add line items
        expense.lineItems?.forEach((item) => {
          excelData.push({
            Date: "",
            Vendor: "",
            "Total Amount": "",
            "Payment Method": "",
            "Items Count": "",
            "Item Name": item.itemName,
            Quantity: item.quantity,
            "Unit Price": item.unitPrice.toFixed(2),
            "Item Total": item.totalPrice.toFixed(2),
          });
        });

        // Add empty row for separation
        excelData.push({
          Date: "",
          Vendor: "",
          "Total Amount": "",
          "Payment Method": "",
          "Items Count": "",
          "Item Name": "",
          Quantity: "",
          "Unit Price": "",
          "Item Total": "",
        });
      });

      // Create worksheet with styling
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const columnWidths = [
        { wch: 12 }, // Date
        { wch: 20 }, // Vendor
        { wch: 15 }, // Total Amount
        { wch: 15 }, // Payment Method
        { wch: 10 }, // Items Count
        { wch: 30 }, // Item Name
        { wch: 10 }, // Quantity
        { wch: 12 }, // Unit Price
        { wch: 12 }, // Item Total
      ];
      ws["!cols"] = columnWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Expenses");

      // Generate Excel file
      const fileName = `expenses_${filterType}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success("File downloaded successfully");
    } catch (error) {
      toast.error("Error creating Excel file");
      console.error("Download error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterTypeChange = (e) => {
    const type = e.target.value;
    setFilterType(type);

    const now = dayjs();
    if (type === "thisMonth") {
      setStartDate(now.startOf("month"));
      setEndDate(now.endOf("month"));
    } else if (type === "lastMonth") {
      setStartDate(now.subtract(1, "month").startOf("month"));
      setEndDate(now.subtract(1, "month").endOf("month"));
    } else if (type === "thisYear") {
      setStartDate(now.startOf("year"));
      setEndDate(now.endOf("year"));
    } else if (type === "lastYear") {
      setStartDate(now.subtract(1, "year").startOf("year"));
      setEndDate(now.endOf("year"));
    } else {
      setStartDate(null);
      setEndDate(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Download Expenses
      </h1>

      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Type
            </label>
            <select
              value={filterType}
              onChange={handleFilterTypeChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="custom">Custom Date Range</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
              <option value="lastYear">Last Year</option>
            </select>
          </div>

          {filterType === "custom" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate ? startDate.format("YYYY-MM-DD") : ""}
                  onChange={(e) =>
                    setStartDate(e.target.value ? dayjs(e.target.value) : null)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate ? endDate.format("YYYY-MM-DD") : ""}
                  onChange={(e) =>
                    setEndDate(e.target.value ? dayjs(e.target.value) : null)
                  }
                  min={startDate ? startDate.format("YYYY-MM-DD") : ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            <button
              onClick={handleDownload}
              disabled={
                loading ||
                fetchingData ||
                (filterType === "custom" && (!startDate || !endDate))
              }
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading || fetchingData ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Download Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Downloads;
