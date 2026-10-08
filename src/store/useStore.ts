import { create } from 'zustand';
import localforage from 'localforage';

export interface Question {
  id: string;
  pdfId: string;
  pageIndex: number;
  imageDataUrl: string; // Base64
  width: number;
  height: number;
  answer: string;
  createdAt: number;
}

export interface PdfDocument {
  id: string;
  name: string;
  url: string; // Blob URL
}

interface StoreState {
  pdfs: PdfDocument[];
  activePdfId: string | null;
  questions: Question[];
  globalLayout: '1-col' | '2-col';
  bookletFormat: 'A' | 'A-B';
  previewData: { url: string; title: string; pages?: number; sizeBytes?: number } | null;
  
  addPdf: (pdf: PdfDocument) => void;
  setActivePdfId: (id: string | null) => void;
  setPreviewData: (data: { url: string; title: string; pages?: number; sizeBytes?: number } | null) => void;
  addQuestion: (question: Question) => void;
  removeQuestion: (id: string) => void;
  updateQuestionAnswer: (id: string, answer: string) => void;
  reorderQuestions: (startIndex: number, endIndex: number) => void;
  
  setGlobalLayout: (layout: '1-col' | '2-col') => void;
  setBookletFormat: (format: 'A' | 'A-B') => void;
  clearAll: () => void;
  
  // Persistence
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  pdfs: [],
  activePdfId: null,
  questions: [],
  globalLayout: '2-col',
  bookletFormat: 'A',
  previewData: null,
  
  addPdf: (pdf) => set((state) => ({ pdfs: [...state.pdfs, pdf], activePdfId: pdf.id })),
  setActivePdfId: (id) => set({ activePdfId: id }),
  setPreviewData: (data) => set({ previewData: data }),
  
  addQuestion: (question) => {
    set((state) => ({ questions: [...state.questions, question] }));
    get().saveToStorage();
  },
  
  removeQuestion: (id) => {
    set((state) => ({ questions: state.questions.filter((q) => q.id !== id) }));
    get().saveToStorage();
  },
  
  updateQuestionAnswer: (id, answer) => {
    set((state) => ({
      questions: state.questions.map((q) => q.id === id ? { ...q, answer } : q)
    }));
    get().saveToStorage();
  },
  
  reorderQuestions: (startIndex, endIndex) => {
    set(state => {
      const result = Array.from(state.questions);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { questions: result };
    });
    get().saveToStorage();
  },

  setGlobalLayout: (layout) => {
    set({ globalLayout: layout });
    get().saveToStorage();
  },
  
  setBookletFormat: (format) => {
    set({ bookletFormat: format });
    get().saveToStorage();
  },
  
  clearAll: () => {
    set({ questions: [] });
    get().saveToStorage();
  },
  
  saveToStorage: async () => {
    const { questions, globalLayout, bookletFormat } = get();
    await localforage.setItem('questions', questions);
    await localforage.setItem('globalLayout', globalLayout);
    await localforage.setItem('bookletFormat', bookletFormat);
  },
  loadFromStorage: async () => {
    const questions = await localforage.getItem<Question[]>('questions');
    const globalLayout = await localforage.getItem<'1-col'|'2-col'>('globalLayout');
    const bookletFormat = await localforage.getItem<'A'|'A-B'>('bookletFormat');
    
    // Fallback logic for old `pages` migration
    const pages = await localforage.getItem<any[]>('pages');
    if (pages && (!questions || questions.length === 0)) {
       const flatQuestions = pages.flatMap(p => p.questions);
       set({ questions: flatQuestions, globalLayout: globalLayout || '2-col' });
       await localforage.removeItem('pages');
    } else {
       set({ 
         questions: questions || [], 
         globalLayout: globalLayout || '2-col',
         bookletFormat: bookletFormat || 'A'
       });
    }
  }
}));
