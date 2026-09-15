import { useRef } from 'react';
import { LayoutGrid, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface ClickWheelProps {
  onScroll: (delta: number) => void;
  onCenterClick: () => void;
  onMenuClick: () => void;
  onPlayPauseClick: () => void;
  onForwardClick: () => void;
  onBackwardClick: () => void;
  isPlaying: boolean;
  theme?: 'Classic White' | 'U2 Edition' | 'Midnight';
}

export function ClickWheel({
  onScroll,
  onCenterClick,
  onMenuClick,
  onPlayPauseClick,
  onForwardClick,
  onBackwardClick,
  isPlaying,
  theme = 'Classic White'
}: ClickWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playClick = () => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    
    // iPod click is a very short mechanical tick
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtxRef.current.currentTime + 0.015);
    
    gain.gain.setValueAtTime(0.15, audioCtxRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.015);
    
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.015);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!wheelRef.current) return;
    initAudio();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    lastAngleRef.current = Math.atan2(e.clientY - cy, e.clientX - cx);
    isDraggingRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !wheelRef.current || lastAngleRef.current === null) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx);

    let delta = currentAngle - lastAngleRef.current;
    
    // Normalize delta to be between -PI and PI
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    // Threshold to prevent jitter
    if (Math.abs(delta) > 0.08) {
      playClick();
      // Clockwise is positive delta in screen coordinates (since Y is down)
      onScroll(delta > 0 ? 1 : -1);
      lastAngleRef.current = currentAngle;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="relative w-full max-w-[85%] aspect-square mx-auto no-drag select-none">
      {/* Outer Wheel */}
      <div
        ref={wheelRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`absolute inset-0 rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.05),0_5px_15px_rgba(0,0,0,0.1)] flex items-center justify-center cursor-pointer overflow-hidden touch-none
          ${theme === 'Classic White' ? 'bg-[#E5E5DF]' : ''}
          ${theme === 'U2 Edition' ? 'bg-[#CC0000] shadow-[inset_0_2px_10px_rgba(0,0,0,0.4),0_5px_15px_rgba(0,0,0,0.3)]' : ''}
          ${theme === 'Midnight' ? 'bg-[#0F172A] shadow-[inset_0_2px_10px_rgba(0,0,0,0.4),0_5px_15px_rgba(0,0,0,0.3)]' : ''}
        `}
      >
        {/* Buttons overlay to intercept clicks without disrupting drag scroll */}
        <div 
          className={`absolute top-4 left-1/2 -translate-x-1/2 p-2 hover:opacity-100 transition-colors z-10 active:scale-90
            ${theme === 'U2 Edition' ? 'text-black/80 hover:text-black' : 'text-neutral-400 hover:text-neutral-600'}
          `}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onMenuClick(); }}
        >
          <LayoutGrid size={22} strokeWidth={2.5} />
        </div>
        
        <div 
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 p-2 hover:opacity-100 transition-colors z-10 active:scale-90
            ${theme === 'U2 Edition' ? 'text-black/80 hover:text-black' : 'text-neutral-400 hover:text-neutral-600'}
          `}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onPlayPauseClick(); }}
        >
          {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
        </div>
        
        <div 
          className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:opacity-100 transition-colors z-10 active:scale-90
            ${theme === 'U2 Edition' ? 'text-black/80 hover:text-black' : 'text-neutral-400 hover:text-neutral-600'}
          `}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onBackwardClick(); }}
        >
          <SkipBack size={22} fill="currentColor" />
        </div>
        
        <div 
          className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:opacity-100 transition-colors z-10 active:scale-90
            ${theme === 'U2 Edition' ? 'text-black/80 hover:text-black' : 'text-neutral-400 hover:text-neutral-600'}
          `}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onForwardClick(); }}
        >
          <SkipForward size={22} fill="currentColor" />
        </div>

        {/* Center Button */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onCenterClick(); }}
          className={`w-[35%] aspect-square rounded-full flex items-center justify-center z-20 transition-colors
            ${theme === 'Classic White' ? 'bg-[#F2F2EC] shadow-[0_2px_10px_rgba(0,0,0,0.1),inset_0_1px_3px_rgba(255,255,255,0.8)] active:bg-[#EAEADF]' : ''}
            ${theme === 'U2 Edition' ? 'bg-[#1A1A1A] shadow-[0_2px_10px_rgba(0,0,0,0.6),inset_0_1px_3px_rgba(255,255,255,0.1)] active:bg-[#000000]' : ''}
            ${theme === 'Midnight' ? 'bg-[#1E293B] shadow-[0_2px_10px_rgba(0,0,0,0.6),inset_0_1px_3px_rgba(255,255,255,0.1)] active:bg-[#0F172A]' : ''}
          `}
        >
        </div>
      </div>
    </div>
  );
}
