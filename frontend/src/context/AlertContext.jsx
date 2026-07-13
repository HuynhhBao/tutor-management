import React, { createContext, useContext, useState, useCallback } from 'react';
import { Info, X } from 'lucide-react';

const AlertContext = createContext(null);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: '',
  });

  const showAlert = useCallback((message) => {
    setAlertState({
      isOpen: true,
      message,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      
      {/* Global Alert Modal */}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={hideAlert}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-blue-50">
              <Info className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 text-center mb-3">
              Thông báo
            </h3>
            
            <p className="text-slate-600 text-center mb-6 leading-relaxed whitespace-pre-wrap">
              {alertState.message}
            </p>
            
            <button
              onClick={hideAlert}
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};
