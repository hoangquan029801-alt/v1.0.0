import React, { useState, useEffect } from 'react';
import { Wand2, Image as ImageIcon, Loader2, Sparkles, Settings2, Layout, Palette, Download, AlertCircle } from 'lucide-react';
import { analyzePrompt, generateDesignImage } from './services/ai';
import { ImageUpload } from './components/ImageUpload';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface DesignState {
  title: string;
  additionalText: string[];
  scene: string;
  style: string;
  aspectRatio: string;
  resolution: string;
  colors: string[];
  notes: string;
  referenceImages: { data: string; mimeType: string; url: string }[];
  productImages: { data: string; mimeType: string; url: string }[];
}

export default function App() {
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [isCheckingKey, setIsCheckingKey] = useState(true);

  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWatermark, setShowWatermark] = useState(false);

  const [design, setDesign] = useState<DesignState>({
    title: '',
    additionalText: [],
    scene: '',
    style: '',
    aspectRatio: '1:1',
    resolution: '1024',
    colors: ['#ff0000', '#ffffff', '#000000'],
    notes: '',
    referenceImages: [],
    productImages: []
  });

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasKey(has);
      }
      setIsCheckingKey(false);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      try {
        await window.aistudio.openSelectKey();
        setHasKey(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const suggestions = await analyzePrompt(prompt);
      setDesign(prev => ({
        ...prev,
        title: suggestions.title || prev.title,
        additionalText: suggestions.additional_text || prev.additionalText,
        scene: suggestions.scene || prev.scene,
        style: suggestions.style || prev.style,
        aspectRatio: suggestions.suggested_ratio || prev.aspectRatio,
        colors: suggestions.suggested_colors?.length ? suggestions.suggested_colors : prev.colors,
        notes: suggestions.notes || prev.notes
      }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze prompt.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const imgData = await generateDesignImage(design);
      setGeneratedImage(imgData);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setHasKey(false);
        setError("API Key error. Please select your API key again.");
      } else {
        setError(err.message || "Failed to generate image.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (isCheckingKey) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center space-y-6 border border-slate-100">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Settings2 size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Yêu cầu API Key</h1>
            <p className="text-slate-500 text-sm">
              Để tạo hình ảnh marketing chất lượng cao, bạn cần cung cấp Gemini API key của mình.
            </p>
          </div>
          <button
            onClick={handleSelectKey}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
          >
            Chọn API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <span className="font-semibold text-lg tracking-tight text-slate-900">Trợ Lý Thiết Kế</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: Controls */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-8">
          
          {/* Step 1: Prompt */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-medium">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">1</div>
              <h2>Mô tả ý tưởng của bạn</h2>
            </div>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAnalyze();
                  }
                }}
                placeholder="VD: Một tách cà phê hiện đại trên bàn đá cẩm thạch dưới ánh nắng buổi sáng, phong cách tối giản..."
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
              />
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !prompt.trim()}
                className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                Phân tích
              </button>
            </div>
          </section>

          {/* Step 2: Design Form */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-2 text-slate-800 font-medium border-b border-slate-100 pb-4">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">2</div>
              <h2>Chi tiết thiết kế</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tiêu đề</label>
                <input
                  type="text"
                  value={design.title}
                  onChange={e => setDesign({...design, title: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Các nội dung chữ khác</label>
                <div className="space-y-2">
                  {design.additionalText.map((text, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={text}
                        onChange={e => {
                          const newText = [...design.additionalText];
                          newText[idx] = e.target.value;
                          setDesign({...design, additionalText: newText});
                        }}
                        className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Nhập nội dung..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newText = [...design.additionalText];
                          newText.splice(idx, 1);
                          setDesign({...design, additionalText: newText});
                        }}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center w-10"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDesign({...design, additionalText: [...design.additionalText, '']})}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 mt-1"
                  >
                    + Thêm nội dung chữ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Bối cảnh / Nền</label>
                <textarea
                  value={design.scene}
                  onChange={e => setDesign({...design, scene: e.target.value})}
                  className="w-full h-24 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phong cách</label>
                <input
                  type="text"
                  value={design.style}
                  onChange={e => setDesign({...design, style: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-6">
              <ImageUpload
                label="Ảnh sản phẩm"
                description="QUAN TRỌNG: Sản phẩm phải được giữ nguyên. Tải lên hình ảnh rõ nét của sản phẩm."
                images={design.productImages}
                onChange={imgs => setDesign({...design, productImages: imgs})}
                multiple={true}
              />

              <ImageUpload
                label="Ảnh tham khảo"
                description="Tải lên ảnh tham khảo về phong cách hoặc bố cục."
                images={design.referenceImages}
                onChange={imgs => setDesign({...design, referenceImages: imgs})}
                multiple={true}
              />
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Layout size={14}/> Tỷ lệ khung hình</label>
                  <select
                    value={design.aspectRatio}
                    onChange={e => setDesign({...design, aspectRatio: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    <option value="1:1">1:1 (Vuông)</option>
                    <option value="4:5">4:5 (Dọc)</option>
                    <option value="16:9">16:9 (Ngang)</option>
                    <option value="9:16">9:16 (Stories)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><ImageIcon size={14}/> Độ phân giải</label>
                  <select
                    value={design.resolution}
                    onChange={e => setDesign({...design, resolution: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    <option value="1024">1024px (1K)</option>
                    <option value="2048">2048px (2K)</option>
                    <option value="4096">4096px (4K)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Palette size={14}/> Màu sắc chính</label>
                <div className="flex gap-2">
                  {design.colors.map((color, idx) => {
                    const hexColor = /^#[0-9A-Fa-f]{6}$/i.test(color) ? color : '#000000';
                    return (
                      <div key={idx} className="relative w-full h-10 rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
                        <input
                          type="color"
                          value={hexColor}
                          onChange={e => {
                            const newColors = [...design.colors];
                            newColors[idx] = e.target.value;
                            setDesign({...design, colors: newColors});
                          }}
                          className="absolute -top-2 -left-2 w-20 h-20 cursor-pointer"
                        />
                        <div className="absolute inset-0 pointer-events-none border border-black/5 rounded-lg group-hover:border-black/20 transition-colors"></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="watermark"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="watermark" className="text-sm text-slate-700 font-medium cursor-pointer">
                  Thêm chữ "by AI" vào góc ảnh
                </label>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {isGenerating ? 'Đang tạo hình ảnh...' : 'Tạo hình ảnh'}
            </button>
          </section>
        </div>

        {/* Right Panel: Preview */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full min-h-[600px] flex flex-col overflow-hidden sticky top-24">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-medium text-slate-700 flex items-center gap-2">
                <ImageIcon size={18} className="text-slate-400" />
                Xem trước
              </h3>
              {generatedImage && (
                <a
                  href={generatedImage}
                  download={`design-${Date.now()}.png`}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  <Download size={16} /> Tải xuống
                </a>
              )}
            </div>
            
            <div className="flex-1 p-6 flex items-center justify-center bg-slate-100/50 relative">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4 text-slate-400">
                  <Loader2 size={48} className="animate-spin text-indigo-500" />
                  <p className="text-sm font-medium animate-pulse">Đang thiết kế...</p>
                </div>
              ) : generatedImage ? (
                <div className="relative inline-block">
                  <img
                    src={generatedImage}
                    alt="Generated design"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                  />
                  {showWatermark && (
                    <div className="absolute bottom-2 right-2 text-white/60 text-[10px] font-medium pointer-events-none drop-shadow-sm">
                      by AI
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-400 max-w-sm">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon size={32} className="text-slate-300" />
                  </div>
                  <p className="text-sm">Hình ảnh marketing được tạo sẽ xuất hiện ở đây.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
