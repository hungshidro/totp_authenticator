// Quản lý localStorage cho saved links

export interface SavedToken {
  token: string
  name: string
  issuer?: string
  url: string
  savedAt: string
}

const STORAGE_KEY = 'totp_saved_tokens'

export const storage = {
  // Lấy tất cả tokens đã lưu
  getAll: (): SavedToken[] => {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  // Lưu token mới
  save: (token: SavedToken): void => {
    if (typeof window === 'undefined') return
    try {
      const tokens = storage.getAll()
      // Kiểm tra xem đã tồn tại chưa
      const exists = tokens.find(t => t.token === token.token)
      if (!exists) {
        tokens.push(token)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
      }
    } catch (error) {
      console.error('Error saving token:', error)
    }
  },

  // Xóa token
  remove: (token: string): void => {
    if (typeof window === 'undefined') return
    try {
      const tokens = storage.getAll()
      const filtered = tokens.filter(t => t.token !== token)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error('Error removing token:', error)
    }
  },

  // Kiểm tra token đã được lưu chưa
  isSaved: (token: string): boolean => {
    const tokens = storage.getAll()
    return tokens.some(t => t.token === token)
  },
}
