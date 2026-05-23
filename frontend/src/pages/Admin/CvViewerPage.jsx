import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Download } from 'lucide-react';

const CvViewerPage = () => {
  const [searchParams] = useSearchParams();
  
  const urlsParam = searchParams.get('urls') || '';
  const initialIndex = Number.parseInt(searchParams.get('index') || '0', 10);
  
  const urls = urlsParam ? urlsParam.split(',') : [];
  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 && initialIndex < urls.length ? initialIndex : 0
  );
  const [scale, setScale] = useState(1);

  if (urls.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <p className="text-lg font-semibold">Không tìm thấy tài liệu CV</p>
        <button 
          type="button"
          onClick={() => window.close()} 
          className="mt-4 px-6 py-2 bg-blue-600 rounded-xl font-bold hover:bg-blue-700 transition-all"
        >
          Đóng cửa sổ
        </button>
      </div>
    );
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? urls.length - 1 : prev - 1));
    setScale(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === urls.length - 1 ? 0 : prev + 1));
    setScale(1);
  };

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));

  const currentUrl = `http://localhost:3001${urls[currentIndex]}`;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-white relative select-none">
      {/* Top Header Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-800 z-10">
        <div>
          <h2 className="font-bold text-base md:text-lg">Bộ xem hồ sơ CV</h2>
          <p className="text-xs text-slate-400">Ảnh {currentIndex + 1} của {urls.length}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleZoomOut} 
            title="Thu nhỏ"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl transition-all"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-slate-300 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button 
            type="button"
            onClick={handleZoomIn} 
            title="Phóng to"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl transition-all"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <a 
            href={currentUrl} 
            download 
            target="_blank"
            rel="noreferrer"
            title="Tải xuống"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl transition-all text-white flex items-center justify-center"
          >
            <Download className="w-5 h-5" />
          </a>
          <button 
            type="button"
            onClick={() => window.close()} 
            title="Đóng tab"
            className="p-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl transition-all ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
        {/* Prev Button */}
        {urls.length > 1 && (
          <button 
            type="button"
            onClick={handlePrev}
            className="absolute left-6 p-4 bg-slate-900/60 hover:bg-slate-900/90 active:scale-95 rounded-full backdrop-blur-sm border border-slate-800 transition-all z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        {/* Image Display */}
        <div className="max-w-full max-h-full flex items-center justify-center overflow-auto p-4">
          <img 
            src={currentUrl} 
            alt={`CV Document ${currentIndex + 1}`} 
            style={{ transform: `scale(${scale})` }}
            className="max-h-[75vh] max-w-[85vw] object-contain rounded-lg shadow-2xl transition-transform duration-200 border border-slate-800"
          />
        </div>

        {/* Next Button */}
        {urls.length > 1 && (
          <button 
            type="button"
            onClick={handleNext}
            className="absolute right-6 p-4 bg-slate-900/60 hover:bg-slate-900/90 active:scale-95 rounded-full backdrop-blur-sm border border-slate-800 transition-all z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnails Navigation */}
      {urls.length > 1 && (
        <div className="bg-slate-900/80 backdrop-blur-md p-4 flex justify-center gap-3 border-t border-slate-800 overflow-x-auto max-w-full">
          {urls.map((url, idx) => (
            <button
              type="button"
              key={url}
              onClick={() => {
                setCurrentIndex(idx);
                setScale(1);
              }}
              className={`relative rounded-lg overflow-hidden border-2 w-16 h-20 bg-slate-950 flex-shrink-0 transition-all ${
                currentIndex === idx ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/20' : 'border-slate-800 opacity-60 hover:opacity-100'
              }`}
            >
              <img 
                src={`http://localhost:3001${url}`} 
                alt={`Thumb ${idx + 1}`} 
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CvViewerPage;
