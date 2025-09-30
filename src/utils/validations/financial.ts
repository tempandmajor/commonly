/**
 * Validates an amount for financial transactions
 * @param amount Amount to validate as string or number
 * @returns Object with isValid flag and error message if invalid
 */
export const validateTransactionAmount = (
  amount: string | number
): { isValid: boolean; error?: string } => {
  // Convert string to number if needed
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Check if it's a valid number
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  // Check if amount is positive
  if (numAmount <= 0) {
    return { isValid: false, error: 'Amount must be greater than zero' };
  }

  // Check if amount has reasonable precision (2 decimal places)
  if (Math.round(numAmount * 100) / 100 !== numAmount) {
    return { isValid: false, error: 'Amount cannot have more than 2 decimal places' };
  }

  // Check if amount is within reasonable limits
  if (numAmount > 1000000) {
    return { isValid: false, error: 'Amount exceeds maximum transfer limit' };
  }

  return { isValid: true };
};

/**
 * Validates a bank account number
 * @param accountNumber The account number to validate
 * @returns Object with isValid flag and error message if invalid
 */
export const validateBankAccount = (
  accountNumber: string
): { isValid: boolean; error?: string } => {
  // Remove any spaces or dashes
  const cleanNumber = accountNumber.replace(/[\s-]/g, '');

  // Check if it consists of digits only
  if (!/^\d+$/.test(cleanNumber)) {
    return { isValid: false, error: 'Account number should contain digits only' };
  }

  // Check length (most bank account numbers are between 4-17 digits)
  if (cleanNumber.length < 4 || cleanNumber.length > 17) {
    return { isValid: false, error: 'Account number should be between 4 and 17 digits' };
  }

  return { isValid: true };
};

/**
 * Validates a user ID format
 * @param userId The user ID to validate
 * @returns Object with isValid flag and error message if invalid
 */
export const validateUserId = (userId: string): { isValid: boolean; error?: string } => {
  // Basic validation - in a real app this might check against a specific format
  if (!userId || userId.trim().length === 0) {
    return { isValid: false, error: 'User ID is required' };
  }

  // Ensure reasonable length
  if (userId.length < 4 || userId.length > 40) {
    return { isValid: false, error: 'Invalid user ID format' };
  }

  return { isValid: true };
};
