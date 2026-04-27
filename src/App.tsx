import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, ChevronLeft, FlipHorizontal2 } from 'lucide-react';

const DEFAULT_TEXT = `Vitajte vo vašom teleprompteri.

Sem vložte svoj scenár a stlačením tlačidla Prehrať spustite posúvanie. Rýchlosť a veľkosť písma môžete upraviť pomocou ovládacích prvkov vpravo.

Zhlboka sa nadýchnite. Hovorte jasne a vlastným tempom. Text vás bude nasledovať.

Pamätajte: dobrý očný kontakt s kamerou vytvára spojenie s vaším publikom. Skúste čítať mierne dopredu, aby váš prejav pôsobil prirodzene.

Držíme vám palce!`;

type Mode = 'editor' | 'prompter';

export default function App() {
  const [mode, setMode] = useState<Mode>('editor');
  const [text, setText] = useState(DEFAULT_TEXT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [fontSize, setFontSize] = useState(36);
  const [mirrored, setMirrored] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const scrollPosRef = useRef<number>(0);

  const pixelsPerSecond = speed * 40;

  const scroll = useCallback((timestamp: number) => {
    if (!scrollRef.current || !textRef.current) return;
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
      rafRef.current = requestAnimationFrame(scroll);
      return;
    }

    const delta = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    const el = scrollRef.current;
    const maxScroll = el.scrollHeight - el.clientHeight;

    scrollPosRef.current += pixelsPerSecond * delta;
    
    if (textRef.current) {
      textRef.current.style.transform = `translateY(-${scrollPosRef.current}px)`;
    }

    const pct = maxScroll > 0 ? Math.min(100, (scrollPosRef.current / maxScroll) * 100) : 0;
    setProgress(pct);

    if (scrollPosRef.current < maxScroll) {
      rafRef.current = requestAnimationFrame(scroll);
    } else {
      setIsPlaying(false);
    }
  }, [pixelsPerSecond]);

  // Handle play/pause state changes
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = 0;
      cancelAnimationFrame(rafRef.current);
    } else {
      rafRef.current = requestAnimationFrame(scroll);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  // Handle speed/scroll changes separately to avoid timer resets
  useEffect(() => {
    if (isPlaying) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(scroll);
    }
  }, [scroll, isPlaying]);

  const handleReset = () => {
    setIsPlaying(false);
    setProgress(0);
    scrollPosRef.current = 0;
    if (textRef.current) textRef.current.style.transform = 'translateY(0)';
  };

  const handleStartPrompter = () => {
    handleReset();
    setMode('prompter');
  };

  const handleBack = () => {
    setIsPlaying(false);
    setMode('editor');
    handleReset();
  };

  // Keyboard shortcuts in prompter mode
  useEffect(() => {
    if (mode !== 'prompter') return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.code === 'KeyR') handleReset();
      if (e.code === 'Escape') handleBack();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode]);

  if (mode === 'editor') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{
          padding: '20px 32px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px var(--accent-glow)',
            }}>
              <Play size={16} fill="white" color="white" style={{ marginLeft: 2 }} />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif' }}>Teleprompter</h1>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Hladký. Profesionálny. Váš.</p>
            </div>
          </div>
          <button
            id="start-prompter-btn"
            onClick={handleStartPrompter}
            disabled={!text.trim()}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              background: text.trim() ? 'linear-gradient(135deg, #7c6af7, #a78bfa)' : 'var(--bg-card)',
              color: text.trim() ? 'white' : 'var(--text-muted)',
              fontWeight: 600, fontSize: 14, border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: text.trim() ? '0 0 24px var(--accent-glow)' : 'none',
            }}>
            Spustiť prompter →
          </button>
        </header>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>
          {/* Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '28px 32px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Scenár
            </label>
            <textarea
              id="script-textarea"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Sem vložte svoj scenár..."
              style={{
                flex: 1,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                color: 'var(--text-primary)',
                fontSize: 16,
                lineHeight: 1.8,
                padding: '20px 24px',
                resize: 'none',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {text.split(/\s+/).filter(Boolean).length} slov
              </span>
            </div>
          </div>

          {/* Settings Panel */}
          <div style={{
            width: 280, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
            padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 28,
          }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nastavenia</label>

            <SettingSlider id="speed-slider" label="Rýchlosť posúvania" value={speed} min={1} max={10} step={0.5}
              onChange={setSpeed} displayValue={`${speed}x`} />
            <SettingSlider id="font-size-slider" label="Veľkosť písma" value={fontSize} min={18} max={72} step={2}
              onChange={setFontSize} displayValue={`${fontSize}px`} />

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 12 }}>
                Možnosti
              </label>
              <button
                id="mirror-toggle-btn"
                onClick={() => setMirrored(m => !m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '12px 14px', borderRadius: 10, border: '1px solid',
                  borderColor: mirrored ? 'var(--accent)' : 'var(--border)',
                  background: mirrored ? 'rgba(124,106,247,0.1)' : 'var(--bg-card)',
                  color: mirrored ? '#a78bfa' : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
                }}>
                <FlipHorizontal2 size={16} />
                Zrkadlový text
                {mirrored && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#a78bfa' }}>ZAP</span>}
              </button>
            </div>

            {/* Keyboard shortcuts */}
            <div style={{ marginTop: 'auto', padding: '16px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Skratky</p>
              {[['Medzerník', 'Hrať / Pauza'], ['R', 'Resetovať'], ['Esc', 'Späť do editora']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v}</span>
                  <kbd style={{ fontSize: 11, background: 'var(--bg-surface)', color: 'var(--text-primary)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>{k}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prompter Mode
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      display: 'flex', flexDirection: 'column',
      transform: mirrored ? 'scaleX(-1)' : 'none',
    }}>
      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.08)', zIndex: 50 }}>
        <div style={{
          height: '100%', background: 'linear-gradient(90deg, #7c6af7, #a78bfa)',
          width: `${progress}%`, transition: 'width 0.3s ease',
          boxShadow: '0 0 8px var(--accent)',
        }} />
      </div>

      {/* Scrolling text */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: 'hidden', padding: '10vh 12vw',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 75%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 75%, transparent 100%)',
        }}>
        <p
          ref={textRef}
          style={{
            fontSize: fontSize,
            lineHeight: 1.75,
            color: '#fff',
            fontFamily: 'DM Sans, Inter, sans-serif',
            fontWeight: 500,
            whiteSpace: 'pre-wrap',
            textAlign: 'center',
            paddingBottom: '80vh',
          }}>
          {text}
        </p>
      </div>

      {/* Controls overlay */}
      <div style={{
        position: 'fixed', bottom: 32, left: '50%', transform: mirrored ? 'translateX(50%) scaleX(-1)' : 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 999, padding: '10px 20px',
        zIndex: 100,
      }}>
        <button id="back-btn" onClick={handleBack} title="Späť do editora" style={iconBtnStyle}>
          <ChevronLeft size={18} color="rgba(255,255,255,0.7)" />
        </button>
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
        <button id="reset-btn" onClick={handleReset} title="Resetovať (R)" style={iconBtnStyle}>
          <RotateCcw size={18} color="rgba(255,255,255,0.7)" />
        </button>
        <button
          id="play-pause-btn"
          onClick={() => setIsPlaying(p => !p)}
          style={{
            width: 48, height: 48, borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px var(--accent-glow)',
            transition: 'transform 0.15s',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isPlaying
            ? <Pause size={20} fill="white" color="white" />
            : <Play size={20} fill="white" color="white" style={{ marginLeft: 2 }} />}
        </button>

        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
        <button id="settings-btn" onClick={() => setShowSettings(s => !s)} title="Nastavenia" style={{ ...iconBtnStyle, color: showSettings ? '#a78bfa' : undefined }}>
          <Settings size={18} color={showSettings ? '#a78bfa' : 'rgba(255,255,255,0.7)'} />
        </button>

        {/* Speed & Font inline */}
        {showSettings && (
          <div style={{
            position: 'absolute', bottom: 72, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(17,17,24,0.95)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '20px 24px',
            minWidth: 280, display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            <SettingSlider id="prompter-speed-slider" label="Rýchlosť" value={speed} min={1} max={10} step={0.5}
              onChange={setSpeed} displayValue={`${speed}x`} dark />
            <SettingSlider id="prompter-font-slider" label="Veľkosť písma" value={fontSize} min={18} max={72} step={2}
              onChange={setFontSize} displayValue={`${fontSize}px`} dark />
          </div>
        )}
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 36, height: 36, border: 'none', background: 'transparent', cursor: 'pointer',
  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.15s',
};

function SettingSlider({ id, label, value, min, max, step, onChange, displayValue, dark }: {
  id: string; label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; displayValue: string; dark?: boolean;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: dark ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>{label}</span>
        <span style={{
          fontSize: 13, fontWeight: 700, color: '#a78bfa',
          background: 'rgba(124,106,247,0.12)', padding: '2px 10px', borderRadius: 6,
        }}>{displayValue}</span>
      </div>
      <input
        id={id}
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#7c6af7', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: dark ? 'rgba(255,255,255,0.3)' : 'var(--text-muted)' }}>{min}</span>
        <span style={{ fontSize: 10, color: dark ? 'rgba(255,255,255,0.3)' : 'var(--text-muted)' }}>{max}</span>
      </div>
    </div>
  );
}
