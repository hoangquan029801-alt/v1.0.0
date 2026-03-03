import React, { useRef } from 'react';

interface ImageFile {
  data: string;
  mimeType: string;
  url: string;
}

interface ImageUploadProps {
  label: string;
  description?: string;
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  multiple?: boolean;
}

export function ImageUpload({ label, description, images, onChange, multiple = false }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: File[]) => {
    if (files.length === 0) return;

    const newImages: ImageFile[] = [];
    let processed = 0;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push({
            data: event.target.result as string,
            mimeType: file.type,
            url: URL.createObjectURL(file)
          });
        }
        processed++;
        if (processed === files.length) {
          onChange(multiple ? [...images, ...newImages] : [newImages[0]]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      processFiles(multiple ? files : [files[0]]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div 
      className="space-y-2 outline-none focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-lg p-1 -m-1 transition-all" 
      tabIndex={0} 
      onPaste={handlePaste}
    >
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {description && <p className="text-xs text-slate-500">{description} (Bạn cũng có thể nhấn Ctrl+V để dán)</p>}
      
      <div className="flex flex-wrap gap-4 mt-2">
        {images.map((img, idx) => (
          <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group">
            <img src={img.data} alt="upload preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}
        
        {(multiple || images.length === 0) && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-colors outline-none"
          >
            <span className="text-xs font-medium px-2 text-center">Click hoặc Dán Ảnh</span>
          </button>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple={multiple}
        className="hidden"
      />
    </div>
  );
}
