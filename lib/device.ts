import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Device ID management
export const deviceManager = {
  // Lấy hoặc tạo device ID cho thiết bị này
  async getDeviceId(): Promise<string> {
    if (typeof window === 'undefined') return '';
    
    const STORAGE_KEY = 'totp_device_id';
    let deviceId = localStorage.getItem(STORAGE_KEY);
    
    if (!deviceId) {
      try {
        // Initialize FingerprintJS và generate device ID
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        deviceId = result.visitorId;
        localStorage.setItem(STORAGE_KEY, deviceId);
      } catch (error) {
        // Fallback nếu FingerprintJS fail
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem(STORAGE_KEY, deviceId);
      }
    }
    
    return deviceId;
  },
};
