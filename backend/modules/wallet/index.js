import walletService from './services/wallet.service.js';
// Expose public API of the wallet module for other modules to use
export default {
  /**
   * Tạo ví mới cho người dùng
   * @param {String} ownerId 
   * @param {String} ownerType 'user' | 'tutor'
   * @returns {Object} wallet info
   */
  createWalletForUser: (ownerId, ownerType) => walletService.createWallet(ownerId, ownerType),

  /**
   * Lấy số dư hiện tại của người dùng
   * @param {String} ownerId 
   * @param {String} ownerType 'user' | 'tutor'
   * @returns {Object} wallet info
   */
  getBalance: (ownerId, ownerType) => walletService.getWalletBalance(ownerId, ownerType),

  /**
   * Cộng tiền vào ví an toàn
   * @param {String} ownerId 
   * @param {String} ownerType 
   * @param {Number} amount 
   * @param {String} description 
   * @returns {Object} result
   */
  addFunds: (ownerId, ownerType, amount, description) => walletService.addFunds(ownerId, ownerType, amount, description),

  /**
   * Trừ tiền trong ví an toàn (Dùng khi thanh toán khóa học/đặt lịch)
   * @param {String} ownerId 
   * @param {String} ownerType 
   * @param {Number} amount 
   * @param {String} description 
   * @returns {Object} result
   */
  payForService: (ownerId, ownerType, amount, description) => walletService.deductFunds(ownerId, ownerType, amount, description)
};
