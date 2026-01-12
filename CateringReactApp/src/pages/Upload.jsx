import React, { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { CameraIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/outline";
import { api } from "../services/api";
import toast from "react-hot-toast";

const Upload = () => {
  const [tabValue, setTabValue] = useState(0);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [uploadResponse, setUploadResponse] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const { setIsFooterVisible } = useOutletContext() || { setIsFooterVisible: () => {} };

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Cleanup camera on component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    return () => setIsFooterVisible(true);
  }, [setIsFooterVisible]);

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(
                new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }),
              );
            },
            "image/jpeg",
            0.7,
          );
        };
      };
    });
  };

  const handleUpload = async (file) => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload only image files");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const processedFile = await compressImage(file);
      toast.success("Image compressed successfully");

      const formData = new FormData();
      formData.append("file", processedFile);

      const response = await api.post("/api/bills/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadResponse(response.data);
      setShowSuccessDialog(true);
      setIsFooterVisible(false);
      toast.success("Image uploaded successfully");
      setFile(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error uploading file. Please try again.",
      );
      toast.error(err.message || "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      handleUpload(selectedFile);
    }
  };

  const startCamera = async () => {
    setCameraError("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera is not supported on this device or browser");
        toast.error("Camera not available");
        return;
      }

      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current
          .play()
          .catch((e) => console.error("Video play error:", e));
      }
    } catch (err) {
      console.error("Camera error:", err);
      let errorMsg = "Error accessing camera";

      if (err.name === "NotAllowedError") {
        errorMsg =
          "Camera permission denied. Please allow camera access in settings.";
      } else if (err.name === "NotFoundError") {
        errorMsg = "No camera found on this device";
      } else if (err.name === "NotReadableError") {
        errorMsg = "Camera is already in use by another app";
      } else if (err.name === "OverconstrainedError") {
        errorMsg = "Camera does not support requested resolution";
      }

      setCameraError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
    setIsFooterVisible(true);
    setCameraError("");
  };

  const capturePhoto = async () => {
    try {
      if (!videoRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      context.drawImage(video, 0, 0);

      canvas.toBlob(
        (blob) => {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          stopCamera();
          setFile(file);
          handleUpload(file);
        },
        "image/jpeg",
        0.8,
      );
    } catch (err) {
      console.error("Capture error:", err);
      toast.error("Error capturing photo");
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      handleUpload(droppedFile);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const onCloseDialog = () => {
    setShowSuccessDialog(false);
    setIsFooterVisible(true);
    setUploadResponse(null);
  };

  const openCameraModal = () => {
    setShowCameraModal(true);
    setIsFooterVisible(false);
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6 w-full">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-gray-900">
        Upload Document
      </h1>

      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center sm:justify-start border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setTabValue(0)}
          className={`flex items-center gap-2 px-3 md:px-6 py-3 font-medium text-xs sm:text-sm md:text-base whitespace-nowrap transition-colors ${
            tabValue === 0
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <CloudArrowUpIcon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="hidden sm:inline">Expenditure</span>
          <span className="sm:hidden">Upload Expense</span>
        </button>
        <button
          disabled
          className="flex items-center gap-2 px-3 md:px-6 py-3 font-medium text-gray-400 cursor-not-allowed text-xs sm:text-sm md:text-base whitespace-nowrap"
        >
          <SparklesIcon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="hidden sm:inline">Receipt</span>
          <span className="sm:hidden">Receipts Soon</span>
        </button>
      </div>

      {/* Tab Content */}
      {tabValue === 0 ? (
        <>
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div
            className="bg-white border-2 border-dashed border-blue-600 rounded-lg p-4 md:p-8 mb-6 transition-all"
            style={{
              borderColor: isDragging ? "#dc004e" : "#1976d2",
              backgroundColor: isDragging ? "#f8f9fa" : "#ffffff",
            }}
            onDrop={!isMobile ? handleDrop : undefined}
            onDragOver={!isMobile ? handleDragOver : undefined}
            onDragLeave={!isMobile ? handleDragLeave : undefined}
          >
            {/* File Input - Hidden */}
            <input
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              id="file-input"
              type="file"
              onChange={handleFileChange}
              disabled={loading}
            />

            {/* Buttons Container - Responsive */}
            <div className="flex flex-col gap-3 mb-4">
              <label htmlFor="file-input" className="w-full">
                <button
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm md:text-base"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                      <span>Select Image</span>
                    </>
                  )}
                </button>
              </label>

              <button
                onClick={openCameraModal}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm md:text-base"
              >
                <CameraIcon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span>Take Photo</span>
              </button>
            </div>

            {/* Instructions */}
            <p className="text-center text-gray-600 text-sm">
              {isMobile
                ? "Select an image or take a photo"
                : "Drag and drop your image here or use the buttons above"}
            </p>
            <p className="text-center text-gray-500 text-xs mt-2">
              Supported formats: JPG, PNG, GIF
            </p>
            {file && (
              <p className="text-center text-green-600 text-sm mt-3 font-medium">
                ✓ Selected: {file.name}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 md:p-12 text-center">
          <SparklesIcon className="w-12 h-12 md:w-16 md:h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            Coming Soon
          </h2>
          <p className="text-gray-600 text-sm md:text-base">
            Receipt upload functionality will be available soon!
          </p>
        </div>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">
                Capture Photo
              </h2>
              <button
                onClick={stopCamera}
                className="p-1 text-gray-600 hover:text-gray-900 transition"
                aria-label="Close camera"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Camera Error */}
            {cameraError && (
              <div className="m-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {cameraError}
                <p className="mt-2 text-xs">
                  Please try using the "Select Image" button instead.
                </p>
              </div>
            )}

            {/* Video Stream */}
            {!cameraError && (
              <div className="flex-1 flex items-center justify-center bg-black overflow-hidden min-h-[300px] md:min-h-[400px]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Hidden Canvas */}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Modal Actions */}
            {!cameraError && (
              <div className="flex gap-3 p-4 border-t border-gray-200">
                <button
                  onClick={stopCamera}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  <CheckIcon className="w-4 h-4 md:w-5 md:h-5" />
                  Capture
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 max-h-[70vh] overflow-y-auto">
            <h2 className="text-xl md:text-2xl font-bold text-green-600 mb-4">
              ✓ Upload Successful
            </h2>
            <p className="text-gray-600 mb-4 text-sm md:text-base">
              The expenditure has been successfully processed.
            </p>
            {uploadResponse && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6 text-sm">
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                    Vendor
                  </p>
                  <p className="text-gray-900 font-medium">
                    {uploadResponse.vendor || "N/A"}
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                    Date
                  </p>
                  <p className="text-gray-900 font-medium">
                    {uploadResponse.date
                      ? new Date(uploadResponse.date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                    Total Amount
                  </p>
                  <p className="text-gray-900 font-medium text-lg">
                    ₹{uploadResponse.totalAmount?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                    Items Processed
                  </p>
                  <p className="text-gray-900 font-medium">
                    {uploadResponse.lineItems?.length || 0} items
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={onCloseDialog}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm md:text-base"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
