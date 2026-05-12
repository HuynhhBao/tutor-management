import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import TutorTable from '../../components/admin/TutorTable';
import ApplicationTable from '../../components/admin/ApplicationTable';
import TutorFormModal from '../../components/admin/TutorFormModal';
import GrantAccountModal from '../../components/admin/GrantAccountModal';
import ApproveModal from '../../components/admin/ApproveModal';
import SuccessModal from '../../components/admin/SuccessModal';
import { API_BASE_URL } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

const EMPTY_FORM = { fullName: '', email: '', gender: 'Nam', age: '', subject: '', qualification: '' };

export default function TutorManagement() {
  const [activeTab, setActiveTab] = useState('tutors'); // 'tutors' | 'applications'
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalTutors: 0, pendingApplications: 0 });

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tutors/stats`);
      const data = await response.json();
      if (data.status === 'ok') {
        setStats(data.data);
        window.dispatchEvent(new Event('tutorStatsChanged'));
      }
    } catch (err) {
      console.error('Error fetching tutor stats:', err);
    }
  };

  // --- Tutors ---
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // --- Applications ---
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvingAppId, setApprovingAppId] = useState(null);
  const [interviewData, setInterviewData] = useState({ time: '', address: '' });
  const [approveStatus, setApproveStatus] = useState({ loading: false, error: '' });

  // --- Grant account ---
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [grantingTutorId, setGrantingTutorId] = useState(null);
  const [grantUsername, setGrantUsername] = useState('');
  const [grantStatus, setGrantStatus] = useState({ loading: false, error: '' });

  // --- Success Modal ---
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setIsSuccessModalOpen(true);
  };

  // --- Fetch ---
  const fetchTutors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tutors`);
      const data = await response.json();
      if (data.status === 'ok') setTutors(data.data);
    } catch (err) { console.error('Error fetching tutors:', err); }
    finally { setLoading(false); }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tutors/applications`);
      const data = await response.json();
      if (data.status === 'ok') setApplications(data.data);
    } catch (err) { console.error('Error fetching applications:', err); }
    finally { setLoadingApps(false); }
  };

  useEffect(() => {
    activeTab === 'tutors' ? fetchTutors() : fetchApplications();
  }, [activeTab]);

  useEffect(() => {
    fetchStats();
  }, [applications]); // Re-fetch stats when applications change

  // --- Tutor handlers ---
  const handleEdit = (tutor) => {
    setEditingId(tutor.id);
    setFormData({ fullName: tutor.full_name, email: tutor.email || '', gender: tutor.gender, age: tutor.age, subject: tutor.subjects, qualification: tutor.qualification });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa gia sư này?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/tutors/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchTutors();
        showSuccess('Đã xóa gia sư thành công!');
      }
      else alert('Có lỗi xảy ra khi xóa gia sư');
    } catch { alert('Không thể kết nối đến server'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId ? `${API_BASE_URL}/tutors/${editingId}` : `${API_BASE_URL}/tutors`;
    const method = editingId ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (response.ok) { 
        closeFormModal(); 
        fetchTutors(); 
        showSuccess(editingId ? 'Cập nhật thông tin gia sư thành công!' : 'Thêm gia sư mới thành công!');
      }
      else alert(`Có lỗi xảy ra khi ${editingId ? 'cập nhật' : 'lưu'} gia sư`);
    } catch { alert('Không thể kết nối đến server'); }
  };

  const closeFormModal = () => { setIsModalOpen(false); setEditingId(null); setFormData(EMPTY_FORM); };

  // --- Application handlers ---
  const handleApproveClick = (appId) => {
    setApprovingAppId(appId);
    setInterviewData({ time: '', address: '' });
    setApproveStatus({ loading: false, error: '' });
    setIsApproveModalOpen(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!interviewData.time || !interviewData.address) { setApproveStatus({ loading: false, error: 'Vui lòng nhập đủ thời gian và địa điểm' }); return; }
    setApproveStatus({ loading: true, error: '' });
    try {
      const response = await fetch(`${API_BASE_URL}/tutors/applications/${approvingAppId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewTime: formatDateTime(interviewData.time), interviewAddress: interviewData.address }),
      });
      const data = await response.json();
      if (response.ok) { setIsApproveModalOpen(false); fetchApplications(); showSuccess('Đã duyệt và gửi email phỏng vấn thành công!'); }
      else setApproveStatus({ loading: false, error: data.message || 'Lỗi duyệt hồ sơ' });
    } catch { setApproveStatus({ loading: false, error: 'Không thể kết nối đến server' }); }
  };

  const handleRejectClick = async (appId, status) => {
    const isApproved = status === 'approved';
    const confirmMsg = isApproved 
      ? 'Bạn có chắc chắn muốn từ chối ứng viên này vì không đạt phỏng vấn? Hệ thống sẽ gửi email thông báo kết quả phỏng vấn.'
      : 'Bạn có chắc chắn muốn từ chối và xóa hồ sơ này? Ứng viên sẽ nhận được email thông báo từ chối CV.';
      
    if (!window.confirm(confirmMsg)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/tutors/applications/${appId}/reject`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) { fetchApplications(); showSuccess('Đã từ chối và gửi email thông báo thành công!'); }
      else alert(data.message || 'Lỗi từ chối hồ sơ');
    } catch { alert('Không thể kết nối đến server'); }
  };

  // --- Grant account handlers ---
  const handleGrantClick = (tutor) => {
    if (!tutor.email) { alert('Gia sư này chưa có địa chỉ email. Vui lòng chỉnh sửa gia sư và thêm email trước khi cấp tài khoản.'); return; }
    setGrantingTutorId(tutor.id);
    setGrantUsername('');
    setGrantStatus({ loading: false, error: '' });
    setIsGrantModalOpen(true);
  };

  const handleGrantSubmit = async (e) => {
    e.preventDefault();
    if (!grantUsername) { setGrantStatus({ loading: false, error: 'Vui lòng nhập tên tài khoản' }); return; }
    setGrantStatus({ loading: true, error: '' });
    try {
      const response = await fetch(`${API_BASE_URL}/tutors/${grantingTutorId}/grant-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: grantUsername }),
      });
      const data = await response.json();
      if (response.ok) { setIsGrantModalOpen(false); showSuccess('Đã cấp tài khoản và gửi email thông báo thành công!'); }
      else setGrantStatus({ loading: false, error: data.message || 'Lỗi cấp tài khoản' });
    } catch { setGrantStatus({ loading: false, error: 'Không thể kết nối đến server' }); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Gia sư & Hồ sơ</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý gia sư đang hợp tác và duyệt hồ sơ ứng tuyển mới</p>
        </div>
        {activeTab === 'tutors' && (
          <button onClick={() => setIsModalOpen(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            + Thêm gia sư mới
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['tutors', 'applications'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`relative py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <div className="flex items-center gap-2">
              <span>{tab === 'tutors' ? 'Danh sách Gia sư' : 'Hồ sơ Ứng tuyển'}</span>
              {tab === 'applications' && stats.pendingApplications > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {stats.pendingApplications}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-100/50">
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
          <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-100 transition-colors w-full sm:w-auto justify-center">
            <Filter className="w-4 h-4 mr-2" /> Lọc kết quả
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'tutors' ? (
            <TutorTable tutors={tutors} loading={loading} searchTerm={searchTerm} onEdit={handleEdit} onDelete={handleDelete} onGrant={handleGrantClick} />
          ) : (
            <ApplicationTable applications={applications} loadingApps={loadingApps} searchTerm={searchTerm} onApprove={handleApproveClick} onReject={handleRejectClick} />
          )}
        </div>
      </div>

      {/* Modals */}
      <TutorFormModal
        isOpen={isModalOpen}
        editingId={editingId}
        formData={formData}
        onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
        onSubmit={handleSubmit}
        onClose={closeFormModal}
      />
      <GrantAccountModal
        isOpen={isGrantModalOpen}
        grantUsername={grantUsername}
        setGrantUsername={setGrantUsername}
        grantStatus={grantStatus}
        onSubmit={handleGrantSubmit}
        onClose={() => { setIsGrantModalOpen(false); setGrantingTutorId(null); setGrantUsername(''); setGrantStatus({ loading: false, error: '' }); }}
      />
      <ApproveModal
        isOpen={isApproveModalOpen}
        interviewData={interviewData}
        setInterviewData={setInterviewData}
        approveStatus={approveStatus}
        onSubmit={handleApproveSubmit}
        onClose={() => { setIsApproveModalOpen(false); setApprovingAppId(null); setInterviewData({ time: '', address: '' }); setApproveStatus({ loading: false, error: '' }); }}
      />
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successMessage}
      />
    </div>
  );
}
