import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { Toaster, sileo } from 'sileo';
import 'sileo/styles.css';
import { useTheme } from './ThemeContext';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'login' | 'logout';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { theme } = useTheme();

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const duration = toast.duration ?? 4000;
    const opts = {
      title: toast.title,
      description: toast.message,
      duration,
    };

    switch (toast.type) {
      case 'login':
      case 'success':
        return sileo.success(opts);
      case 'logout':
        return sileo.info(opts);
      case 'error':
        return sileo.error(opts);
      case 'warning':
        return sileo.warning(opts);
      case 'info':
      default:
        return sileo.info(opts);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    sileo.dismiss(id);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <Toaster 
        position="top-center" 
        offset={{ top: 20 }} 
        theme={theme === 'dark' ? 'dark' : 'light'} 
      />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
