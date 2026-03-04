"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import jsQR from "jsqr";
import { storage } from "@/lib/storage";
import { deviceManager } from "@/lib/device";

export default function Home() {
  const [uri, setUri] = useState("");
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [secret, setSecret] = useState("");
  const [mode, setMode] = useState<"uri" | "manual" | "qr-image">("qr-image");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrPreview, setQrPreview] = useState<string>("");
  const [savedCount, setSavedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Đếm số lượng tokens đã lưu
    setSavedCount(storage.getAll().length);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setLoading(true);

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Vui lòng chọn file ảnh (PNG, JPG, etc.)");
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target?.result as string;
        setQrPreview(imageData);

        // Decode QR code
        try {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              throw new Error("Không thể xử lý ảnh");
            }

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            const code = jsQR(
              imageData.data,
              imageData.width,
              imageData.height,
            );

            if (!code) {
              setError(
                "Không tìm thấy mã QR trong ảnh. Vui lòng thử ảnh khác.",
              );
              setLoading(false);
              return;
            }

            // Validate OTP URI format
            if (!code.data.startsWith("otpauth://totp/")) {
              setError(
                "Mã QR không đúng định dạng TOTP. Cần format: otpauth://totp/...",
              );
              setLoading(false);
              return;
            }

            // Success - set URI
            setUri(code.data);
            setLoading(false);
          };

          img.onerror = () => {
            setError("Không thể tải ảnh. Vui lòng thử file khác.");
            setLoading(false);
          };

          img.src = imageData;
        } catch (err: any) {
          setError(err.message || "Lỗi khi đọc mã QR");
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Không thể đọc file ảnh");
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const deviceId = await deviceManager.getDeviceId();
      const body =
        mode === "qr-image" || mode === "uri"
          ? { uri, deviceId }
          : { name, issuer, secret, deviceId };

      const response = await fetch("/api/totp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Có lỗi xảy ra");
      }

      // Redirect đến trang OTP
      router.push(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-800">
            TOTP Authenticator
          </h1>
          <Link
            href="/saved"
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm flex items-center gap-1"
          >
            💾 <span className="font-bold">{savedCount}</span>
          </Link>
        </div>
        <p className="text-center text-gray-600 mb-6">Thêm tài khoản mới</p>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("qr-image");
              setError("");
              setUri("");
              setQrPreview("");
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === "qr-image"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📷 Upload QR
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("uri");
              setError("");
              setQrPreview("");
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === "uri"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            QR Text
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("manual");
              setError("");
              setQrPreview("");
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === "manual"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Thủ công
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "qr-image" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload ảnh QR Code
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                {qrPreview ? (
                  <div className="space-y-3">
                    <img
                      src={qrPreview}
                      alt="QR Preview"
                      className="max-w-full max-h-64 mx-auto rounded"
                    />
                    <p className="text-sm text-green-600 font-medium">
                      ✓ QR Code đã được phát hiện
                    </p>
                    {uri && (
                      <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 break-all">
                        {uri}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQrPreview("");
                        setUri("");
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Chọn ảnh khác
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-4xl">📷</div>
                    <p className="text-gray-600 font-medium">
                      Click để chọn ảnh QR Code
                    </p>
                    <p className="text-xs text-gray-500">
                      Hỗ trợ PNG, JPG, JPEG, GIF
                    </p>
                  </div>
                )}
              </div>

              {loading && !error && (
                <div className="mt-3 flex items-center justify-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Đang đọc mã QR...</span>
                </div>
              )}
            </div>
          ) : mode === "uri" ? (
            <div>
              <label
                htmlFor="uri"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                OTP URI hoặc chuỗi từ QR Code
              </label>
              <textarea
                id="uri"
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                placeholder="otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                rows={4}
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Paste chuỗi otpauth:// từ QR code
              </p>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tên tài khoản *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="issuer"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Issuer (Tùy chọn)
                </label>
                <input
                  id="issuer"
                  type="text"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="Google, Microsoft, GitHub..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                />
              </div>

              <div>
                <label
                  htmlFor="secret"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Secret Key *
                </label>
                <input
                  id="secret"
                  type="text"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="JBSWY3DPEHPK3PXP"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">
                  Secret key dạng base32
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === "qr-image" && !uri)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Đang xử lý..." : "Tạo mã OTP"}
          </button>
        </form>
      </div>
    </main>
  );
}
