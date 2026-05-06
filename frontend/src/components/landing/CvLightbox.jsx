import React from 'react';
import { X } from 'lucide-react';

const CvLightbox = ({ isOpen, previewUrl, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all border border-white/10"
      >
        <X className="h-6 w-6" />
      </button>
      <img 
        src={previewUrl} 
        alt="Full Preview" 
        className="max-w-full max-h-[90vh] rounded-xl shadow-2xl animate-in zoom-in-95 duration-300" 
      />
    </div>
  );
};

export default CvLightbox;
