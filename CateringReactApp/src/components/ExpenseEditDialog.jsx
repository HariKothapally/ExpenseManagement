import React, { useState, useEffect } from "react";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

const ExpenseEditDialog = ({ open, onClose, expense, onSave }) => {
  const [formData, setFormData] = useState({
    vendor: "",
    date: "",
    paymentMethod: "",
    totalAmount: 0,
    lineItems: [],
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        vendor: expense.vendor || "",
        date: expense.date
          ? new Date(expense.date).toISOString().split("T")[0]
          : "",
        paymentMethod: expense.paymentMethod || "",
        totalAmount: expense.totalAmount || 0,
        lineItems:
          expense.lineItems?.map((item) => ({
            itemName: item.itemName || "",
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            totalPrice: Number(item.totalPrice) || 0,
          })) || [],
      });
    }
  }, [expense]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const updateTotalAmount = (lineItems) => {
    const total = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    setFormData((prev) => ({ ...prev, totalAmount: total }));
  };

  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index] = {
      ...newLineItems[index],
      [field]:
        field === "quantity" || field === "unitPrice"
          ? parseFloat(value)
          : value,
      totalPrice:
        field === "quantity"
          ? value * newLineItems[index].unitPrice
          : field === "unitPrice"
            ? value * newLineItems[index].quantity
            : newLineItems[index].totalPrice,
    };
    setFormData((prev) => ({ ...prev, lineItems: newLineItems }));
    updateTotalAmount(newLineItems);
  };

  const handleDeleteLineItem = (index) => {
    const newLineItems = formData.lineItems.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      lineItems: newLineItems,
    }));
    updateTotalAmount(newLineItems);
  };

  const handleAddLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          itemName: "",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
        },
      ],
    }));
  };

  const handleSubmit = () => {
    const updatedExpense = {
      ...expense,
      vendor: formData.vendor,
      date: formData.date,
      paymentMethod: formData.paymentMethod,
      totalAmount: formData.totalAmount,
      lineItems: formData.lineItems.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    };

    onSave(updatedExpense);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">Edit Expense</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor
            </label>
            <input
              type="text"
              name="vendor"
              value={formData.vendor}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter vendor name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <input
                type="text"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Cash, Card"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount
              </label>
              <div className="flex items-center">
                <span className="text-xl font-semibold text-gray-700 mr-2">
                  ₹
                </span>
                <input
                  type="text"
                  value={formData.totalAmount.toFixed(2)}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-4">
              Line Items
            </h3>
            <div className="space-y-3">
              {formData.lineItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) =>
                        handleLineItemChange(index, "itemName", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Item name"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={Number(item.quantity).toString()}
                      onChange={(e) =>
                        handleLineItemChange(index, "quantity", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={Number(item.unitPrice).toString()}
                      onChange={(e) =>
                        handleLineItemChange(index, "unitPrice", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Total
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded text-sm font-semibold text-gray-700">
                      ₹{item.totalPrice.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteLineItem(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete item"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddLineItem}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Add Line Item
            </button>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseEditDialog;
