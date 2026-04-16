import { useState } from 'react';
import { isValid3DFile, getFormatFromFileName } from '../utils/fileUtils';

interface UseFileUploadProps {
  onFileSelect?: (file: File, format: string) => void;
}

export function useFileUpload({ onFileSelect }: UseFileUploadProps = {}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelFormat, setModelFormat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (!isValid3DFile(file)) {
      const msg = `Файл "${file.name}" не является 3D объектом`;
      setError(msg);
      setTimeout(() => setError(null), 3000);
      return;
    }

    const format = getFormatFromFileName(file.name);
    setSelectedFile(file);
    setModelFormat(format);
    onFileSelect?.(file, format);
  };

  const resetFile = () => {
    setSelectedFile(null);
    setModelFormat(null);
  };

  return {
    selectedFile,
    modelFormat,
    error,
    handleFileSelect,
    resetFile,
    setError,
  };
}