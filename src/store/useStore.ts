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
  pageLayouts: Record<number, '1-col' | '2-col'>;
  
  addPdf: (pdf: PdfDocument) => void;
  setActivePdfId: (id: string | null) => void;
  addQuestion: (question: Question) => void;
  removeQuestion: (id: string) => void;
  updateQuestionAnswer: (id: string, answer: string) => void;
  reorderQuestions: (startIndex: number, endIndex: number) => void;
  
  setPageLayout: (pageIndex: number, layout: '1-col' | '2-col') => void;
  clearAll: () => void;
  
  // Persistence
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  pdfs: [],
  activePdfId: null,
  questions: [],
  pageLayouts: {},
  
  addPdf: (pdf) => set((state) => ({ pdfs: [...state.pdfs, pdf], activePdfId: pdf.id })),
  setActivePdfId: (id) => set({ activePdfId: id }),
  
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

  setPageLayout: (pageIndex, layout) => {
    set((state) => ({
      pageLayouts: { ...state.pageLayouts, [pageIndex]: layout }
    }));
    get().saveToStorage();
  },
  
  clearAll: () => {
    set({ questions: [], pageLayouts: {} });
    get().saveToStorage();
  },
  
  saveToStorage: async () => {
    const { questions, pageLayouts } = get();
    await localforage.setItem('questions', questions);
    await localforage.setItem('pageLayouts', pageLayouts);
  },
  loadFromStorage: async () => {
    const questions = await localforage.getItem<Question[]>('questions');
    const pageLayouts = await localforage.getItem<Record<number, '1-col'|'2-col'>>('pageLayouts');
    
    // Fallback logic for old `pages` migration
    const pages = await localforage.getItem<any[]>('pages');
    if (pages && (!questions || questions.length === 0)) {
       const flatQuestions = pages.flatMap(p => p.questions);
       set({ questions: flatQuestions, pageLayouts: pageLayouts || {} });
       await localforage.removeItem('pages');
    } else {
       set({ 
         questions: questions || [], 
         pageLayouts: pageLayouts || {} 
       });
    }
  }
}));
