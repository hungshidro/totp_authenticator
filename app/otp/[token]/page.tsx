'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { storage } from '@/lib/storage'

interface OTPData {
  code: string
  timeRemaining: number
  name: string
  issuer?: string
}

export default function OTPPage() {
  const params = useParams()
  const token = params.token as string
  const [otpData, setOtpData] = useState<OTPData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const fetchOTP = async () => {
    try {
      const response = await fetch(`/api/totp/${token}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra')
      }

      setOtpData(data)
      setError('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOTP()
    
    // Kiểm tra xem token đã được lưu chưa
    setIsSaved(storage.isSaved(token))

    // Refresh OTP every second để cập nhật countdown
    const interval = setInterval(() => {
      fetchOTP()
    }, 1000)

    return () => clearInterval(interval)
  }, [token])

  const copyToClipboard = async () => {
    if (otpData?.code) {
      await navigator.clipboard.writeText(otpData.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSaveToDevice = () => {
    if (otpData) {
      storage.save({
        token,
        name: otpData.name,
        issuer: otpData.issuer,
        url: window.location.href,
        savedAt: new Date().toISOString(),
      })
      setIsSaved(true)
    }
  }

  const handleRemoveFromDevice = () => {
    storage.remove(token)
    setIsSaved(false)
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

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Lỗi</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Quay lại trang chủ
          </a>
        </div>
      </main>
    )
  }

  const progress = otpData ? (otpData.timeRemaining / 30) * 100 : 0

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {otpData?.name}
          </h1>
          {otpData?.issuer && (
            <p className="text-gray-500 text-sm">{otpData.issuer}</p>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 mb-6">
          <div className="text-center mb-4">
            <div className="text-5xl font-mono font-bold text-gray-800 tracking-wider">
              {otpData?.code.slice(0, 3)}{' '}
              <span className="text-blue-600">{otpData?.code.slice(3)}</span>
            </div>
          </div>

          <button
            onClick={copyToClipboard}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors border border-gray-200 flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <span>✓</span>
                <span>Đã sao chép!</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>Sao chép mã</span>
              </>
            )}
          </button>

          {/* Nút Lưu/Xóa khỏi thiết bị */}
          {isSaved ? (
            <button
              onClick={handleRemoveFromDevice}
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-medium py-3 px-4 rounded-lg transition-colors border border-red-200 flex items-center justify-center gap-2"
            >
              <span>🗑️</span>
              <span>Xóa khỏi thiết bị</span>
            </button>
          ) : (
            <button
              onClick={handleSaveToDevice}
              className="w-full bg-green-50 hover:bg-green-100 text-green-700 font-medium py-3 px-4 rounded-lg transition-colors border border-green-200 flex items-center justify-center gap-2"
            >
              <span>💾</span>
              <span>Lưu vào thiết bị</span>
            </button>
          )}
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Thời gian còn lại</span>
            <span className="text-lg font-bold text-gray-800">
              {otpData?.timeRemaining}s
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                (otpData?.timeRemaining || 0) <= 5
                  ? 'bg-red-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">💡 Mẹo:</span> Mã OTP sẽ tự động
              cập nhật mỗi 30 giây
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-2">
              <span className="font-semibold">🔗 Link của bạn:</span>
            </p>
            <div className="bg-white p-2 rounded border border-gray-300">
              <code className="text-xs text-gray-700 break-all">
                {typeof window !== 'undefined' ? window.location.href : ''}
              </code>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Lưu link này để xem OTP bất cứ lúc nào
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-4">
            <a
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              ← Thêm tài khoản khác
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="/saved"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
            >
              <span>💾</span>
              <span>Danh sách đã lưu</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
