'use client';

import { useRef, useState } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  files: File[];
  setValue: UseFormSetValue<any>;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

/**
 * @description FileUpload component with multi-file support
 * Displays file preview and allows file removal
 */
export function FileUpload({
  files = [],
  setValue,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const selectedFiles = Array.from(e.target.files || []);

    // 파일 개수 검증
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다`);
      return;
    }

    // 파일 크기 검증
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const oversizedFile = selectedFiles.find((file) => file.size > maxSizeBytes);
    if (oversizedFile) {
      setError(`파일 크기는 ${maxSizeMB}MB를 초과할 수 없습니다 (${oversizedFile.name})`);
      return;
    }

    // 파일 추가
    const newFiles = [...files, ...selectedFiles];
    setValue('files', newFiles);

    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setValue('files', newFiles);
    setError('');
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        첨부파일 {files.length > 0 && `(${files.length}/${maxFiles})`}
      </label>

      {/* 파일 선택 버튼 */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={handleClickUpload}
          disabled={files.length >= maxFiles}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
            files.length >= maxFiles
              ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          )}
        >
          파일 선택
        </button>
        <span className="text-sm text-gray-500">
          최대 {maxFiles}개, 파일당 {maxSizeMB}MB 이하
        </span>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* 파일 목록 */}
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="ml-3 text-sm text-red-600 hover:text-red-800 font-medium"
                aria-label={`${file.name} 삭제`}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 안내 문구 */}
      <p className="mt-2 text-xs text-gray-500">
        지원 형식: 이미지, PDF, Word, Excel, 텍스트 파일
      </p>
    </div>
  );
}
