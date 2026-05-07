import React from 'react';
import { Mail, CheckCircle, Clock, ExternalLink, BookOpen, Loader2 } from 'lucide-react';

const ApplicationTable = ({ applications, loadingApps, searchTerm, onApprove, onReject }) => {
  const filtered = applications.filter(app =>
    app.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
        <tr>
          <th className="px-6 py-4 font-semibold">ID</th>
          <th className="px-6 py-4 font-semibold">Email Liên Hệ</th>
          <th className="px-6 py-4 font-semibold">Hình ảnh CV</th>
          <th className="px-6 py-4 font-semibold">Trạng thái</th>
          <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {loadingApps ? (
          <tr>
            <td colSpan="5" className="px-6 py-12 text-center text-gray-500 bg-white">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                <p>Đang tải hồ sơ...</p>
              </div>
            </td>
          </tr>
        ) : filtered.length > 0 ? (
          filtered.map((app) => (
            <tr key={app.id} className="hover:bg-gray-50/80 transition-colors">
              <td className="px-6 py-4 font-medium text-gray-900">APP-{app.id}</td>
              <td className="px-6 py-4">
                <div className="flex items-center text-slate-700">
                  <Mail className="w-4 h-4 mr-2 text-slate-400" />
                  {app.email}
                </div>
                <p className="text-xs text-gray-400 mt-1">Nộp: {new Date(app.created_at).toLocaleDateString('vi-VN')}</p>
              </td>
              <td className="px-6 py-4">
                <a
                  href={`http://localhost:3001${app.cv_image_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Xem CV
                </a>
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
          ))
        ) : (
          <tr>
            <td colSpan="5" className="px-6 py-12 text-center text-gray-500 bg-white">
              <div className="flex flex-col items-center gap-2">
                <BookOpen className="w-12 h-12 text-slate-200" />
                <p>Chưa có hồ sơ ứng tuyển nào.</p>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default ApplicationTable;
