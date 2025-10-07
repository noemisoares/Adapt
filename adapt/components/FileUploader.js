"use client";

export default function FileUploader({ onFileSelect }) {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="file-uploader">
      <label htmlFor="file-upload" className="btn upload-btn">
        Escolher Arquivo
      </label>
      <input
        id="file-upload"
        type="file"
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}
