import { useEffect, useState } from 'react';
import { PDFViewer } from './components/PDFViewer';
import { Sidebar } from './components/Sidebar';
import { useStore } from './store/useStore';
import { ShoppingCart, ChevronDown, X, FileText, Download } from 'lucide-react';

const formatSize = (bytes?: number) => {
  if (!bytes) return 'Bilinmiyor';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

function App() {
  const { loadFromStorage, questions, previewData, setPreviewData } = useStore();
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 font-sans text-slate-800 overflow-hidden relative">
      <div className="flex flex-1 overflow-hidden">
        <PDFViewer />
      </div>

      <button 
        onClick={() => setIsCartOpen(!isCartOpen)}
        className={`fixed bottom-20 right-4 sm:right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-3 sm:py-3 sm:px-6 rounded-full shadow-2xl z-40 flex items-center gap-2 transition-all transform hover:scale-105 ${isCartOpen ? 'translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      >
        <ShoppingCart className="w-5 h-5" />
        <span className="font-bold hidden sm:inline">Sepeti Aç</span>
        <span className="bg-white text-indigo-700 font-bold px-2 py-0.5 rounded-full text-xs">
          {questions.length}
        </span>
      </button>

      <div 
        className={`fixed inset-x-0 bottom-0 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-50 transition-transform duration-300 ease-in-out flex flex-col rounded-t-2xl border-t border-slate-200 ${isCartOpen ? 'translate-y-0 h-[85vh] sm:h-[60vh]' : 'translate-y-full h-[85vh] sm:h-[60vh]'}`}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
           <button 
             onClick={() => setIsCartOpen(false)}
             className="bg-white text-slate-600 shadow-md p-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
           >
             <ChevronDown className="w-5 h-5" />
           </button>
        </div>
        <Sidebar onClose={() => setIsCartOpen(false)} />
      </div>

      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-40 transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      <footer className="bg-slate-800 text-slate-300 py-3 px-6 text-xs sm:text-sm flex flex-col sm:flex-row justify-between items-center z-30 shrink-0">
        <div className="text-center sm:text-left mb-2 sm:mb-0">
          <span className="font-bold text-white block sm:inline">Şehit Başkomiser Mehmet Parlak İHO</span>
          <span className="mx-2 hidden sm:inline">|</span>
          <span className="block sm:inline text-slate-400">Soru Kırpma ve Deneme Oluşturma Sistemi</span>
        </div>
        <div className="text-slate-400">
          İletişim: <a href="mailto:bsckbilgi@gmail.com" className="hover:text-white transition-colors">bsckbilgi@gmail.com</a>
        </div>
      </footer>

      {/* Önizleme Modalı (DOKÜMANLAR) */}
      {previewData && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0 relative">
              <h3 className="font-bold text-slate-800 text-lg text-center w-full">
                DOKÜMANLAR
              </h3>
              <button 
                onClick={() => setPreviewData(null)} 
                className="absolute right-4 p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-full transition-colors"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body: Split Layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100">
              
              {/* Left Column: PDF Preview */}
              <div className="flex-[2] border-r border-slate-200 p-4 relative h-full">
                 <iframe 
                   src={previewData.url} 
                   className="w-full h-full border-0 bg-white rounded shadow-sm" 
                   title="PDF Önizleme" 
                 />
              </div>
              
              {/* Right Column: Document List */}
              <div className="flex-1 bg-white p-6 flex flex-col overflow-y-auto">
                 <div className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors bg-slate-50">
                    <FileText className="w-8 h-8 text-red-500 shrink-0 mt-1" />
                    <div className="flex-1">
                       <h4 className="font-bold text-slate-800 text-sm mb-2">{previewData.title.toUpperCase()}</h4>
                       <div className="flex gap-4 text-xs text-slate-500 mb-4">
                          <span>Sayfa: {previewData.pages || 1}</span>
                          <span>Boyut: {formatSize(previewData.sizeBytes)}</span>
                       </div>
                       
                       <a 
                         href={previewData.url}
                         download={`${previewData.title}.pdf`}
                         className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                       >
                         <Download className="w-4 h-4" />
                         İndir
                       </a>
                    </div>
                 </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
