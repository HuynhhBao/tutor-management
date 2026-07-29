import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Tự động đính kèm Token (cookie) vào tất cả request
  validateStatus: () => true // Không ném lỗi (throw error) với status 400/500 để tương thích ngược với code cũ đang dùng res.ok
});

// Axios Interceptor để bắt lỗi toàn cục
axiosInstance.interceptors.response.use((response) => {
  // Nếu server trả về 401 Unauthorized (ngoại trừ khi check auth /auth/me hoặc đang ở trang login)
  if (response.status === 401 && !response.config.url.includes('/auth/login') && !response.config.url.includes('/auth/me')) {
    // Phát một event tùy chỉnh để App.jsx bắt và điều hướng về trang đăng nhập
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  return response;
});

// Gói bọc Axios đóng giả làm `fetch` để KHÔNG làm vỡ 23 file code cũ
const apiClient = async (input, init = {}) => {
  let url = typeof input === 'string' ? input : input.url;
  
  // Tự động thay thế link cứng thành link lấy từ biến môi trường
  if (url.startsWith('http://localhost:3001/api')) {
    url = url.replace('http://localhost:3001/api', '');
  } else if (url.startsWith('http://localhost:3001')) {
    // Xử lý riêng cho các link ảnh tĩnh /uploads
    url = url.replace('http://localhost:3001', '');
    return window.originalFetch ? window.originalFetch(input, init) : fetch(input, init);
  }

  const config = {
    method: init.method || 'GET',
    url: url,
    headers: init.headers ? { ...init.headers } : {},
  };
  
  // Chuyển body của fetch thành data của axios
  if (init.body) {
    config.data = init.body;
  }

  // Xử lý riêng biệt cho FormData (Upload file)
  if (init.body instanceof FormData) {
    if (config.headers['Content-Type']) {
      delete config.headers['Content-Type']; // Để trình duyệt tự sinh boundary cho FormData
    }
  }

  try {
    const response = await axiosInstance(config);
    
    // Trả về một Object bắt chước y hệt kết quả của hàm fetch()
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      // Axios đã tự parse JSON rồi, nên hàm json() chỉ việc return data
      json: async () => typeof response.data === 'string' ? JSON.parse(response.data) : response.data
    };
  } catch (error) {
    throw error;
  }
};

export const api = axiosInstance;
export default apiClient;
