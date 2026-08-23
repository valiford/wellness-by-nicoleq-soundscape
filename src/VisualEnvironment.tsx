import { useEffect, useState } from 'react';

export type VisualEnvironmentId = 'pearl' | 'violet' | 'chakra' | 'spiral' | 'still';

export type VisualEnvironmentDefinition = {
  id: VisualEnvironmentId;
  name: string;
  description: string;
  video?: string;
  poster?: string;
};

export const visualEnvironments: VisualEnvironmentDefinition[] = [
  { id: 'pearl', name: 'Pearl Flow', description: 'Champagne light and quiet geometry.', video: '/media/environments/optimized/pearl-flow.mp4', poster: '/media/environments/posters/pearl-flow.jpg' },
  { id: 'violet', name: 'Violet Flow', description: 'Violet depth for meditation and breathwork.', video: '/media/environments/optimized/violet-flow.mp4', poster: '/media/environments/posters/violet-flow.jpg' },
  { id: 'chakra', name: 'Chakra Flow', description: 'A more expressive, colorful current.', video: '/media/environments/optimized/chakra-flow.mp4', poster: '/media/environments/posters/chakra-flow.jpg' },
  { id: 'spiral', name: 'Reactive Spiral', description: 'The audio-reactive center visual.', poster: '/media/environments/posters/pearl-flow.jpg' },
  { id: 'still', name: 'Still / None', description: 'A quiet, unobstructed session surface.' },
];

export default function VisualEnvironment({ selectedId, onChange, motionEnabled }: { selectedId: VisualEnvironmentId; onChange: (id: VisualEnvironmentId) => void; motionEnabled: boolean }) {
  const selected = visualEnvironments.find(environment => environment.id === selectedId) ?? visualEnvironments[0];
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(true);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    setFailed(false);
    setVisible(false);
    const timer = window.setTimeout(() => setVisible(true), 80);
    return () => window.clearTimeout(timer);
  }, [selectedId]);

  return (
    <div className={`visual-environment visual-${selected.id} ${visible ? 'visible' : ''}`}>
      {selected.video && !reducedMotion && motionEnabled && !failed && <video key={selected.video} className="visual-environment-video" src={selected.video} poster={selected.poster} muted loop autoPlay playsInline onError={() => setFailed(true)} />}
      {selected.poster && <img className="visual-environment-poster" src={selected.poster} alt="" />}
      <div className="visual-environment-shade" />
      <div className="visual-environment-picker" aria-hidden="false">
        <span>Visual environment</span>
        <select value={selectedId} onChange={event => onChange(event.target.value as VisualEnvironmentId)} aria-label="Visual environment">
          {visualEnvironments.map(environment => <option value={environment.id} key={environment.id}>{environment.name}</option>)}
        </select>
      </div>
    </div>
  );
}
