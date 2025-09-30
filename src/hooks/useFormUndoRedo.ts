import { useState, useCallback, useRef, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseFormUndoRedoOptions {
  maxHistorySize?: number | undefined;
  debounceDelay?: number | undefined;
  enableKeyboardShortcuts?: boolean | undefined;
}

export function useFormUndoRedo<TFormValues extends Record<string, unknown>>(
  form: UseFormReturn<TFormValues>,
  options: UseFormUndoRedoOptions = {}
) {
  const { maxHistorySize = 50, debounceDelay = 500, enableKeyboardShortcuts = true } = options;

  const [state, setState] = useState<UndoRedoState<TFormValues>>({
    past: [],
    present: form.getValues(),
    future: [],
  });

  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const isUndoRedoRef = useRef(false);

  // Save current state to history
  const saveToHistory = useCallback(
    (values: TFormValues) => {
      if (isUndoRedoRef.current) {
        isUndoRedoRef.current = false;
        return;
      }

      setState(prevState => {
        const newPast = [...prevState.past, prevState.present];
        // Limit history size
        if (newPast.length > maxHistorySize) {
          newPast.shift();
        }

        return {
          past: newPast,
          present: values,
          future: [], // Clear future when new change is made
        };
      });
    },
    [maxHistorySize]
  );

  // Debounced save to history
  const debouncedSaveToHistory = useCallback(
    (values: TFormValues) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        saveToHistory(values);
      }, debounceDelay);
    },
    [saveToHistory, debounceDelay]
  );

  // Watch form changes
  useEffect(() => {
    const subscription = form.watch(values => {
      if (values) {
        debouncedSaveToHistory(values as TFormValues);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, debouncedSaveToHistory]);

  // Undo action
  const undo = useCallback(() => {
    if (state.past.length === 0) return;

    isUndoRedoRef.current = true;

    setState(prevState => {
      const newPast = [...prevState.past];
      const previousState = newPast.pop()!;

      // Apply the previous state to the form
      form.reset(previousState);

      return {
        past: newPast,
        present: previousState,
        future: [prevState.present, ...prevState.future],
      };
    });
  }, [state.past, form]);

  // Redo action
  const redo = useCallback(() => {
    if (state.future.length === 0) return;

    isUndoRedoRef.current = true;

    setState(prevState => {
      const newFuture = [...prevState.future];
      const nextState = newFuture.shift()!;

      // Apply the next state to the form
      form.reset(nextState);

      return {
        past: [...prevState.past, prevState.present],
        present: nextState,
        future: newFuture,
      };
    });
  }, [state.future, form]);

  // Reset history
  const resetHistory = useCallback(() => {
    setState({
      past: [],
      present: form.getValues(),
      future: [],
    });
  }, [form]);

  // Can undo/redo checks
  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  // Keyboard shortcuts
  useKeyboardShortcuts(
    enableKeyboardShortcuts
      ? [
          {
            key: 'z',
            ctrl: true,
            callback: undo,
            description: 'Undo',
            enabled: canUndo,
          },
          {
            key: 'y',
            ctrl: true,
            callback: redo,
            description: 'Redo',
            enabled: canRedo,
          },
          {
            key: 'z',
            ctrl: true,
            shift: true,
            callback: redo,
            description: 'Redo',
            enabled: canRedo,
          },
        ]
      : [],
    { enableInInputs: true }
  );

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    historySize: state.past.length + state.future.length,
  };
}

// Hook for tracking field-level changes
export function useFieldHistory<T = any>(fieldName: string, initialValue: T) {
  const [history, setHistory] = useState<T[]>([initialValue]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const addToHistory = useCallback(
    (value: T) => {
      setHistory(prev => {
        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push(value);
        return newHistory;
      });
      setCurrentIndex(prev => prev + 1);
    },
    [currentIndex]
  );

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
    return history[currentIndex];
  }, [currentIndex, history]);

  const goForward = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
    return history[currentIndex];
  }, [currentIndex, history]);

  return {
    value: history[currentIndex],
    addToHistory,
    goBack,
    goForward,
    canGoBack: currentIndex > 0,
    canGoForward: currentIndex < history.length - 1,
  };
}
