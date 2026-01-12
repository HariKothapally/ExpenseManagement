import React, { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { PencilIcon } from "@heroicons/react/24/outline";
import { TrashIcon } from "@heroicons/react/24/outline";
import { api } from "../services/api";
import ExpenseEditDialog from "../components/ExpenseEditDialog";
import toast from "react-hot-toast";

const Recent = () => {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const {
    data: expenses = [],
    isLoading,
    error,
  } = useQuery("expenses", async () => {
    const response = await api.get("/api/bills");
    return response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, expenses.length - 1));
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/bills/${selectedExpense.id}`);
      setDeleteDialogOpen(false);
      toast.success("Expense deleted successfully");
      queryClient.invalidateQueries("expenses");
      if (currentIndex >= expenses.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    } catch (error) {
      toast.error("Error deleting expense");
      console.error("Error:", error);
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedExpense) => {
    try {
      await api.put(`/api/bills/${updatedExpense.id}`, updatedExpense);
      queryClient.invalidateQueries("expenses");
      setEditDialogOpen(false);
      toast.success("Expense updated successfully");
    } catch (error) {
      toast.error("Error updating expense");
      console.error("Error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        {error.message}
      </div>
    );
  }

  if (!expenses.length) {
    return (
      <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
        No recent expenses found
      </div>
    );
  }

  const currentExpense = expenses[currentIndex];

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white z-10 pb-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Recent Expenses
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <span className="text-sm text-gray-600 mx-2 min-w-max whitespace-nowrap">
              {currentIndex + 1} of {expenses.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentIndex === expenses.length - 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto mt-6">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex justify-end gap-2 mb-4">
              <button
                onClick={() => handleEdit(currentExpense)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setSelectedExpense(currentExpense);
                  setDeleteDialogOpen(true);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-600">
                {currentExpense.vendor}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-gray-200">
                <DetailItem
                  label="Date"
                  value={new Date(currentExpense.date).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                />
                <DetailItem
                  label="Payment Method"
                  value={currentExpense.paymentMethod}
                />
              </div>

              <DetailItem
                label="Total Amount"
                value={`₹${Number(currentExpense.totalAmount).toFixed(2)}`}
                large
              />

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Line Items
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {currentExpense.lineItems.map((item, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-start py-3 ${
                        index !== currentExpense.lineItems.length - 1
                          ? "border-b border-gray-200"
                          : ""
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.itemName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {Number(item.quantity).toString()} ×
                          </span>
                          <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full border border-blue-300">
                            ₹{Number(item.unitPrice).toString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-blue-600">
                        ₹{item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Delete
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this expense from{" "}
              <strong>{selectedExpense?.vendor}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ExpenseEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        expense={selectedExpense}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

const DetailItem = ({ label, value, large }) => (
  <div>
    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    <p
      className={`text-gray-900 ${large ? "text-2xl font-bold text-blue-600" : "text-lg font-semibold"}`}
    >
      {value}
    </p>
  </div>
);

export default Recent;
