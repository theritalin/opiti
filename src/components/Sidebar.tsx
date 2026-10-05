import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Trash2, FileText, CheckCircle2, GripVertical, LayoutTemplate, Layout, Eye, Download, X } from 'lucide-react';
import jsPDF from 'jspdf';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { 
    questions,
    pageLayouts,
    removeQuestion, 
    updateQuestionAnswer, 
    setPageLayout, 
    reorderQuestions 
  } = useStore();
  
  const [testTitle, setTestTitle] = useState('Deneme Sınavı 1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const computedPages = useMemo(() => {
    const pages = [];
    let currentPageIndex = 0;
    let currentLayout = pageLayouts[0] || '1-col';
    let currentQuestions: typeof questions = [];
    
    let yOffset = 35; 
    let currentColumn = 1;

    for (const q of questions) {
      const maxWidth = currentLayout === '2-col' ? 85 : 170;
      
      const qWidth = q.width || 800;
      const qHeight = q.height || 400;
      
      const imgRatio = qHeight / qWidth;
      const finalWidth = Math.min(qWidth * 0.264583, maxWidth);
      const finalHeight = finalWidth * imgRatio;

      if (yOffset + finalHeight > 280) {
        if (currentLayout === '2-col' && currentColumn === 1) {
          currentColumn = 2;
          yOffset = 35;
        } else {
          pages.push({ pageIndex: currentPageIndex, layout: currentLayout, questions: currentQuestions });
          currentPageIndex++;
          currentLayout = pageLayouts[currentPageIndex] || '1-col';
          currentQuestions = [];
          currentColumn = 1;
          yOffset = 35;
        }
      }
      
      currentQuestions.push(q);
      yOffset += finalHeight + 10;
    }
    
    if (currentQuestions.length > 0) {
      pages.push({ pageIndex: currentPageIndex, layout: currentLayout, questions: currentQuestions });
    }
    
    if (pages.length === 0) {
      pages.push({ pageIndex: 0, layout: pageLayouts[0] || '1-col', questions: [] });
    }
    
    return pages;
  }, [questions, pageLayouts]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourcePageStr = result.source.droppableId.split('-')[1];
    const destPageStr = result.destination.droppableId.split('-')[1];
    const sourcePageIndex = parseInt(sourcePageStr);
    const destPageIndex = parseInt(destPageStr);
    
    let flatSourceIndex = 0;
    for (let i = 0; i < sourcePageIndex; i++) {
      flatSourceIndex += computedPages[i].questions.length;
    }
    flatSourceIndex += result.source.index;
    
    let flatDestIndex = 0;
    for (let i = 0; i < destPageIndex; i++) {
      flatDestIndex += computedPages[i].questions.length;
    }
    flatDestIndex += result.destination.index;
    
    if (flatDestIndex >= questions.length) {
      flatDestIndex = questions.length - 1;
    }

    reorderQuestions(flatSourceIndex, flatDestIndex);
  };

  const generateTestPDF = async (isPreview = false) => {
    setIsGenerating(true);
    try {
      let fontBase64 = null;
      try {
        const fontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf';
        const response = await fetch(fontUrl);
        const fontBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(fontBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        fontBase64 = btoa(binary);
      } catch (fontErr) {
        console.error("Font yüklenemedi", fontErr);
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      if (fontBase64) {
        doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.setFont('Roboto');
      }

      let qNum = 1;
      let isFirstPage = true;

      for (let pIdx = 0; pIdx < computedPages.length; pIdx++) {
        const pageConfig = computedPages[pIdx];
        if (pageConfig.questions.length === 0) continue;

        if (!isFirstPage) {
          doc.addPage();
          if (fontBase64) doc.setFont('Roboto');
        }
        isFirstPage = false;

        let yOffset = 20;
        doc.setFontSize(16);
        doc.text(testTitle, 105, yOffset, { align: 'center' });
        yOffset += 15;

        const isTwoColumn = pageConfig.layout === '2-col';
        let currentColumn = 1; 

        for (const q of pageConfig.questions) {
          const img = new Image();
          img.src = q.imageDataUrl;
          await new Promise((resolve) => (img.onload = resolve));
          
          const maxWidth = isTwoColumn ? 85 : 170;
          const imgRatio = img.height / img.width;
          let finalWidth = Math.min(img.width * 0.264583, maxWidth); 
          let finalHeight = finalWidth * imgRatio;

          const checkPageBreak = () => {
            if (yOffset + finalHeight > 280) {
              if (isTwoColumn && currentColumn === 1) {
                currentColumn = 2;
                yOffset = 35;
              } else {
                doc.addPage();
                currentColumn = 1;
                yOffset = 20;
                doc.setFontSize(16);
                doc.text(testTitle, 105, yOffset, { align: 'center' });
                yOffset += 15;
                if (fontBase64) doc.setFont('Roboto');
              }
            }
          };

          checkPageBreak();

          const xOffset = isTwoColumn ? (currentColumn === 1 ? 15 : 110) : 25;
          const qNumX = isTwoColumn ? (currentColumn === 1 ? 8 : 103) : 15;

          doc.setFontSize(12);
          doc.text(`${qNum}.`, qNumX, yOffset + 5);
          
          doc.addImage(q.imageDataUrl, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
          
          yOffset += finalHeight + 10;
          qNum++;
        }
      }
      
      

      const keyDoc = new jsPDF();
      if (fontBase64) {
        keyDoc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
        keyDoc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        keyDoc.setFont('Roboto');
      }
      keyDoc.setFontSize(16);
      keyDoc.text(`${testTitle} - Cevap Anahtarı`, 105, 20, { align: 'center' });
      keyDoc.setFontSize(12);
      
      let keyY = 40;
      let keyNum = 1;
      computedPages.forEach(p => {
        p.questions.forEach(q => {
          keyDoc.text(`${keyNum} - ${q.answer || '?' }`, 20, keyY);
          keyY += 10;
          keyNum++;
          if (keyY > 280) {
            keyDoc.addPage();
            keyY = 20;
          }
        });
      });
      
      if (isPreview) {
        const testBlobUrl = doc.output('bloburl');
        setPreviewUrl(testBlobUrl.toString());
      } else {
        doc.save(`${testTitle}.pdf`);
        keyDoc.save(`${testTitle}_CevapAnahtari.pdf`);
      }

    } catch(err) {
      console.error(err);
      alert('PDF oluşturulurken hata oluştu.');
    }
    setIsGenerating(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 relative">
      <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-indigo-600" />
            Otomatik Düzen
          </h2>
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
            {questions.length} Soru
          </span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex h-full gap-6 items-start pb-4 w-max">
          {computedPages.map((page) => (
            <div key={`page-${page.pageIndex}`} className="w-[320px] sm:w-[380px] shrink-0 max-h-full flex flex-col bg-white border border-slate-200 rounded-xl shadow-md relative">
              <div className="bg-slate-100 p-3 flex justify-between items-center border-b border-slate-200 rounded-t-xl">
                <h3 className="font-bold text-slate-700">Sayfa {page.pageIndex + 1}</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setPageLayout(page.pageIndex, page.layout === '1-col' ? '2-col' : '1-col')}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-600 transition-colors"
                    title="Bu sayfa için düzeni değiştir"
                  >
                    {page.layout === '1-col' ? <Layout className="w-3 h-3" /> : <LayoutTemplate className="w-3 h-3" />}
                    {page.layout === '1-col' ? 'Tek Sütun' : 'İki Sütun'}
                  </button>
                </div>
              </div>
              
              <Droppable droppableId={`page-${page.pageIndex}`}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps} 
                    className={`p-4 space-y-4 flex-1 overflow-y-auto min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''}`}
                  >
                    {page.questions.length === 0 ? (
                      <div className="text-center text-slate-400 py-6 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                        PDF'den soru kırparak eklemeye başlayın.
                      </div>
                    ) : (
                      page.questions.map((q, qIdx) => (
                        <Draggable key={q.id} draggableId={q.id} index={qIdx}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.draggableProps}
                              className={`bg-white border border-slate-200 rounded-lg p-3 group transition-all ${snapshot.isDragging ? 'shadow-xl ring-2 ring-indigo-500 z-50 rotate-1' : 'hover:shadow-md'}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                  <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors text-slate-400">
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  <span className="font-semibold text-slate-700 text-sm">Soru</span>
                                </div>
                                <button 
                                  onClick={() => removeQuestion(q.id)}
                                  className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <img src={q.imageDataUrl} className="w-full h-auto border border-slate-100 rounded mb-3 bg-slate-50 object-contain max-h-40" />
                              <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded border border-slate-200">
                                <label className="text-xs text-slate-600 font-medium">Cevap:</label>
                                <select 
                                  className="bg-transparent flex-1 text-sm focus:outline-none font-semibold text-slate-700 cursor-pointer"
                                  value={q.answer}
                                  onChange={(e) => updateQuestionAnswer(q.id, e.target.value)}
                                >
                                  <option value="">-</option>
                                  <option value="A">A</option>
                                  <option value="B">B</option>
                                  <option value="C">C</option>
                                  <option value="D">D</option>
                                  <option value="E">E</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
          </div>
        </DragDropContext>
      </div>

      {questions.length > 0 && (
        <div className="p-4 border-t border-slate-200 bg-white shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-10 shrink-0 flex flex-col sm:flex-row gap-4 items-center">
          <input 
            type="text" 
            value={testTitle}
            onChange={e => setTestTitle(e.target.value)}
            className="w-full sm:w-1/2 md:w-1/3 border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none shadow-sm font-medium"
            placeholder="Test Başlığı"
          />
          <div className="flex gap-3 w-full sm:w-auto ml-auto">
            <button 
              onClick={() => generateTestPDF(true)}
              disabled={isGenerating}
              className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-medium py-2.5 px-3 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Eye className="w-4 h-4" />
              Önizle
            </button>
            <button 
              onClick={() => generateTestPDF(false)}
              disabled={isGenerating}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-3 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Download className="w-4 h-4" />
              İndir
            </button>
          </div>
        </div>
      )}

      {/* Önizleme Modalı */}
      {previewUrl && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
          <div className="bg-white w-full max-w-5xl h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                {testTitle} - Önizleme
              </h3>
              <button 
                onClick={() => setPreviewUrl(null)} 
                className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-full transition-colors"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe 
              src={previewUrl} 
              className="w-full flex-1 border-0 bg-slate-100" 
              title="PDF Önizleme" 
            />
          </div>
        </div>
      )}
    </div>
  );
};
