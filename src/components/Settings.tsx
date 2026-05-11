import type { Settings, Layout } from '../types';
import './Settings.css';

type SettingsPageProps = {
  settings: Settings;
  onChange: (s: Settings) => void;
  onBack: () => void;
};

const PALETTE = [
  { label: 'Red',    hex: '#d33'    },
  { label: 'Green',  hex: '#2a8'    },
  { label: 'Purple', hex: '#7a3db8' },
  { label: 'Blue',   hex: '#2677d4' },
  { label: 'Orange', hex: '#e07a20' },
  { label: 'Pink',   hex: '#d43f7a' },
  { label: 'Teal',   hex: '#1a9a8a' },
  { label: 'Gold',   hex: '#c5962a' },
];

const LAYOUTS: { value: Layout; label: string; cols: number; rows: number }[] = [
  { value: '2x6', label: '2 × 6', cols: 2, rows: 6 },
  { value: '3x4', label: '3 × 4', cols: 3, rows: 4 },
  { value: '4x3', label: '4 × 3', cols: 4, rows: 3 },
  { value: '6x2', label: '6 × 2', cols: 6, rows: 2 },
];

export default function SettingsPage({ settings, onChange, onBack }: SettingsPageProps) {
  function selectColor(slotIndex: number, hex: string) {
    const next = [...settings.colors] as [string, string, string];
    // if this hex is used by another slot, swap them
    const other = next.findIndex((c, i) => c === hex && i !== slotIndex);
    if (other !== -1) next[other] = next[slotIndex];
    next[slotIndex] = hex;
    onChange({ ...settings, colors: next });
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button onClick={onBack}>← Back</button>
        <h1>Settings</h1>
      </div>

      <div className="settings-content">

        <section className="settings-section">
          <h2>Colors</h2>
          <p>Choose the three colors used for card symbols. Each slot must be unique.</p>
          <div className="color-slots">
            {settings.colors.map((selectedHex, slotIndex) => (
              <div key={slotIndex} className="color-slot">
                <div className="color-slot-label">Color {slotIndex + 1}</div>
                <div className="color-slot-preview" style={{ background: selectedHex }} />
                <div className="color-palette">
                  {PALETTE.map(({ hex, label }) => (
                    <button
                      key={hex}
                      className={`color-swatch${selectedHex === hex ? ' active' : ''}`}
                      style={{ background: hex }}
                      title={label}
                      onClick={() => selectColor(slotIndex, hex)}
                      aria-label={label}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h2>Layout</h2>
          <p>Choose how cards are arranged on the board (columns × rows).</p>
          <div className="layout-options">
            {LAYOUTS.map(({ value, label, cols, rows }) => (
              <button
                key={value}
                className={`layout-option${settings.layout === value ? ' active' : ''}`}
                onClick={() => onChange({ ...settings, layout: value })}
              >
                <div
                  className="layout-preview"
                  style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                >
                  {Array.from({ length: cols * rows }).map((_, i) => (
                    <div key={i} className="layout-cell" />
                  ))}
                </div>
                <span className="layout-label">{label}</span>
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
