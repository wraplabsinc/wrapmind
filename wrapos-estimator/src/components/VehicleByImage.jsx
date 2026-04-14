import { useState, useRef } from 'react';
import Button from './ui/Button';
import { analyzeVehicleImage } from '../lib/ai.js';
import { uploadVehicleImage, validateFile } from '../lib/storage.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function VehicleByImage({ onSelect, selectedCar }) {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { orgId } = useAuth();

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setError(null);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera unavailable. Use upload instead.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setImage(dataUrl);
    setImageFile(null);
    setPreview(dataUrl);
    setUploadError(null);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationErr = validateFile(file);
    if (validationErr) {
      setUploadError(validationErr);
      return;
    }

    setImageFile(file);
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setImage(dataUrl);
      setPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setImage(null);
    setImageFile(null);
    setPreview(null);
    setResults([]);
    setError(null);
    setUploadError(null);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeVehicleImage(image);

      if (!result || (!result.year && !result.make)) {
        setError('Could not identify vehicle. Please try a clearer photo or use VIN/manual search.');
      } else {
        const label = [result.year, result.make, result.model, result.trim].filter(Boolean).join(' ');
        setResults([{
          year: result.year, make: result.make, model: result.model, trim: result.trim || '',
          label, vehicleType: result.vehicleType, confidence: result.confidence,
          _capturedImage: imageFile || image,
        }]);
      }
    } catch (err) {
      setError(err.message || 'Analysis failed. Check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (car) => {
    if (!orgId) {
      onSelect({ ...car, _capturedImage: undefined });
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const vehicleId = car.vehicleId || crypto.randomUUID();
      const source = car._capturedImage || image;
      const { url, thumbnailUrl } = await uploadVehicleImage(source, orgId, vehicleId);

      onSelect({
        ...car,
        _capturedImage: undefined,
        imageUrl: url,
        thumbnailUrl,
        image_urls: [url],
      });
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message);
      onSelect({ ...car, _capturedImage: undefined });
    } finally {
      setUploading(false);
    }
  };

  if (!image) {
    return (
      <div>
        <div className="aspect-video bg-gray-50 dark:bg-[#1B2A3E] rounded overflow-hidden relative border border-gray-200 dark:border-[#243348]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
              <svg className="w-10 h-10 text-[#64748B] dark:text-[#4A6380]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] text-center">Take a photo or upload from gallery to identify</p>
              <label className="h-8 px-4 rounded wm-btn-primary cursor-pointer flex items-center">
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
        {(error || uploadError) && !cameraActive && (
          <p className="text-center text-red-500 text-xs mt-2">{uploadError || error}</p>
        )}
        <div className="mt-3 flex gap-2">
          <button
            onClick={startCamera}
            className="flex-1 h-8 rounded bg-gray-100 dark:bg-[#243348] text-gray-700 dark:text-gray-300 font-medium text-xs border border-gray-200 dark:border-[#243348] hover:bg-gray-200 transition-colors"
          >
            Camera
          </button>
          <label className="flex-1 h-8 rounded bg-gray-100 dark:bg-[#243348] text-gray-700 dark:text-gray-300 font-medium text-xs border border-gray-200 dark:border-[#243348] hover:bg-gray-200 transition-colors text-center cursor-pointer flex items-center justify-center">
            Gallery
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <Button variant="primary" className="flex-1 h-8 rounded font-medium text-xs disabled:opacity-40 disabled:cursor-not-allowed" onClick={capturePhoto} disabled={!cameraActive}>
            Capture
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="aspect-video bg-gray-50 dark:bg-[#1B2A3E] rounded overflow-hidden border border-gray-200 dark:border-[#243348]">
          <img src={preview} alt="Vehicle" className="w-full h-full object-contain" />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleRetake}
            disabled={loading || uploading}
            className="flex-1 h-8 rounded bg-gray-100 dark:bg-[#243348] text-gray-700 dark:text-gray-300 font-medium text-xs border border-gray-200 dark:border-[#243348] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
          >
            Retake
          </button>
          <Button variant="primary" className="flex-1 h-8 rounded font-medium text-xs disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleAnalyze} disabled={loading || uploading}>
            {loading ? 'Analyzing...' : 'Identify Vehicle'}
          </Button>
        </div>
      </div>

      {(error || uploadError) && (
        <div className="bg-white dark:bg-[#1B2A3E] rounded p-4 text-center border border-gray-200 dark:border-[#243348]">
          <p className="text-red-500 text-sm">{uploadError || error}</p>
        </div>
      )}

      {(loading || uploading) && (
        <div className="flex flex-col items-center gap-2 py-8">
          <div className="w-5 h-5 border border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          {uploading && <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Uploading image...</p>}
        </div>
      )}

      {results.length > 0 && !uploading && (
        <div className="space-y-2">
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE] px-1">Result</p>
          {results.map((car, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(car)}
              disabled={uploading}
              className={`w-full text-left rounded p-3 border transition-all ${
                selectedCar?.id === car.id
                  ? 'bg-[#2E8BF0]/10 border-[#2E8BF0]'
                  : 'bg-white dark:bg-[#1B2A3E] border-gray-200 dark:border-[#243348] hover:border-[#2E8BF0]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-[#F8FAFE] text-sm">
                    {car.year} {car.make} {car.model}
                  </p>
                  {car.trim && (
                    <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">{car.trim}</p>
                  )}
                </div>
                <span className="text-xs px-2 py-0.5 rounded border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] bg-gray-50 dark:bg-[#243348] flex-shrink-0 ml-2">
                  {car.vehicle_type}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
