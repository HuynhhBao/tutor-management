import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Edit2, Trash2, Star, CheckCircle, XCircle, GraduationCap, User, BookOpen, UserCircle, Loader2, Clock, Mail, MapPin, CalendarDays, ExternalLink } from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function TutorManagement() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Nam',
    age: '',
    subject: '',
    qualification: ''
  });

  const [activeTab, setActiveTab] = useState('tutors'); // 'tutors' | 'applications'
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvingAppId, setApprovingAppId] = useState(null);
  const [interviewData, setInterviewData] = useState({ time: '', address: '' });
  const [approveStatus, setApproveStatus] = useState({ loading: false, error: '' });

  const fetchTutors = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/tutors');
      const data = await response.json();
      if (data.status === 'ok') {
        setTutors(data.data);
      }
    } catch (err) {
      console.error('Error fetching tutors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const response = await fetch('http://localhost:3001/api/tutors/applications');
      const data = await response.json();
      if (data.status === 'ok') {
        setApplications(data.data);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tutors') {
      fetchTutors();
    } else {
      fetchApplications();
    }
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (tutor) => {
    setEditingId(tutor.id);
    setFormData({
      fullName: tutor.full_name,
      gender: tutor.gender,
      age: tutor.age,
      subject: tutor.subjects,
      qualification: tutor.qualification
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa gia sư này?')) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/tutors/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTutors();
      } else {
        alert('Có lỗi xảy ra khi xóa gia sư');
      }
    } catch (err) {
      console.error('Error deleting tutor:', err);
      alert('Không thể kết nối đến server');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId 
      ? `http://localhost:3001/api/tutors/${editingId}`
      : 'http://localhost:3001/api/tutors';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ fullName: '', gender: 'Nam', age: '', subject: '', qualification: '' });
        fetchTutors(); // Refresh list
      } else {
        alert(`Có lỗi xảy ra khi ${editingId ? 'cập nhật' : 'lưu'} gia sư`);
      }
    } catch (err) {
      console.error('Error saving tutor:', err);
      alert('Không thể kết nối đến server');
    }
  };

  const handleApproveClick = (appId) => {
    setApprovingAppId(appId);
    setInterviewData({ time: '', address: '' });
    setApproveStatus({ loading: false, error: '' });
    setIsApproveModalOpen(true);
  };

  const formatDateTime = (datetimeStr) => {
    if (!datetimeStr) return '';
    const date = new Date(datetimeStr);
    return date.toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!interviewData.time || !interviewData.address) {
      setApproveStatus({ loading: false, error: 'Vui lòng nhập đủ thời gian và địa điểm' });
      return;
    }
    setApproveStatus({ loading: true, error: '' });
    try {
      const formattedTime = formatDateTime(interviewData.time);
      const response = await fetch(`http://localhost:3001/api/tutors/applications/${approvingAppId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewTime: formattedTime, interviewAddress: interviewData.address })
      });
      const data = await response.json();
      if (response.ok) {
        setIsApproveModalOpen(false);
        fetchApplications();
        alert('Đã duyệt và gửi email phỏng vấn thành công!');
      } else {
        setApproveStatus({ loading: false, error: data.message || 'Lỗi duyệt hồ sơ' });
      }
    } catch (err) {
      setApproveStatus({ loading: false, error: 'Không thể kết nối đến server' });
    }
  };

  const handleRejectClick = async (appId) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối và xóa hồ sơ này? Ứng viên sẽ nhận được email thông báo từ chối.')) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/tutors/applications/${appId}/reject`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        fetchApplications();
        alert('Đã từ chối và gửi email thông báo thành công!');
      } else {
        alert(data.message || 'Lỗi từ chối hồ sơ');
      }
    } catch (err) {
      alert('Không thể kết nối đến server');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Gia sư & Hồ sơ</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý gia sư đang hợp tác và duyệt hồ sơ ứng tuyển mới</p>
        </div>
        {activeTab === 'tutors' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            + Thêm gia sư mới
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('tutors')}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'tutors' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Danh sách Gia sư
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'applications' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Hồ sơ Ứng tuyển
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-4 h-4 text-gray-400" />
            </span>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
              placeholder="Tìm kiếm theo tên, môn học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center">
            <Filter className="w-4 h-4 mr-2" />
            Lọc kết quả
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'tutors' ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Tên gia sư</th>
                  <th className="px-6 py-4 font-semibold">Môn dạy</th>
                  <th className="px-6 py-4 font-semibold">Bằng cấp</th>
                  <th className="px-6 py-4 font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 bg-white">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                        <p>Đang tải dữ liệu...</p>
                      </div>
                    </td>
                  </tr>
                ) : tutors.length > 0 ? (
                  tutors
                    .filter(t => 
                      t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      t.subjects.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((tutor) => (
                    <tr key={tutor.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold uppercase border border-primary-200">
                            {tutor.full_name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">{tutor.full_name}</p>
                            <p className="text-xs text-gray-500">ID: TS-{tutor.id.toString().padStart(4, '0')} • {tutor.gender}, {tutor.age} tuổi</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {tutor.subjects.split(',').map(sub => (
                            <span key={sub} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {sub.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-slate-600">
                          <GraduationCap className="w-4 h-4 mr-2 text-slate-400" />
                          {tutor.qualification}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {tutor.status === 'Đang dạy' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            {tutor.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {tutor.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleEdit(tutor)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(tutor.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 bg-white">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpen className="w-12 h-12 text-slate-200" />
                        <p>Chưa có dữ liệu gia sư.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
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
                ) : applications.length > 0 ? (
                  applications
                    .filter(app => app.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((app) => (
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
                        <a href={`http://localhost:3001${app.cv_image_url}`} target="_blank" rel="noreferrer" className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Xem CV
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {app.status === 'pending' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Chờ duyệt
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Đã duyệt
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {app.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleApproveClick(app.id)}
                              className="bg-primary-50 text-primary-600 hover:bg-primary-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors" 
                            >
                              Duyệt & Hẹn PV
                            </button>
                            <button 
                              onClick={() => handleRejectClick(app.id)}
                              className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors" 
                            >
                              Từ chối
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
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
          setFormData({ fullName: '', gender: 'Nam', age: '', subject: '', qualification: '' });
        }} 
        title={editingId ? "Chỉnh sửa gia sư" : "Thêm gia sư mới"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Nguyễn Văn A"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giới tính</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <UserCircle className="w-4 h-4 text-slate-400" />
                </span>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tuổi</label>
              <input
                type="number"
                name="age"
                required
                min="18"
                max="100"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="25"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Môn dạy</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <BookOpen className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="text"
                name="subject"
                required
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Toán, Lý, Tiếng Anh..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bằng cấp</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <GraduationCap className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="text"
                name="qualification"
                required
                value={formData.qualification}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Cử nhân sư phạm, IELTS 8.0..."
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingId(null);
                setFormData({ fullName: '', gender: 'Nam', age: '', subject: '', qualification: '' });
              }}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm"
            >
              {editingId ? "Cập nhật" : "Lưu gia sư"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false);
          setApprovingAppId(null);
          setInterviewData({ time: '', address: '' });
          setApproveStatus({ loading: false, error: '' });
        }}
        title="Duyệt Hồ Sơ & Lên Lịch Phỏng Vấn"
      >
        <form onSubmit={handleApproveSubmit} className="space-y-4">
          {approveStatus.error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {approveStatus.error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian phỏng vấn</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <CalendarDays className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="datetime-local"
                required
                value={interviewData.time}
                onChange={(e) => setInterviewData({...interviewData, time: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Địa điểm phỏng vấn</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MapPin className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="text"
                required
                value={interviewData.address}
                onChange={(e) => setInterviewData({...interviewData, address: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="VD: Phòng 204, Tòa nhà A, Số 1 Đường B"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 italic">* Email mời phỏng vấn sẽ tự động được gửi tới ứng viên sau khi bạn nhấn Duyệt.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsApproveModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={approveStatus.loading}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {approveStatus.loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Duyệt & Gửi Email
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
