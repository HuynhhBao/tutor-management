import React from 'react';
import Modal from '../common/Modal';
import { User, Mail, UserCircle, BookOpen, GraduationCap } from 'lucide-react';

const TutorFormModal = ({ isOpen, editingId, formData, onChange, onSubmit, onClose }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={editingId ? 'Chỉnh sửa gia sư' : 'Thêm gia sư mới'}
  >
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Họ và tên */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
        <div className="relative">
          <input type="text" name="fullName" required value={formData.fullName} onChange={onChange}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="Nguyễn Văn A" />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <User className="w-4 h-4 text-slate-400" />
          </span>
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <div className="relative">
          <input type="email" name="email" value={formData.email} onChange={onChange}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="email@example.com (Không bắt buộc)" />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Mail className="w-4 h-4 text-slate-400" />
          </span>
        </div>
      </div>

      {/* Giới tính + Tuổi */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Giới tính</label>
          <div className="relative">
            <select name="gender" value={formData.gender} onChange={onChange}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none bg-white">
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <UserCircle className="w-4 h-4 text-slate-400" />
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tuổi</label>
          <input type="number" name="age" required min="18" max="100" value={formData.age} onChange={onChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="25" />
        </div>
      </div>

      {/* Môn dạy */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Môn dạy</label>
        <div className="relative">
          <input type="text" name="subject" required value={formData.subject} onChange={onChange}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="Toán, Lý, Tiếng Anh..." />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <BookOpen className="w-4 h-4 text-slate-400" />
          </span>
        </div>
      </div>

      {/* Bằng cấp */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Bằng cấp</label>
        <div className="relative">
          <input type="text" name="qualification" required value={formData.qualification} onChange={onChange}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="Cử nhân sư phạm, IELTS 8.0..." />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <GraduationCap className="w-4 h-4 text-slate-400" />
          </span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onClose}
          className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
          Hủy
        </button>
        <button type="submit"
          className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm">
          {editingId ? 'Cập nhật' : 'Lưu gia sư'}
        </button>
      </div>
    </form>
  </Modal>
);

export default TutorFormModal;
