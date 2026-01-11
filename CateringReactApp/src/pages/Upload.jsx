import React, { useState, useRef } from "react";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { CameraIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/outline";
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
  const fileInputRef = useRef(null);

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

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);

      stream.getTracks().forEach((track) => track.stop());

      canvas.toBlob(
        (blob) => {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setFile(file);
          handleUpload(file);
        },
        "image/jpeg",
        0.8,
      );
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Error accessing camera");
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
    setUploadResponse(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">
        Upload Document
      </h1>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setTabValue(0)}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
            tabValue === 0
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <CloudArrowUpIcon className="w-5 h-5" />
          Expenditure
        </button>
        <button
          disabled
          className="flex items-center gap-2 px-6 py-3 font-medium text-gray-400 cursor-not-allowed"
        >
          <SparklesIcon className="w-5 h-5" />
          Receipt
        </button>
      </div>

      {/* Tab Content */}
      {tabValue === 0 ? (
        <>
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div
            className="bg-white border-2 border-dashed border-blue-600 rounded-lg p-8 mb-6 transition-all"
            style={{
              borderColor: isDragging ? "#dc004e" : "#1976d2",
              backgroundColor: isDragging ? "#f8f9fa" : "#ffffff",
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex gap-3 justify-center mb-4">
              <input
                ref={fileInputRef}
                accept="image/*"
                style={{ display: "none" }}
                id="file-input"
                type="file"
                onChange={handleFileChange}
                disabled={loading}
              />
              <label htmlFor="file-input">
                <button
                  as="span"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-5 h-5" />
                      Select Expenditure Image
                    </>
                  )}
                </button>
              </label>

              <button
                onClick={handleCameraCapture}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <CameraIcon className="w-5 h-5" />
                Camera
              </button>
            </div>

            <p className="text-center text-gray-600 text-sm">
              Drag and drop your expenditure image here or use the buttons above
            </p>
            <p className="text-center text-gray-500 text-xs mt-2">
              Supported formats: JPG, PNG, GIF
            </p>
            {file && (
              <p className="text-center text-gray-600 text-sm mt-3">
                <span className="font-medium">Selected:</span> {file.name}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <SparklesIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-600">
            Receipt upload functionality will be available soon!
          </p>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Upload Successful
            </h2>
            <p className="text-gray-600 mb-4">
              The expenditure has been successfully processed.
            </p>
            {uploadResponse && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-6">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Vendor:</span>{" "}
                  {uploadResponse.vendor}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(uploadResponse.date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Total Amount:</span> ₹
                  {uploadResponse.totalAmount?.toFixed(2)}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Items Processed:</span>{" "}
                  {uploadResponse.lineItems?.length || 0}
                </p>
              </div>
            )}
            <button
              onClick={onCloseDialog}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
