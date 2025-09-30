import { useState } from 'react';

interface UseProfileFormValidationProps {
  currentUsername?: string | undefined;
  isOffline?: boolean | undefined;
}

export const useProfileFormValidation = ({
  currentUsername,
  isOffline,
}: UseProfileFormValidationProps) => {
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);

  const validateUsername = async (username: string): Promise<boolean> => {
    if (!username || username === currentUsername) {
      setUsernameError(null);
      return true;
    }

    if (isOffline) {
      setUsernameError('Cannot check username availability while offline');
      return false;
    }

    setIsCheckingUsername(true);
    setUsernameError(null);

    try {
      // Mock username validation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock check - usernames starting with 'admin' are taken
      const isTaken = username.toLowerCase().startsWith('admin');

      if (isTaken) {
        setUsernameError('Username is already taken');
        setUsernameAvailable(false);
        return false;
      } else {
        setUsernameAvailable(true);
        return true;
      }
    } catch (error) {
      setUsernameError('Failed to check username availability');
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    return validateUsername(username);
  };

  const validateProfileForm = (data: unknown) => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
      errors.name = 'Name is required';
    }

    if (!data.username?.trim()) {
      errors.username = 'Username is required';
    }

    return {
      isValid: (Object.keys(errors) as (keyof typeof errors)[]).length === 0,
      errors,
    };
  };

  return {
    usernameError,
    isCheckingUsername,
    usernameAvailable,
    validateUsername,
    setUsernameError,
    checkUsernameAvailability,
    validateProfileForm,
  };
};
