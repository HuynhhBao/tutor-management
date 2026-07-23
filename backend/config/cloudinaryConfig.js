import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Cấu hình Cloudinary
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

let storage;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'edumatch_classroom',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip'],
      resource_type: 'auto', // Tự động phát hiện loại file tài liệu/ảnh
    },
  });
  console.log('Cloudinary Storage configured successfully for Classroom files.');
} else {
  console.warn('CLOUDINARY credentials not found. Falling back to local storage for Classroom files.');
  
  // Đảm bảo thư mục local upload tồn tại
  const uploadDir = 'uploads/classroom';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

// Giới hạn tải file 5MB theo chuẩn SonarQube (Denial of Service mitigation)
export const uploadClassroomFile = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
