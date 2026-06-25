import { useTranslation } from 'react-i18next';
import { Shuffle, SortAsc, Trash2, UploadCloud, Loader2 } from 'lucide-react';
import { useState, useRef, type FC, type ChangeEvent, type DragEvent } from 'react';
import { parseFile } from '../utils/DocumentParser';

interface EntryListProps {
  entries: string;
  setEntries: (entries: string) => void;
  shuffle: () => void;
  sort: () => void;
  clear: () => void;
}

export const EntryList: FC<EntryListProps> = ({ entries, setEntries, shuffle, sort, clear }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setEntries(e.target.value);
  };

  const handleFileProcess = async (file: File) => {
    try {
      setIsParsing(true);
      const newNames = await parseFile(file);
      
      if (newNames.length > 0) {
        const currentEntries = entries.trim();
        const combined = currentEntries 
          ? currentEntries + '\n' + newNames.join('\n') 
          : newNames.join('\n');
        setEntries(combined);
      }
    } catch (err: any) {
      alert(err.message || 'Error processing file');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileProcess(file);
    }
  };

  const count = entries.split(/[\n,]+/).filter(e => e.trim()).length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-none sm:rounded-xl overflow-hidden border-y sm:border border-zinc-200 dark:border-zinc-800">
      <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
        <h2 className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 uppercase flex items-center gap-2">
          {t('entries')} <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full text-xs font-medium">{count}</span>
        </h2>
        <div className="flex space-x-1">
          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors" title="Import from File">
            {isParsing ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
          </button>
          <button onClick={shuffle} className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors" title={t('shuffle')}>
            <Shuffle size={16} />
          </button>
          <button onClick={sort} className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors" title={t('sort')}>
            <SortAsc size={16} />
          </button>
          <button onClick={clear} className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors ml-2" title={t('clear')}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={(e) => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
        accept=".txt,.csv,.xlsx,.xls,.docx,.pdf" 
      />

      <div 
        className={`flex-1 relative transition-colors duration-200 ${isDragging ? 'bg-zinc-50 dark:bg-zinc-800/50' : 'bg-transparent'}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <textarea
          className="absolute inset-0 w-full h-full p-5 bg-transparent resize-none focus:outline-none dark:text-zinc-300 placeholder:text-zinc-400 text-[15px] leading-relaxed font-medium"
          placeholder={isDragging ? "Drop document here..." : "Enter names separated by commas (syalsa, vio, anita) or newlines. You can also drag & drop PDF/Excel/Word files!"}
          value={entries}
          onChange={handleTextChange}
        />
        
        {isDragging && (
          <div className="absolute inset-0 border-2 border-dashed border-primary/50 bg-primary/5 z-10 pointer-events-none rounded-xl m-2 flex items-center justify-center">
            <p className="text-primary font-semibold text-sm">Drop to extract names</p>
          </div>
        )}
      </div>
    </div>
  );
};

