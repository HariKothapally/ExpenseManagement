export const validateBillForm = (data) => {
  const errors = {};
  
  if (!data.vendor?.trim()) {
    errors.vendor = 'Vendor is required';
  }
  
  if (!data.date) {
    errors.date = 'Date is required';
  }
  
  if (!data.totalAmount || data.totalAmount <= 0) {
    errors.totalAmount = 'Valid amount is required';
  }
  
  return errors;
};

export const isFormValid = (errors) => {
  return Object.keys(errors).length === 0;
};