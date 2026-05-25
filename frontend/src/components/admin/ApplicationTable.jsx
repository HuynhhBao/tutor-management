import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Mail, CheckCircle, Clock, ExternalLink, BookOpen, Loader2, X } from 'lucide-react';

const ApplicationTable = ({ applications, loadingApps, searchTerm, onApprove, onReject }) => {
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    urls: [],
    appId: null
  });

  const filtered = applications.filter(app =>
    app.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderRows = () => {
    if (loadingApps) {
      return (
        <tr>
          <td colSpan="5" className="px-6 py-12 text-center text-gray-500 bg-white">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              <p>Đang tải hồ sơ...</p>
            </div>
          </td>
        </tr>
      );
    }

    if (filtered.length > 0) {
      return filtered.map((app) => {
        const imageUrls = app.cv_image_url ? app.cv_image_url.split(',') : [];
        return (
          <tr key={app.id} className="hover:bg-slate-100/80 transition-colors">
            <td className="px-6 py-4 font-medium text-gray-900">APP-{app.id}</td>
            <td className="px-6 py-4">
              <div className="flex items-center text-slate-700">
                <Mail className="w-4 h-4 mr-2 text-slate-400" />
                {app.email}
              </div>
              <p className="text-xs text-gray-400 mt-1">Nộp: {new Date(app.created_at).toLocaleDateString('vi-VN')}</p>
            </td>
            <td className="px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  if (imageUrls.length <= 1) {
                    const viewerUrl = `/cv-viewer?urls=${encodeURIComponent(imageUrls.join(','))}&index=0`;
                    window.open(viewerUrl, '_blank');
                  } else {
                    setPreviewModal({
                      isOpen: true,
                      urls: imageUrls,
                      appId: app.id
                    });
                  }
                }}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Xem CV {imageUrls.length > 1 ? `(${imageUrls.length})` : ''}
              </button>
            </td>
            <td className="px-6 py-4">
              {app.status === 'pending' ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3.5 h-3.5 mr-1" /> Chờ duyệt
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Đã duyệt
                </span>
              )}
            </td>
            <td className="px-6 py-4 text-right">
              {app.status === 'pending' ? (
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onApprove(app.id)} className="bg-primary-50 text-primary-600 hover:bg-primary-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                    Duyệt & Hẹn PV
                  </button>
                  <button onClick={() => onReject(app.id, app.status)} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                    Từ chối
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onReject(app.id, app.status)} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                    Đánh rớt PV
                  </button>
                </div>
              )}
            </td>
          </tr>
        );
      });
    }

    return (
      <tr>
        <td colSpan="5" className="px-6 py-12 text-center text-gray-500 bg-white">
          <div className="flex flex-col items-center gap-2">
            <BookOpen className="w-12 h-12 text-slate-200" />
            <p>Chưa có hồ sơ ứng tuyển nào.</p>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <>
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-100 text-gray-500 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 font-semibold">ID</th>
            <th className="px-6 py-4 font-semibold">Email Liên Hệ</th>
            <th className="px-6 py-4 font-semibold">Hình ảnh CV</th>
            <th className="px-6 py-4 font-semibold">Trạng thái</th>
            <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {renderRows()}
        </tbody>
      </table>

    {/* Select Preview Modal */}
    {previewModal.isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Chọn ảnh CV để xem</h3>
            <button 
              type="button"
              onClick={() => setPreviewModal({ isOpen: false, urls: [], appId: null })}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Thumbnail selection grid */}
          <div className="grid grid-cols-2 gap-4 my-6 max-h-60 overflow-y-auto p-1">
            {previewModal.urls.map((url, idx) => (
              <button
                type="button"
                key={url}
                onClick={() => {
                  const viewerUrl = `/cv-viewer?urls=${encodeURIComponent(previewModal.urls.join(','))}&index=${idx}`;
                  window.open(viewerUrl, '_blank');
                  setPreviewModal({ isOpen: false, urls: [], appId: null });
                }}
                className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col items-center p-3 hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-md transition-all active:scale-95"
              >
                <div className="w-full aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden mb-2">
                  <img 
                    src={`http://localhost:3001${url}`} 
                    alt={`CV page ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <span className="text-xs font-bold text-slate-700">Trang {idx + 1}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPreviewModal({ isOpen: false, urls: [], appId: null })}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

ApplicationTable.propTypes = {
  applications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      email: PropTypes.string.isRequired,
      cv_image_url: PropTypes.string,
      status: PropTypes.string.isRequired,
      created_at: PropTypes.string.isRequired,
    })
  ).isRequired,
  loadingApps: PropTypes.bool.isRequired,
  searchTerm: PropTypes.string.isRequired,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
};

export default ApplicationTable;
