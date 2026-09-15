import { useState, useEffect, useRef } from 'react';
import { Volume2, Battery, Wifi } from 'lucide-react';
import { ClickWheel } from './components/ClickWheel';
import { motion } from 'framer-motion';

function AudioVisualizer({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-end gap-[1px] h-3 w-4 px-0.5 pb-0.5">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-1 bg-white/70 rounded-t-sm origin-bottom"
          initial={{ height: "2px" }}
          animate={{ height: isPlaying ? ["2px", `${Math.random() * 8 + 4}px`, "2px"] : "2px" }}
          transition={isPlaying ? { duration: 0.4 + Math.random() * 0.3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
        />
      ))}
    </div>
  );
}

function App() {
  const [media, setMedia] = useState<any>(null);
  const [volume, setVolume] = useState(50);
  const [time, setTime] = useState('09:41');

  const [errorMsg, setErrorMsg] = useState('');
  const [currentPositionMs, setCurrentPositionMs] = useState<number | null>(null);

  const [view, setView] = useState<'now_playing' | 'main_menu'>('now_playing');
  const [menuIndex, setMenuIndex] = useState(0);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [theme, setTheme] = useState<'Classic White' | 'U2 Edition' | 'Midnight'>('Classic White');

  const menuOptions = ['Now Playing', 'Theme', 'Always on Top', 'Quit App'];

  const [showVolume, setShowVolume] = useState(false);
  const volumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastUpdateRef = useRef({ time: Date.now(), position: 0 });

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api) {
      setErrorMsg('Preload Bridge Failed (API undefined)');
      return;
    }

    // Initial fetch
    api.getMediaSession().then((session: any) => {
      if (session) {
        setMedia(session);
        if (session.timeline?.positionMs !== undefined) {
          lastUpdateRef.current = { time: Date.now(), position: session.timeline.positionMs };
          setCurrentPositionMs(session.timeline.positionMs);
        }
      }
    });

    api.getVolume().then((v: number) => setVolume(v));

    // Listen for live updates
    api.onMediaUpdate((session: any) => {
      setMedia(session || null);
      if (session?.timeline?.positionMs !== undefined) {
        lastUpdateRef.current = { time: Date.now(), position: session.timeline.positionMs };
        setCurrentPositionMs(session.timeline.positionMs);
      } else {
        setCurrentPositionMs(null);
      }
    });

    const timer = setInterval(() => {
      const d = new Date();
      setTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);

      setMedia(current => {
        if (current?.playbackStatus === 'playing' && current.timeline) {
          setCurrentPositionMs(() => {
            const elapsed = Date.now() - lastUpdateRef.current.time;
            return Math.min(lastUpdateRef.current.position + elapsed, current.timeline.durationMs || 0);
          });
        }
        return current;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleScroll = (delta: number) => {
    if (view === 'main_menu') {
      setMenuIndex((prev) => {
        let next = prev + delta;
        if (next < 0) next = 0;
        if (next >= menuOptions.length) next = menuOptions.length - 1;
        return next;
      });
      return;
    }

    const api = (window as any).electronAPI;
    setVolume((prev) => {
      const newVol = Math.min(100, Math.max(0, prev + delta * 2)); // 2% per tick
      if (api) api.setVolume(newVol);

      // Show volume overlay temporarily
      setShowVolume(true);
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
      volumeTimeoutRef.current = setTimeout(() => setShowVolume(false), 1500);

      return newVol;
    });
  };

  const handleMenuClick = () => {
    if (view === 'now_playing') {
      setView('main_menu');
    } else {
      setView('now_playing');
    }
  };

  const cycleTheme = () => {
    if (theme === 'Classic White') setTheme('U2 Edition');
    else if (theme === 'U2 Edition') setTheme('Midnight');
    else setTheme('Classic White');
  };

  const handleCenterClick = () => {
    if (view === 'main_menu') {
      const selected = menuOptions[menuIndex];
      if (selected === 'Now Playing') setView('now_playing');
      if (selected === 'Theme') {
        cycleTheme();
      }
      if (selected === 'Always on Top') {
        const newVal = !alwaysOnTop;
        setAlwaysOnTop(newVal);
        const api = (window as any).electronAPI;
        if (api) api.setAlwaysOnTop(newVal);
      }
      if (selected === 'Quit App') {
        const api = (window as any).electronAPI;
        if (api) api.quitApp();
      }
    } else {
      executeControl('playpause');
    }
  };

  const executeControl = (action: string) => {
    const api = (window as any).electronAPI;
    if (api) api.controlMedia(action);
  };

  const isPlaying = media?.playbackStatus === 'playing';

  return (
    <div className={`w-full h-full drag-region rounded-[3rem] border-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5),0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center p-4 relative overflow-hidden box-border transition-colors duration-500
      ${theme === 'Classic White' ? 'bg-[#F7F7F2] border-[#E5E0CC]' : ''}
      ${theme === 'U2 Edition' ? 'bg-[#1A1A1A] border-[#0A0A0A] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_20px_50px_rgba(0,0,0,0.7)]' : ''}
      ${theme === 'Midnight' ? 'bg-[#1E293B] border-[#0F172A] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_20px_50px_rgba(0,0,0,0.7)]' : ''}
    `}>

      {/* Screen Area */}
      <div className="w-full h-[45%] bg-neutral-900 rounded-2xl mt-1 mb-4 relative overflow-hidden shadow-[inset_0_2px_15px_rgba(0,0,0,0.8),0_2px_0_rgba(255,255,255,0.3)] border border-neutral-800 flex flex-col no-drag">
        {/* Top Status Bar */}
        <div className="w-full flex justify-between items-center px-4 pt-2 pb-1 bg-gradient-to-b from-white/10 to-transparent z-20">
          {view === 'main_menu' ? (
            <Wifi size={12} className="text-white/70" />
          ) : (
            <AudioVisualizer isPlaying={isPlaying} />
          )}
          <span className="text-[10px] font-medium text-white/90">{time}</span>
          <Battery size={14} className="text-white/70" />
        </div>

        {/* Ambient Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#40504A] via-[#30383A] to-neutral-900 z-0 opacity-80" />

        {media?.thumbnail && (
          <div
            className="absolute inset-0 opacity-20 blur-xl scale-125 z-0"
            style={{ backgroundImage: `url(${media.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        )}

        {/* Main Screen Content */}
        {view === 'main_menu' ? (
          <div className="flex-1 flex flex-col relative z-10 bg-white m-1 mt-0 rounded-lg overflow-hidden border border-neutral-300">
            <div className="w-full bg-gradient-to-b from-blue-400 to-blue-500 py-1 text-center border-b border-blue-600 shadow-sm">
              <span className="text-white text-xs font-bold font-sans drop-shadow-sm">iPod</span>
            </div>
            <div className="flex-1 flex flex-col w-full h-full p-1 bg-gradient-to-b from-white to-[#F0F0F0]">
              {menuOptions.map((opt, i) => (
                <div
                  key={i}
                  onPointerDown={() => {
                    setMenuIndex(i);
                    // Give it a tiny delay to show the highlight before acting
                    setTimeout(() => {
                      if (opt === 'Now Playing') setView('now_playing');
                      if (opt === 'Theme') cycleTheme();
                      if (opt === 'Always on Top') {
                        const newVal = !alwaysOnTop;
                        setAlwaysOnTop(newVal);
                        const api = (window as any).electronAPI;
                        if (api) api.setAlwaysOnTop(newVal);
                      }
                      if (opt === 'Quit App') {
                        const api = (window as any).electronAPI;
                        if (api) api.quitApp();
                      }
                    }, 50);
                  }}
                  className={`px-3 py-1.5 flex justify-between items-center cursor-pointer ${menuIndex === i ? 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-sm rounded-sm' : 'text-black'}`}
                >
                  <span className="text-[11px] font-bold font-sans">{opt}</span>
                  {opt === 'Always on Top' && (
                    <span className="text-[9px] font-bold font-sans opacity-80">{alwaysOnTop ? 'ON' : 'OFF'}</span>
                  )}
                  {opt === 'Theme' && (
                    <span className="text-[9px] font-bold font-sans opacity-80">{theme.split(' ')[0]}</span>
                  )}
                  {menuIndex === i && opt !== 'Always on Top' && opt !== 'Theme' && (
                    <span className="text-[10px]">▶</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col relative z-10 px-3 pb-1.5">
            {media ? (
              <div className="flex-1 flex flex-col w-full h-full p-2 relative overflow-hidden">
                {/* Album Art and Details Split */}
                <div className="flex flex-row items-center justify-start gap-4 flex-1 min-h-0 pt-2 w-full">

                  {/* Album Art - Classic iPod left side */}
                  <div className="w-[35%] aspect-square bg-black/40 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden flex-shrink-0 relative flex items-center justify-center">
                    {media.thumbnail ? (
                      <img src={media.thumbnail} className="w-full h-full object-cover" alt="Album Art" />
                    ) : (
                      <div className="text-white/20">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                      </div>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1">
                    <h2 className="text-white text-[13px] font-bold truncate leading-tight tracking-tight drop-shadow-md">
                      {media.title || 'Unknown Title'}
                    </h2>
                    <p className="text-white/80 text-[10px] font-medium truncate">
                      {media.artist || 'Unknown Artist'}
                    </p>
                    <p className="text-white/40 text-[9px] font-medium truncate">
                      {media.albumTitle || media.sourceAppDisplayName || 'System Media'}
                    </p>
                  </div>

                </div>

                {/* Bottom Area (Progress or Volume) */}
                <div className="w-full mt-auto mb-1 min-h-[24px] flex items-end">
                  {showVolume ? (
                    <div className="w-full flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-md p-1.5 px-2 mb-0.5 border border-white/10 shadow-lg">
                      <svg className="w-3 h-3 text-white/90 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                      <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-white rounded-full transition-all duration-75" style={{ width: `${volume}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="flex justify-between items-center text-[8px] font-bold text-white/50 mb-1 px-0.5">
                        <span>
                          {currentPositionMs !== null
                            ? `${Math.floor(currentPositionMs / 60000)}:${String(Math.floor((currentPositionMs % 60000) / 1000)).padStart(2, '0')}`
                            : '0:00'}
                        </span>
                        <span>
                          {media.timeline?.durationMs !== undefined
                            ? `${Math.floor(media.timeline.durationMs / 60000)}:${String(Math.floor((media.timeline.durationMs % 60000) / 1000)).padStart(2, '0')}`
                            : '0:00'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 border border-white/5 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                        <div
                          className="h-full bg-blue-400 rounded-full shadow-[0_0_5px_rgba(96,165,250,0.5)] transition-all duration-1000 ease-linear"
                          style={{
                            width: `${currentPositionMs !== null && media.timeline?.durationMs ? Math.min(100, (currentPositionMs / media.timeline.durationMs) * 100) : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : errorMsg ? (
              <div className="flex-1 flex items-center justify-center text-red-400 text-[10px] font-medium text-center px-2">
                {errorMsg}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/50 text-xs font-medium">
                No Media Playing
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click Wheel Area */}
      <div className="flex-1 w-full flex items-center justify-center">
        <ClickWheel
          onScroll={handleScroll}
          onCenterClick={handleCenterClick}
          onMenuClick={handleMenuClick}
          onPlayPauseClick={() => executeControl('playpause')}
          onForwardClick={() => executeControl('next')}
          onBackwardClick={() => executeControl('prev')}
          isPlaying={isPlaying}
          theme={theme}
        />
      </div>
    </div>
  );
}

export default App;
