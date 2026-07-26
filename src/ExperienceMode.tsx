import { useMemo, useRef, useState } from 'react';
import { BowlId, BowlStyleId, bowlSamples, bowlStyles } from './bowlSamplePlayer';
import { activeExperienceChakras, ExperienceChakra, experienceChakras } from './experienceGeometry';

type ExperienceModeProps = {
  started: boolean;
  master: number;
  activeSamples: { sampleId: string; volume: number; muted: boolean }[];
  onPlay: (sampleId: string, volumeOverride?: number) => void;
  onVolumeChange: (chakraId: BowlId, volume: number) => void;
};

const defaultVolumes: Record<BowlId, number> = { crown: 0.62, heart: 0.58, root: 0.54 };

export default function ExperienceMode({ started, master, activeSamples, onPlay, onVolumeChange }: ExperienceModeProps) {
  const [selectedId, setSelectedId] = useState<BowlId>('heart');
  const [volumes, setVolumes] = useState<Record<BowlId, number>>(defaultVolumes);
  const dragRef = useRef<{ chakraId: BowlId; originY: number; originVolume: number } | null>(null);
  const selected = experienceChakras.find(chakra => chakra.id === selectedId) ?? experienceChakras[3];
  const activePlayback = activeSamples.find(sample => sample.sampleId.startsWith(`${selectedId}-`));
  const maxNodeRadius = typeof window === 'undefined' ? 288 : Math.min(288, window.innerWidth * 0.36);

  const setVolume = (chakraId: BowlId, value: number) => {
    const next = Math.max(0.08, Math.min(1, value));
    setVolumes(current => ({ ...current, [chakraId]: next }));
    onVolumeChange(chakraId, next);
  };

  const handlePointerDown = (event: React.PointerEvent, chakra: ExperienceChakra) => {
    if (!chakra.active) return;
    const chakraId = chakra.id as BowlId;
    dragRef.current = { chakraId, originY: event.clientY, originVolume: volumes[chakraId] };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { chakraId, originY, originVolume } = dragRef.current;
    setVolume(chakraId, originVolume + (originY - event.clientY) / 260);
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const select = (chakra: ExperienceChakra) => {
    if (chakra.active) setSelectedId(chakra.id as BowlId);
  };

  const selectedVolume = volumes[selectedId];
  const bowlTiles = useMemo(() => experienceChakras.map(chakra => ({
    chakra,
    samples: chakra.active ? bowlStyles.map(style => bowlSamples.find(sample => sample.bowlId === chakra.id && sample.styleId === style.id)) : [],
  })), []);

  return (
    <section className="experience-shell" aria-label="Experience Mode">
      <div className="experience-heading">
        <div>
          <p className="eyebrow">Client-facing sound interface</p>
          <h2>Arrive in the sound</h2>
          <p>Choose an active bowl, settle into its volume, and let the room remain spacious.</p>
        </div>
        <div className="experience-state" aria-live="polite">
          <span aria-hidden="true" />
          {started ? `${Math.round(master * 100)}% room level` : 'Start audio in Facilitator Mode'}
        </div>
      </div>

      <div className="experience-canvas" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
        <div className="geometry-field" aria-label="Seven chakra positions">
          <div className="geometry-ring ring-outer" />
          <div className="geometry-ring ring-middle" />
          <div className="geometry-ring ring-inner" />
          <div className="radial-paths" aria-hidden="true" />
          <div className="spiral-core" aria-hidden="true"><span /></div>

          {experienceChakras.map(chakra => {
            const isSelected = chakra.id === selectedId;
            const volume = chakra.active ? volumes[chakra.id as BowlId] : undefined;
            return (
              <button
                key={chakra.id}
                className={`chakra-node ${chakra.active ? 'active' : 'inactive'} ${isSelected ? 'selected' : ''}`}
                style={{ '--chakra-color': chakra.color, '--chakra-angle': `${chakra.angle}deg`, '--chakra-volume': volume ?? 0.45, '--chakra-radius': `${Math.round(Math.min(maxNodeRadius, 138 + (volume ?? 0.45) * 110))}px` } as React.CSSProperties}
                onClick={() => select(chakra)}
                onPointerDown={event => handlePointerDown(event, chakra)}
                aria-label={`${chakra.name}${chakra.active ? `, volume ${Math.round((volume ?? 0) * 100)} percent` : ', coming soon'}`}
                aria-pressed={isSelected}
                aria-disabled={!chakra.active}
                disabled={!chakra.active}
              >
                <span className="chakra-node-dot" aria-hidden="true" />
                <span className="chakra-node-label">{chakra.shortName}</span>
                {!chakra.active && <small>Coming soon</small>}
              </button>
            );
          })}

          <div className="experience-core-panel" aria-live="polite">
            <p className="eyebrow" style={{ color: selected.color }}>Selected chakra</p>
            <h3>{selected.name}</h3>
            <p className="core-status">{selected.active ? 'Active in Phase A' : 'Coming soon'}</p>
            {selected.active && <>
              <label className="core-volume">
                <span>Volume</span><strong>{Math.round(selectedVolume * 100)}%</strong>
                <input aria-label={`${selected.name} volume`} type="range" min="0.08" max="1" step="0.01" value={selectedVolume} onChange={event => setVolume(selectedId, Number(event.target.value))} />
              </label>
              <div className="core-actions" aria-label={`${selected.name} bowl controls`}>
                {bowlStyles.map(style => {
                  const sampleId = `${selectedId}-${style.id}`;
                  return <button key={style.id} disabled={!started} onClick={() => onPlay(sampleId, selectedVolume)}>{style.name}</button>;
                })}
              </div>
              <p className="core-playback">{activePlayback?.muted ? 'Muted during playback' : activePlayback ? 'Bowl is sounding' : started ? 'Ready when you are' : 'Audio is not started'}</p>
            </>}
          </div>
        </div>
        <p className="geometry-caption">Move an active node toward the center for a quieter presence, or outward for more presence.</p>
      </div>

      <div className="experience-bowls" aria-label="Chakra bowl selection">
        {bowlTiles.map(({ chakra, samples }) => (
          <button key={chakra.id} className={`bowl-tile ${chakra.id === selectedId ? 'selected' : ''} ${chakra.active ? '' : 'unavailable'}`} style={{ '--chakra-color': chakra.color } as React.CSSProperties} onClick={() => select(chakra)} disabled={!chakra.active} aria-label={`${chakra.name}${chakra.active ? ' bowl' : ', coming soon'}`}>
            <span className="tile-bowl" aria-hidden="true"><span /></span>
            <span className="tile-copy"><strong>{chakra.name}</strong><small>{chakra.active ? `${Math.round((volumes[chakra.id as BowlId] ?? 0) * 100)}% volume` : 'Coming soon'}</small></span>
            {samples.length > 0 && <span className="tile-mark" aria-hidden="true">●</span>}
          </button>
        ))}
      </div>
      <p className="experience-note">Phase A offers Crown, Heart, and Root bowls. The remaining chakra spaces are reserved for future sessions.</p>
    </section>
  );
}
