import React, { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import {
  TrashIcon,
  PencilIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { api } from "../services/api";
import ExpenseEditDialog from "../components/ExpenseEditDialog";
import toast from "react-hot-toast";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const formattedDate = date.toLocaleDateString();
  return `${weekday}, ${formattedDate}`;
};

const ExpenseRow = ({ expense, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className="border-b hover:bg-gray-50">
        <td className="px-4 py-3">
          <button
            onClick={() => setOpen(!open)}
            className="text-gray-600 hover:text-gray-800 p-1"
          >
            {open ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </button>
        </td>
        <td className="px-4 py-3 text-gray-900">{expense.vendor}</td>
        <td className="px-4 py-3 text-gray-900">{formatDate(expense.date)}</td>
        <td className="px-4 py-3 text-gray-900">
          ₹{expense.totalAmount.toFixed(2)}
        </td>
        <td className="px-4 py-3 text-gray-900">{expense.paymentMethod}</td>
        <td className="px-4 py-3">
          <button
            onClick={() => onEdit(expense)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded inline-mr-2"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(expense)}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan="6" className="px-4 py-4 bg-gray-50 border-b">
            <div className="my-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Line Items
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">
                        Item Name
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">
                        Quantity
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">
                        Unit Price
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">
                        Total Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expense.lineItems.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2 text-gray-700">
                          {item.itemName}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          ₹{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          ₹{item.totalPrice.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const Expenditures = () => {
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const {
    data: expenses,
    isLoading,
    error,
  } = useQuery("expenses", async () => {
    const response = await api.get("/api/bills");
    return response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setEditDialogOpen(true);
  };

  const handleDelete = (expense) => {
    setSelectedExpense(expense);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/api/bills/${selectedExpense.id}`);
      queryClient.invalidateQueries("expenses");
      setDeleteDialogOpen(false);
      toast.success("Expense deleted successfully");
    } catch (error) {
      toast.error("Error deleting expense");
      console.error("Delete error:", error);
    }
  };

  const handleSaveEdit = async (updatedExpense) => {
    try {
      await api.put(`/api/bills/${updatedExpense.id}`, updatedExpense);
      queryClient.invalidateQueries("expenses");
      setEditDialogOpen(false);
      toast.success("Expense updated successfully");
    } catch (error) {
      toast.error("Error updating expense");
      console.error("Update error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        Error loading expenditures: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Title */}
      <div className="sticky top-0 bg-white z-10 pb-4 border-b border-gray-200">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Expenditures
        </h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden mt-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-10"></th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Vendor
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Total Amount
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Payment Method
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses?.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ExpenseEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        expense={selectedExpense}
        onSave={handleSaveEdit}
      />

      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
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
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenditures;
