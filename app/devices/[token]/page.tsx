"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { deviceManager } from "@/lib/device";

interface Device {
  id: string;
  deviceId: string;
  ipAddress: string | null;
  userAgent: string | null;
  isSaved: boolean;
  isBlocked: boolean;
  firstAccess: string;
  lastAccess: string;
  isOwner: boolean;
}

export default function DeviceManagementPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentDeviceId, setCurrentDeviceId] = useState<string>("");
  const [blockingDeviceId, setBlockingDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const id = await deviceManager.getDeviceId();
      setCurrentDeviceId(id);
      fetchDevices();
    };
    init();
  }, [token]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const deviceId = await deviceManager.getDeviceId();
      
      const response = await fetch(`/api/totp/${token}/devices`, {
        headers: {
          "x-device-id": deviceId,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch devices");
      }

      const data = await response.json();
      setDevices(data.devices);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (deviceId: string, currentBlocked: boolean) => {
    try {
      setBlockingDeviceId(deviceId);
      const myDeviceId = await deviceManager.getDeviceId();
      
      const response = await fetch(`/api/totp/${token}/devices/${deviceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": myDeviceId,
        },
        body: JSON.stringify({ isBlocked: !currentBlocked }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update device");
      }

      // Refresh the list
      await fetchDevices();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBlockingDeviceId(null);
    }
  };

  const truncateId = (id: string) => {
    return `${id.slice(0, 8)}...${id.slice(-8)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-lg">Loading devices...</div>
//       </div>
//     );
//   }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <button
            onClick={() => router.push(`/otp/${token}`)}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Back to OTP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Device Management
            </h1>
            <button
              onClick={() => router.push(`/otp/${token}`)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Back to OTP
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No devices have accessed this link yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Device ID
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      IP Address
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      User Agent
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      First Access
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Last Access
                    </th>
                    <th className="text-center p-3 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-center p-3 font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={device.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {truncateId(device.deviceId)}
                          </code>
                          {device.deviceId === currentDeviceId && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Current
                            </span>
                          )}
                          {device.isOwner && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Owner
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {device.ipAddress || "N/A"}
                      </td>
                      <td className="p-3 text-sm text-gray-600 max-w-xs truncate">
                        {device.userAgent || "N/A"}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {formatDate(device.firstAccess)}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {formatDate(device.lastAccess)}
                      </td>
                      <td className="p-3 text-center">
                        {device.isBlocked ? (
                          <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded text-sm">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded text-sm">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {device.isOwner ? (
                          <span className="text-xs text-gray-400">
                            Cannot block owner
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              handleToggleBlock(device.deviceId, device.isBlocked)
                            }
                            disabled={blockingDeviceId === device.deviceId}
                            className={`px-4 py-2 rounded text-sm font-medium ${
                              device.isBlocked
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-red-500 hover:bg-red-600 text-white"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {blockingDeviceId === device.deviceId
                              ? "..."
                              : device.isBlocked
                              ? "Unblock"
                              : "Block"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
