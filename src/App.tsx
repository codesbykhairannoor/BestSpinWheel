import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Globe, Share2, Maximize2, Minimize2 } from 'lucide-react';
import { Wheel } from './components/Wheel';
import { FastScroller } from './components/FastScroller';
import { GoldenEnvelope } from './components/GoldenEnvelope';
import type { Entry } from './components/Wheel';
import { EntryList } from './components/EntryList';
import { WinnerModal } from './components/WinnerModal';
import { Results } from './components/Results';
import { Settings } from './components/Settings';
import { useLocalStorage } from './hooks/useLocalStorage';
import { playWinnerSound } from './utils/audio';
import type { SoundTheme } from './utils/audio';

const DEFAULT_ENTRIES = "Ali\nBudi : 2\nCitra\nDewi : 5\nEko\nFajar";
const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

function App() {
  const { t, i18n } = useTranslation();
  
  const [entriesText, setEntriesText] = useLocalStorage<string>('wheel-entries', DEFAULT_ENTRIES);
  const [winnersList, setWinnersList] = useLocalStorage<string[]>('wheel-winners', []);
  const [soundEnabled, setSoundEnabled] = useLocalStorage<boolean>('wheel-sound', true);
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('wheel-darkmode', false);
  const [spinDuration, setSpinDuration] = useLocalStorage<number>('wheel-duration', 5);
  const [pickerMode, setPickerMode] = useLocalStorage<'wheel' | 'scroller' | 'envelope'>('wheel-mode', 'wheel');
  const [numWinners, setNumWinners] = useLocalStorage<number>('wheel-num-winners', 1);
  const [soundTheme, setSoundTheme] = useLocalStorage<SoundTheme>('wheel-sound-theme', 'classic');
  
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winners, setWinners] = useState<{name: string, index: number}[]>([]);
  
  const [activeTab, setActiveTab] = useState<'entries' | 'results' | 'settings'>('entries');
  const [focusMode, setFocusMode] = useState(false);

  // Handle URL params for initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const namesParam = params.get('names') || params.get('entries') || params.get('choices');
    if (namesParam) {
      try {
        const decoded = decodeURIComponent(namesParam);
        const list = decoded.split(',').join('\n');
        setEntriesText(list);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("Failed to parse URL params", e);
      }
    }
  }, []);

  // Keyboard shortcut (Space to spin)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isSpinning && entries.length > 0 && winners.length === 0) {
          const wheelContainer = document.querySelector('.cursor-pointer') as HTMLElement;
          if (wheelContainer) wheelContainer.click();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpinning, entries, winners]);

  // Sync entriesText to entries array with weights
  useEffect(() => {
    // Split by newlines OR commas
    const lines = entriesText.split(/[\n,]+/).filter(e => e.trim());
    const parsedEntries: Entry[] = lines.map(line => {
      // Support syntax like "Name : 2" or "Name:5"
      const match = line.match(/^(.*?)\s*:\s*(\d+(?:\.\d+)?)$/);
      if (match) {
        return { text: match[1].trim(), weight: parseFloat(match[2]) || 1 };
      }
      return { text: line.trim(), weight: 1 };
    });
    setEntries(parsedEntries);
  }, [entriesText]);

  // Handle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'id' : 'en');
  };

  const handleSpinEnd = useCallback((winnersResult: {entry: Entry, index: number}[]) => {
    setWinners(winnersResult.map(w => ({ name: w.entry.text, index: w.index })));
    setWinnersList(prev => [...winnersResult.map(w => w.entry.text), ...prev]);
    playWinnerSound(soundEnabled, soundTheme);
  }, [soundEnabled, soundTheme, setWinnersList]);

  const removeWinners = () => {
    if (winners.length > 0) {
      const list = entriesText.split(/[\n,]+/).map(e => e.trim()).filter(Boolean);
      winners.forEach(winner => {
        const indexToRemove = list.findIndex(e => e === winner.name || e.startsWith(winner.name + ' :'));
        if (indexToRemove !== -1) {
          list.splice(indexToRemove, 1);
        }
      });
      setEntriesText(list.join('\n'));
      setWinners([]);
    }
  };

  const shuffle = () => {
    const list = entriesText.split(/[\n,]+/).map(e => e.trim()).filter(Boolean);
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setEntriesText(list.join('\n') + (list.length > 0 ? '\n' : ''));
  };

  const sort = () => {
    const list = entriesText.split(/[\n,]+/).map(e => e.trim()).filter(Boolean);
    list.sort();
    setEntriesText(list.join('\n') + (list.length > 0 ? '\n' : ''));
  };

  const clearEntries = () => setEntriesText('');
  const clearWinners = () => setWinnersList([]);

  const copyShareLink = () => {
    const list = entriesText.split('\n').filter(e => e.trim()).join(',');
    const url = `${window.location.origin}${window.location.pathname}?names=${encodeURIComponent(list)}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("Link copied to clipboard!");
    });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-zinc-950 text-zinc-50' : 'bg-zinc-50 text-zinc-900'} relative`}>
      {/* Header */}
      {!focusMode && (
        <header className="flex items-center justify-between px-8 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-zinc-50 dark:text-zinc-900 font-bold text-xl">
              W
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">
              SpinWheel
            </h1>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={() => setFocusMode(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors font-medium text-sm text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
              title="Focus Mode"
            >
              <Maximize2 size={16} />
              <span className="hidden sm:inline">Focus</span>
            </button>

            <button 
              onClick={copyShareLink}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors font-medium text-sm"
              title="Share Wheel"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Share</span>
            </button>

            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-2"></div>

            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors font-medium text-sm"
            >
              <Globe size={16} />
              <span className="uppercase">{i18n.language.substring(0, 2)}</span>
            </button>
            
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title={darkMode ? t('light_mode') : t('dark_mode')}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>
      )}

      {/* Floating Exit Focus Button */}
      {focusMode && (
        <button 
          onClick={() => setFocusMode(false)}
          className="fixed top-6 right-6 z-50 p-3 rounded-full bg-zinc-900/50 hover:bg-zinc-900 text-white backdrop-blur-md transition-all shadow-xl"
          title="Exit Focus Mode"
        >
          <Minimize2 size={24} />
        </button>
      )}

      {/* Main Content */}
      <main className={`max-w-[1500px] mx-auto px-6 py-8 flex flex-col ${focusMode ? 'justify-center items-center h-screen' : 'lg:flex-row gap-12 lg:gap-16 min-h-[calc(100vh-80px)] items-start'}`}>
        
        {/* Left Side: Animation Picker */}
        <div className={`flex-1 flex flex-col items-center justify-center w-full transition-all duration-500 ${focusMode ? 'scale-110' : ''}`}>
          
          {!focusMode && (
            <div className="text-center mb-8">
              <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tighter mb-4">{t('title')}</h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-md mx-auto leading-relaxed">{t('tagline')}</p>
            </div>
          )}

          {/* Mode Toggle */}
          {!focusMode && (
            <div className="flex bg-zinc-200/50 dark:bg-zinc-800/50 p-1 rounded-xl mb-8 flex-wrap justify-center">
              <button
                onClick={() => setPickerMode('wheel')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${pickerMode === 'wheel' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
              >
                Spin Wheel
              </button>
              <button
                onClick={() => setPickerMode('scroller')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${pickerMode === 'scroller' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
              >
                Digital Raffle
              </button>
              <button
                onClick={() => setPickerMode('envelope')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${pickerMode === 'envelope' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
              >
                Golden Envelope
              </button>
            </div>
          )}
          
          <div className="w-full flex justify-center mb-8 relative min-h-[400px]">
            {/* Ambient glow behind picker for premium feel */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-purple-500/10 blur-[100px] rounded-full z-0 pointer-events-none"></div>
            
            <div className="relative z-10 w-full flex justify-center">
              {pickerMode === 'wheel' && (
                <Wheel 
                  entries={entries} 
                  colors={COLORS} 
                  onSpinEnd={handleSpinEnd}
                  isSpinning={isSpinning}
                  setIsSpinning={setIsSpinning}
                  soundEnabled={soundEnabled}
                  spinDuration={spinDuration}
                  numWinners={Math.min(numWinners, entries.length)}
                  soundTheme={soundTheme}
                />
              )}
              {pickerMode === 'scroller' && (
                <FastScroller 
                  entries={entries} 
                  onSpinEnd={handleSpinEnd}
                  isSpinning={isSpinning}
                  setIsSpinning={setIsSpinning}
                  soundEnabled={soundEnabled}
                  spinDuration={spinDuration}
                  numWinners={Math.min(numWinners, entries.length)}
                  soundTheme={soundTheme}
                />
              )}
              {pickerMode === 'envelope' && (
                <GoldenEnvelope 
                  entries={entries} 
                  onSpinEnd={handleSpinEnd}
                  isSpinning={isSpinning}
                  setIsSpinning={setIsSpinning}
                  soundEnabled={soundEnabled}
                  spinDuration={spinDuration}
                  numWinners={Math.min(numWinners, entries.length)}
                  soundTheme={soundTheme}
                />
              )}
            </div>
          </div>
          
          {!focusMode && (
            <div className="text-sm text-zinc-400 dark:text-zinc-500 flex gap-2 items-center mt-4">
               <span>Press</span>
               <kbd className="bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded-md text-zinc-800 dark:text-zinc-200 font-mono text-xs font-bold border border-zinc-300 dark:border-zinc-700 shadow-sm">Space</kbd> 
               <span>to play</span>
            </div>
          )}
        </div>

        {/* Right Side: Sidebar */}
        {!focusMode && (
          <div className="w-full lg:w-[460px] lg:h-[680px] lg:sticky lg:top-[120px] shrink-0 flex flex-col gap-6">
            
            {/* Tabs Navigation */}
            <div className="flex bg-zinc-200/50 dark:bg-zinc-900/50 rounded-xl p-1.5 backdrop-blur-sm w-full">
              <button 
                onClick={() => setActiveTab('entries')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'entries' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                {t('entries')}
              </button>
              <button 
                onClick={() => setActiveTab('results')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'results' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                {t('results')}
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'settings' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                {t('settings')}
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden h-[550px] flex flex-col">
              {activeTab === 'entries' && (
                <EntryList 
                  entries={entriesText} 
                  setEntries={setEntriesText} 
                  shuffle={shuffle}
                  sort={sort}
                  clear={clearEntries}
                />
              )}
              {activeTab === 'results' && (
                <Results 
                  winners={winnersList} 
                  clearWinners={clearWinners} 
                />
              )}
              {activeTab === 'settings' && (
                <Settings 
                  soundEnabled={soundEnabled}
                  setSoundEnabled={setSoundEnabled}
                  spinDuration={spinDuration}
                  setSpinDuration={setSpinDuration}
                  numWinners={numWinners}
                  setNumWinners={setNumWinners}
                  soundTheme={soundTheme}
                  setSoundTheme={setSoundTheme}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* SEO Content Section (Articles & FAQ) */}
      <article className="bg-zinc-100 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800 py-24 px-6 mt-12">
        <div className="max-w-[1000px] mx-auto">
          <header className="mb-16 text-center">
            <h2 className="text-4xl font-extrabold tracking-tight mb-6 text-zinc-900 dark:text-zinc-50">Spin the Wheel — The Ultimate Random Name Picker</h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl mx-auto">
              Looking for a <strong>random name picker for classroom</strong> activities, or a <strong>random winner generator for giveaways</strong>? You've found the fastest, ad-free <strong>wheel of names</strong> on the web. Make random decisions instantly with our highly customizable <strong>spinner wheel</strong>.
            </p>
          </header>
          
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-12 mb-20">
            <section>
              <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-zinc-50">Perfect Raffle Name Picker</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">Running a contest on Instagram or YouTube? Use our <strong>giveaway wheel</strong> to securely and fairly <strong>pick a random winner</strong>. Drag and drop your Excel, CSV, or PDF list of participants, and our system will extract the names in milliseconds.</p>
            </section>
            <section>
              <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-zinc-50">100% Free & No Sign-up</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">Unlike other tools, our <strong>random picker wheel</strong> requires zero registration. It's an entirely free, browser-based utility designed to save you time. Zero data leaves your device, guaranteeing absolute privacy for your participant lists.</p>
            </section>
            <section>
              <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-zinc-50">Multiple Game Modes</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">Don't just <strong>spin the wheel</strong>! Try our interactive <strong>Mystery Cards</strong> mode or the highly cinematic <strong>Golden Envelope</strong> reveal to make your classroom presentations or live streams incredibly engaging.</p>
            </section>
            <section>
              <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-zinc-50">Weighted Choices & Teams</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">Need a <strong>random team generator</strong> or weighted probabilities? Simply append <code>: 5</code> next to a name to give them a 5x higher chance of winning on the <strong>random wheel</strong>.</p>
            </section>
          </div>

          {/* Semantic FAQ Section for SEO */}
          <section>
            <h2 className="text-3xl font-bold tracking-tight mb-8 text-zinc-900 dark:text-zinc-50 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <details className="group bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm cursor-pointer border border-zinc-200 dark:border-zinc-700">
                <summary className="font-semibold text-lg text-zinc-900 dark:text-zinc-50 marker:content-none flex justify-between items-center">
                  Is this random name picker truly fair?
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed">Yes! Our <strong>wheel of names</strong> uses advanced cryptographic algorithms (`window.crypto.getRandomValues()`) combined with physics-based simulation to ensure every spin is 100% fair, unbiased, and unpredictable.</p>
              </details>
              <details className="group bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm cursor-pointer border border-zinc-200 dark:border-zinc-700">
                <summary className="font-semibold text-lg text-zinc-900 dark:text-zinc-50 marker:content-none flex justify-between items-center">
                  How many names can I add to the wheel?
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed">You can add up to 10,000 names! Because our <strong>random choice generator</strong> runs completely offline in your browser, it can handle massive lists for massive giveaways without crashing.</p>
              </details>
              <details className="group bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm cursor-pointer border border-zinc-200 dark:border-zinc-700">
                <summary className="font-semibold text-lg text-zinc-900 dark:text-zinc-50 marker:content-none flex justify-between items-center">
                  Can I import names from an Excel or PDF file?
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed">Absolutely. Simply click the "Entries" tab and drag any PDF, Word (.docx), Excel (.xlsx), or CSV file into the text box. Our system will automatically parse the data and <strong>pick a random name from the list</strong>.</p>
              </details>
            </div>
          </section>
        </div>
      </article>

      {/* Winner Modal */}
      {winners.length > 0 && (
        <WinnerModal 
          winners={winners.map(w => w.name)} 
          onClose={() => setWinners([])} 
          onRemoveWinner={removeWinners} 
        />
      )}
    </div>
  );
}

export default App;
