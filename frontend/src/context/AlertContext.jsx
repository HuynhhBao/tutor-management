import React, { createContext, useContext, useState, useCallback } from 'react';
import { Info, X, HelpCircle, MessageSquare } from 'lucide-react';

const AlertContext = createContext(null);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({ isOpen: false, message: '' });
  const [confirmState, setConfirmState] = useState({ isOpen: false, message: '', onConfirm: null });
  const [promptState, setPromptState] = useState({ isOpen: false, message: '', value: '', onPrompt: null });

  const showAlert = useCallback((message) => {
    setAlertState({ isOpen: true, message });
  }, []);
  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showConfirm = useCallback((message, onConfirm) => {
    setConfirmState({ isOpen: true, message, onConfirm });
  }, []);
  const hideConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  }, []);
  const handleConfirm = useCallback(() => {
    if (confirmState.onConfirm) confirmState.onConfirm();
    hideConfirm();
  }, [confirmState, hideConfirm]);

  const showPrompt = useCallback((message, onPrompt, defaultValue = '') => {
    setPromptState({ isOpen: true, message, value: defaultValue, onPrompt });
  }, []);
  const hidePrompt = useCallback(() => {
    setPromptState((prev) => ({ ...prev, isOpen: false }));
  }, []);
  const handlePromptSubmit = useCallback(() => {
    if (promptState.onPrompt) promptState.onPrompt(promptState.value);
    hidePrompt();
  }, [promptState, hidePrompt]);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
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
            <h3 className="text-xl font-bold text-slate-900 text-center mb-3">Thông báo</h3>
            <p className="text-slate-600 text-center mb-6 leading-relaxed whitespace-pre-wrap">{alertState.message}</p>
            <button
              onClick={hideAlert}
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* Global Confirm Modal */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={hideConfirm}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-amber-50">
              <HelpCircle className="w-8 h-8 text-amber-600 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-3">Xác nhận</h3>
            <p className="text-slate-600 text-center mb-6 leading-relaxed whitespace-pre-wrap">{confirmState.message}</p>
            <div className="flex gap-3">
              <button
                onClick={hideConfirm}
                className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Prompt Modal */}
      {promptState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={hidePrompt}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-indigo-50">
              <MessageSquare className="w-8 h-8 text-indigo-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-3">Nhập thông tin</h3>
            <p className="text-slate-600 text-center mb-4 leading-relaxed whitespace-pre-wrap">{promptState.message}</p>
            <textarea
              value={promptState.value}
              onChange={(e) => setPromptState((prev) => ({ ...prev, value: e.target.value }))}
              placeholder="Vui lòng nhập nội dung tại đây..."
              rows={3}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl mb-6 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <div className="flex gap-3">
              <button
                onClick={hidePrompt}
                className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handlePromptSubmit}
                disabled={!promptState.value.trim()}
                className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                Gửi thông tin
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};
