import React, { useEffect, useState } from 'react';
import { PDFViewer } from './components/PDFViewer';
import { Sidebar } from './components/Sidebar';
import { useStore } from './store/useStore';
import { ShoppingCart, ChevronDown } from 'lucide-react';

function App() {
  const { loadFromStorage, questions } = useStore();
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
    </div>
  );
}

export default App;
