import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useStore } from '../store/useStore';
import { Upload, ChevronLeft, ChevronRight, Scissors, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const PDFViewer: React.FC = () => {
  const { pdfs, activePdfId, addPdf, setActivePdfId, addQuestion } = useStore();
  const [zoom, setZoom] = useState<number>(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imgSrc, setImgSrc] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  const handleFiles = (files: FileList) => {
    setError(null);
    Array.from(files).forEach(file => {
      if (file.type !== 'application/pdf') {
        setError('Sadece PDF dosyaları yüklenebilir.');
        return;
      }
      const url = URL.createObjectURL(file);
      addPdf({
        id: crypto.randomUUID(),
        name: file.name,
        url
      });
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  useEffect(() => {
    const loadPdf = async () => {
      const activePdf = pdfs.find(p => p.id === activePdfId);
      if (!activePdf) return;

      setError(null);
      setPdfDoc(null);
      setImgSrc('');

      try {
        const loadingTask = pdfjsLib.getDocument({ url: activePdf.url });
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
      } catch (err: any) {
        console.error("PDF yüklenemedi", err);
        setError('PDF yüklenirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
      }
    };
    
    loadPdf();
  }, [activePdfId, pdfs]);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc) return;
      setIsRendering(true);
      setError(null);
      
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: 2.0 }); 
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext: any = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        setImgSrc(canvas.toDataURL('image/png'));
        setCrop(undefined);
        setCompletedCrop(undefined);
      } catch (err: any) {
        console.error("Sayfa render hatası", err);
        setError('Sayfa işlenirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
      } finally {
        setIsRendering(false);
      }
    };
    
    renderPage();
  }, [pdfDoc, currentPage]);

  const handleCropComplete = (crop: PixelCrop) => {
    setCompletedCrop(crop);
  };

  const saveCroppedQuestion = async () => {
    if (!completedCrop || !imgSrc || !imageRef.current) return;
    
    const image = imageRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );
    
    const base64Image = canvas.toDataURL('image/png');
    
    addQuestion({
      id: crypto.randomUUID(),
      pdfId: activePdfId!,
      pageIndex: currentPage,
      imageDataUrl: base64Image,
      width: canvas.width,
      height: canvas.height,
      answer: selectedAnswer,
      createdAt: Date.now()
    });
    
    setCrop(undefined);
    setCompletedCrop(undefined);
    setSelectedAnswer('');
  };

  return (
    <div 
      className="flex-1 flex flex-col bg-slate-100 overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-indigo-500/10 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-indigo-400 m-4 rounded-xl">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center pointer-events-none">
            <Upload className="w-16 h-16 text-indigo-500 mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-slate-800">PDF Dosyasını Bırakın</h2>
            <p className="text-slate-500 mt-2">Hemen yüklenip görüntülenmeye başlanacak.</p>
          </div>
        </div>
      )}
      <div className="bg-white p-3 sm:p-4 border-b border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 z-10">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <label className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors border border-indigo-200">
            <Upload className="w-5 h-5" />
            PDF Yükle
            <input type="file" multiple accept="application/pdf" className="hidden" onChange={handleFileUpload} />
          </label>
          
          {pdfs.length > 0 && (
            <select 
              className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              value={activePdfId || ''}
              onChange={(e) => setActivePdfId(e.target.value)}
            >
              <option value="" disabled>PDF Seçin</option>
              {pdfs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
        
        {pdfDoc && numPages && (
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200 shrink-0">
              <button 
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                className="p-1 rounded hover:bg-white hover:shadow-sm transition-all text-slate-600"
                title="Uzaklaştır"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium px-1 text-slate-600 w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                className="p-1 rounded hover:bg-white hover:shadow-sm transition-all text-slate-600"
                title="Yakınlaştır"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              <button 
                onClick={() => setZoom(1)}
                className="p-1 rounded hover:bg-white hover:shadow-sm transition-all text-slate-600"
                title="Ekrana Sığdır"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1 border border-slate-200 shrink-0">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isRendering}
                className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium px-2 text-slate-600">
                {currentPage} / {numPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages || isRendering}
                className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-8 relative flex justify-center bg-slate-100">
        {error ? (
          <div className="m-auto text-center text-red-500 bg-red-50 p-6 rounded-xl border border-red-200 max-w-lg shadow-sm">
            <h3 className="text-lg font-bold mb-2">Hata</h3>
            <p className="text-sm">{error}</p>
          </div>
        ) : !activePdfId ? (
          <div className="m-auto text-center text-slate-400">
            <div className="bg-slate-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Upload className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-600">Henüz PDF Yüklenmedi</h3>
            <p className="mt-2 text-slate-500">Başlamak için üst kısımdan bir veya birden fazla PDF dosyası yükleyin.</p>
          </div>
        ) : isRendering ? (
          <div className="m-auto flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="text-indigo-600 font-medium animate-pulse">Sayfa İşleniyor...</p>
          </div>
        ) : imgSrc ? (
          <div className="flex justify-center min-h-full items-start">
            <div 
              className="shadow-2xl bg-white relative border border-slate-200 transition-all duration-200"
              style={{ 
                width: zoom === 1 ? '100%' : `${zoom * 100}%`,
                maxWidth: zoom === 1 ? '100%' : 'none',
                height: 'max-content'
              }}
            >
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={handleCropComplete}
                className="w-full"
              >
                <img 
                  ref={imageRef}
                  src={imgSrc} 
                  alt={`Page ${currentPage}`} 
                  className="w-full h-auto block"
                  draggable={false}
                />
              </ReactCrop>

              {completedCrop && completedCrop.width > 0 && completedCrop.height > 0 && (
                <div 
                  className="absolute z-50 flex items-center gap-1 bg-white p-1 rounded shadow-lg border border-slate-200"
                  style={{
                    top: `${completedCrop.y + completedCrop.height + 10}px`,
                    left: `${Math.max(0, completedCrop.x + completedCrop.width - 240)}px`
                  }}
                >
                  {['A', 'B', 'C', 'D', 'E'].map(ans => (
                    <button
                      key={ans}
                      onClick={() => setSelectedAnswer(ans)}
                      className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm transition-colors ${selectedAnswer === ans ? 'bg-yellow-400 text-slate-800' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    >
                      {ans}
                    </button>
                  ))}
                  <button 
                    onClick={saveCroppedQuestion}
                    className="ml-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm py-1.5 px-4 rounded transition-colors"
                  >
                    Tamam
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
