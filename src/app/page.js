"use client";

import { useState, useRef, useEffect } from "react";

export default function IntruderDetectionSystem() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [detectionMode, setDetectionMode] = useState("auto");
  const [alerts, setAlerts] = useState([]);
  const [systemStatus, setSystemStatus] = useState("offline");
  const [currentTime, setCurrentTime] = useState("");
  const [isClient, setIsClient] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Update time every second
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    
    updateTime(); // Initial time
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const openCamera = async () => {
    try {
      console.log("Attempting to open camera...");
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is not supported in this browser");
      }
      
      // Wait a bit to ensure the component is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!videoRef.current) {
        console.error("Video element not found, retrying...");
        // Try to wait a bit more and check again
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!videoRef.current) {
          throw new Error("Video element not found after retry");
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      console.log("Camera stream obtained:", stream);
      
      // Set the stream to the video element
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      
      // Wait for the video to load
      videoRef.current.onloadedmetadata = () => {
        console.log("Video metadata loaded, playing video");
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
      };
      
      setIsCameraOpen(true);
      setSystemStatus("online");
      addAlert("Camera activated successfully");
      console.log("Camera opened successfully");
      
    } catch (err) {
      console.error("Error accessing camera:", err);
      let errorMessage = "Could not access camera. ";
      
      if (err.name === 'NotAllowedError') {
        errorMessage += "Please allow camera permissions and try again.";
      } else if (err.name === 'NotFoundError') {
        errorMessage += "No camera device found.";
      } else if (err.name === 'NotReadableError') {
        errorMessage += "Camera is already in use by another application.";
      } else {
        errorMessage += err.message || "Unknown error occurred.";
      }
      
      alert(errorMessage);
      addAlert(`Camera error: ${err.name || 'Unknown'}`);
    }
  };

  const closeCamera = () => {
    console.log("Closing camera...");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsRecording(false);
    setSystemStatus("offline");
    addAlert("Camera deactivated");
    console.log("Camera closed successfully");
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const addAlert = (message) => {
    const newAlert = {
      id: Date.now(),
      message,
      timestamp: new Date().toLocaleTimeString(),
      type: "warning"
    };
    setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zM9 9V6h2v3h3v2h-3v3H9v-3H6V9h3z"/>
                  </svg>
                </div>
                <h1 className="text-xl font-bold">Intruder Detection System</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                systemStatus === "online" ? "bg-green-600" : "bg-red-600"
              }`}>
                {systemStatus.toUpperCase()}
              </div>
              <div className="text-sm text-gray-300">
                {isClient ? currentTime : "--:--:--"}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Camera Feed</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isCameraOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-400">
                      {isCameraOpen ? 'Live' : 'Offline'}
                    </span>
                  </div>
                  {isRecording && (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-red-400">Recording</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  {isCameraOpen ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      onLoadedMetadata={() => {
                        console.log("Video metadata loaded");
                        if (videoRef.current) {
                          videoRef.current.play().catch(e => console.error("Error playing video:", e));
                        }
                      }}
                      onError={(e) => {
                        console.error("Video error:", e);
                        addAlert("Video playback error");
                      }}
                      onCanPlay={() => console.log("Video can play")}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-400">Camera is offline</p>
                        <p className="text-xs text-gray-500 mt-1">Click "Open Camera" to start</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {isCameraOpen && (
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                      <span className="text-sm text-white">1280x720</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="mt-6 flex flex-wrap gap-4">
                {!isCameraOpen ? (
                  <button
                    onClick={() => {
                      setIsCameraOpen(true);
                      setTimeout(() => {
                        openCamera();
                      }, 100);
                    }}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Open Camera</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={closeCamera}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                      </svg>
                      <span>Close Camera</span>
                    </button>
                    <button
                      onClick={toggleRecording}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        isRecording 
                          ? "bg-red-600 hover:bg-red-700" 
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {isRecording ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H2.75a.75.75 0 01-.75-.75V4.75z"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.75 2.5a.75.75 0 00-1.5 0v15a.75.75 0 001.5 0v-15zM14.25 2.5a.75.75 0 00-1.5 0v15a.75.75 0 001.5 0v-15z"/>
                        </svg>
                      )}
                      <span>{isRecording ? "Stop Recording" : "Start Recording"}</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => addAlert("Manual scan initiated")}
                  className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Manual Scan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Detection Settings */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Detection Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Detection Mode</label>
                  <select
                    value={detectionMode}
                    onChange={(e) => setDetectionMode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="auto">Automatic</option>
                    <option value="manual">Manual</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sensitivity</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    defaultValue="5"
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifications"
                    defaultChecked
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="notifications" className="text-sm">Enable Notifications</label>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
              <div className="space-y-3">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{alert.timestamp}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">No alerts</p>
                  </div>
                )}
              </div>
            </div>

            {/* System Stats */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Uptime</span>
                  <span className="text-sm">2h 15m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Detections Today</span>
                  <span className="text-sm">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Storage Used</span>
                  <span className="text-sm">12.5 GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Last Backup</span>
                  <span className="text-sm">Yesterday</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
