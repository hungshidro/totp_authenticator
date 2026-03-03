'use client'

import { useEffect, useState } from 'react'
import { storage, SavedToken } from '@/lib/storage'
import Link from 'next/link'

export default function SavedPage() {
  const [savedTokens, setSavedTokens] = useState<SavedToken[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load saved tokens
    setSavedTokens(storage.getAll())
    setLoading(false)
  }, [])

  const handleDelete = (token: string) => {
    if (confirm('Bạn có chắc muốn xóa tài khoản này khỏi thiết bị?')) {
      storage.remove(token)
      setSavedTokens(storage.getAll())
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              💾 Tài khoản đã lưu
            </h1>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              ← Trang chủ
            </Link>
          </div>
          
          <p className="text-gray-600 text-sm">
            {savedTokens.length} tài khoản được lưu trên thiết bị này
          </p>
        </div>

        {savedTokens.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Chưa có tài khoản nào
            </h2>
            <p className="text-gray-600 mb-6">
              Thêm tài khoản mới và lưu vào thiết bị để truy cập nhanh
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Thêm tài khoản mới
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {savedTokens.map((item) => (
              <div
                key={item.token}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.issuer && (
                        <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {item.issuer}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800 truncate mb-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Đã lưu: {formatDate(item.savedAt)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/otp/${item.token}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Xem OTP
                    </Link>
                    <button
                      onClick={() => handleDelete(item.token)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 px-4 rounded-lg transition-colors border border-red-200 text-sm"
                      title="Xóa khỏi thiết bị"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">⚠️ Lưu ý:</span> Dữ liệu được lưu
            trên thiết bị này (localStorage). Nếu xóa dữ liệu trình duyệt,
            danh sách sẽ bị mất. Hãy lưu link OTP ở nơi an toàn.
          </p>
        </div>
      </div>
    </main>
  )
}
