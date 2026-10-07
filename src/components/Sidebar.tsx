import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Trash2, FileText, CheckCircle2, GripVertical, LayoutTemplate, Layout, Eye, Download, X, Columns } from 'lucide-react';
import jsPDF from 'jspdf';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { 
    questions,
    pageLayouts,
    removeQuestion, 
    updateQuestionAnswer, 
    reorderQuestions,
    setPreviewData,
    globalLayout,
    setGlobalLayout,
    bookletFormat,
    setBookletFormat
  } = useStore();
  
  const [testTitle, setTestTitle] = useState('Deneme Sınavı 1');
  const [isGenerating, setIsGenerating] = useState(false);

  // Computed pages are removed for UI. We render a single list.

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderQuestions(result.source.index, result.destination.index);
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
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
      }

      const drawPageBase = (doc: jsPDF, pageIdx: number, bookletTitle: string) => {
        if (fontBase64) doc.setFont('Roboto');
        
        doc.setDrawColor(249, 115, 22);
        doc.setLineWidth(0.5);
        
        doc.roundedRect(15, 10, 180, 20, 3, 3);
        doc.line(15, 20, 195, 20);
        
        doc.setFillColor(249, 115, 22);
        doc.roundedRect(70, 11, 70, 8, 4, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        if (fontBase64) doc.setFont('Roboto', 'bold');
        doc.text(bookletTitle.toUpperCase(), 105, 16.5, { align: 'center' });
        
        doc.setDrawColor(253, 186, 116);
        doc.line(105, 35, 105, 280);
        
        doc.setDrawColor(249, 115, 22);
        doc.setFillColor(255, 255, 255);
        doc.circle(105, 287, 4, 'FD');
        doc.setTextColor(0, 0, 0);
        doc.text(pageIdx.toString(), 105, 288.5, { align: 'center' });
      };

      const renderBooklet = async (doc: jsPDF, bookletQuestions: typeof questions, bookletTitle: string, isFirst: boolean) => {
        let pageNum = 1;
        if (!isFirst) {
           doc.addPage();
        }
        drawPageBase(doc, pageNum, bookletTitle);

        let qNum = 1;
        let yOffsetLeft = 35;
        let yOffsetRight = 35;

        for (const q of bookletQuestions) {
          const img = new Image();
          img.src = q.imageDataUrl;
          await new Promise((resolve) => (img.onload = resolve));
          
          const naturalWidth = img.width * 0.264583;
          const isWide = globalLayout === '1-col';
          
          let targetYOffset = 35;
          let currentColumn = 1;

          if (isWide) {
             targetYOffset = Math.max(yOffsetLeft, yOffsetRight);
             currentColumn = 1;
          } else {
             if (yOffsetLeft <= yOffsetRight) {
               currentColumn = 1;
               targetYOffset = yOffsetLeft;
             } else {
               currentColumn = 2;
               targetYOffset = yOffsetRight;
             }
          }

          const maxWidth = isWide ? 175 : 80;
          const imgRatio = img.height / img.width;
          let finalWidth = Math.min(naturalWidth, maxWidth); 
          let finalHeight = finalWidth * imgRatio;

          if (targetYOffset + finalHeight > 275) {
            if (!isWide && currentColumn === 1 && yOffsetRight + finalHeight <= 275) {
              currentColumn = 2;
              targetYOffset = yOffsetRight;
            } else if (!isWide && currentColumn === 2 && yOffsetLeft + finalHeight <= 275) {
              currentColumn = 1;
              targetYOffset = yOffsetLeft;
            } else {
              doc.addPage();
              pageNum++;
              drawPageBase(doc, pageNum, bookletTitle);
              currentColumn = 1;
              targetYOffset = 35;
              yOffsetLeft = 35;
              yOffsetRight = 35;
            }
          }

          const xBase = currentColumn === 1 ? 15 : 110;
          let xImage = xBase + 7;
          
          if (isWide) {
             xImage = 22 + (175 - finalWidth) / 2;
          }
          
          doc.setFontSize(10);
          if (fontBase64) doc.setFont('Roboto', 'bold');
          doc.text(`${qNum}.`, xBase, targetYOffset + 4);
          
          doc.addImage(q.imageDataUrl, 'PNG', xImage, targetYOffset, finalWidth, finalHeight);
          
          const nextY = targetYOffset + finalHeight + 10;
          if (isWide) {
             yOffsetLeft = nextY;
             yOffsetRight = nextY;
          } else {
             if (currentColumn === 1) yOffsetLeft = nextY;
             else yOffsetRight = nextY;
          }
          qNum++;
        }
        
        doc.addPage();
        if (fontBase64) doc.setFont('Roboto', 'bold');
        doc.setFontSize(16);
        const titleSuffix = bookletFormat === 'A-B' ? ` - ${bookletTitle}` : '';
        doc.text("CEVAP ANAHTARI" + titleSuffix, 105, 20, { align: 'center' });
        doc.setFontSize(12);
        
        let keyY = 40;
        let keyNum = 1;
        let keyCol = 1;
        
        for (const q of bookletQuestions) {
           let x = 20 + (keyCol - 1) * 45;
           doc.text(`${keyNum} - ${q.answer || '?' }`, x, keyY);
           keyY += 8;
           keyNum++;
           
           if (keyY > 280) {
              if (keyCol < 4) {
                 keyCol++;
                 keyY = 40;
              } else {
                 doc.addPage();
                 keyCol = 1;
                 keyY = 40;
                 if (fontBase64) doc.setFont('Roboto', 'bold');
                 doc.text("CEVAP ANAHTARI" + titleSuffix, 105, 20, { align: 'center' });
                 if (fontBase64) doc.setFont('Roboto', 'normal');
              }
           }
        }
      };

      if (bookletFormat === 'A-B') {
        await renderBooklet(doc, questions, `${testTitle} - A KİTAPÇIĞI`, true);
        const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
        await renderBooklet(doc, shuffledQuestions, `${testTitle} - B KİTAPÇIĞI`, false);
      } else {
        await renderBooklet(doc, questions, testTitle, true);
      }
      
      if (isPreview) {
        const testBlob = doc.output('blob');
        const testBlobUrl = URL.createObjectURL(testBlob);
        setPreviewData({ 
           url: testBlobUrl, 
           title: testTitle,
           pages: doc.internal.getNumberOfPages(),
           sizeBytes: testBlob.size
        });
      } else {
        doc.save(`${testTitle}.pdf`);
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

      <div className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-slate-200/50">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="all-questions">
            {(provided, snapshot) => (
              <div 
                ref={provided.innerRef} 
                {...provided.droppableProps} 
                className={`flex flex-wrap gap-6 items-start w-full min-h-[200px] transition-colors rounded-xl p-4 ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''}`}
              >
                {questions.length === 0 ? (
                  <div className="text-center text-slate-400 py-12 w-full text-lg border-2 border-dashed border-slate-300 rounded-xl">
                    PDF'den soru kırparak eklemeye başlayın.
                  </div>
                ) : (
                  questions.map((q, qIdx) => (
                    <Draggable key={q.id} draggableId={q.id} index={qIdx}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white border border-slate-200 rounded-lg p-3 flex flex-col w-[260px] cursor-grab active:cursor-grabbing transition-all group ${snapshot.isDragging ? 'shadow-2xl ring-4 ring-indigo-500/50 z-50 scale-105' : 'hover:shadow-md'}`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-slate-700">{qIdx + 1}. Soru</span>
                            <button 
                              onClick={() => removeQuestion(q.id)}
                              className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-100 rounded mb-3 overflow-hidden p-2">
                            <img src={q.imageDataUrl} className="w-full h-auto max-h-40 object-contain" />
                          </div>
                          
                          <div className="flex justify-center gap-1.5 mt-auto">
                            {['A', 'B', 'C', 'D', 'E'].map(opt => (
                              <button
                                key={opt}
                                onClick={() => updateQuestionAnswer(q.id, opt)}
                                className={`w-8 h-8 rounded text-sm font-bold transition-colors ${q.answer === opt ? 'bg-yellow-400 text-slate-800 shadow-inner' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                              >
                                {opt}
                              </button>
                            ))}
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
        </DragDropContext>
      </div>

      {questions.length > 0 && (
        <div className="p-4 border-t border-slate-200 bg-white shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-10 shrink-0 flex flex-col xl:flex-row gap-4 items-center">
          <div className="flex w-full xl:w-auto gap-2">
             <button 
               onClick={() => setGlobalLayout('1-col')}
               className={`flex-1 xl:flex-none px-3 py-2.5 rounded-lg text-sm font-bold transition-colors border ${globalLayout === '1-col' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
               title="Tam Sayfa (Tek Sütun)"
             >
               Tek Sütun
             </button>
             <button 
               onClick={() => setGlobalLayout('2-col')}
               className={`flex-1 xl:flex-none px-3 py-2.5 rounded-lg text-sm font-bold transition-colors border ${globalLayout === '2-col' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
               title="Yarım Sayfa (İki Sütun)"
             >
               İki Sütun
             </button>
          </div>
          
          <div className="flex w-full xl:w-auto gap-2">
             <button 
               onClick={() => setBookletFormat('A')}
               className={`flex-1 xl:flex-none px-3 py-2.5 rounded-lg text-sm font-bold transition-colors border ${bookletFormat === 'A' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
             >
               Tek Kitapçık
             </button>
             <button 
               onClick={() => setBookletFormat('A-B')}
               className={`flex-1 xl:flex-none px-3 py-2.5 rounded-lg text-sm font-bold transition-colors border ${bookletFormat === 'A-B' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
             >
               A-B Grubu
             </button>
          </div>
          
          <input 
            type="text" 
            value={testTitle}
            onChange={e => setTestTitle(e.target.value)}
            className="w-full md:flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none shadow-sm font-medium"
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
    </div>
  );
};
