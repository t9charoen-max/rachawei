import { memo, useEffect, useRef } from 'react';
import type { PannellumConfig } from '../lib/pannellum';
import 'pannellum/build/pannellum.css';

interface PannellumPanoramaProps {
  config: PannellumConfig;
  onViewer?: (viewer: PannellumViewer) => void;
  onReady?: () => void;
  onSceneChange?: (sceneId: string) => void;
  onError?: () => void;
  className?: string;
}

export const PannellumPanorama = memo(function PannellumPanorama({
  config,
  onViewer,
  onReady,
  onSceneChange,
  onError,
  className = 'virtual-tour__panorama-mount',
}: PannellumPanoramaProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onViewerRef = useRef(onViewer);
  const onReadyRef = useRef(onReady);
  const onSceneChangeRef = useRef(onSceneChange);
  const onErrorRef = useRef(onError);

  onViewerRef.current = onViewer;
  onReadyRef.current = onReady;
  onSceneChangeRef.current = onSceneChange;
  onErrorRef.current = onError;

  useEffect(() => {
    let viewer: PannellumViewer | null = null;
    let cancelled = false;

    async function init() {
      try {
        await import('pannellum/build/pannellum.js');
        if (cancelled || !mountRef.current) return;

        if (!window.pannellum) {
          onErrorRef.current?.();
          return;
        }

        viewer = window.pannellum.viewer(mountRef.current, config);
        onViewerRef.current?.(viewer);

        viewer.on('load', () => {
          if (!cancelled) onReadyRef.current?.();
        });
        viewer.on('scenechange', (sceneId) => {
          if (!cancelled) onSceneChangeRef.current?.(sceneId ?? viewer!.getScene());
        });
        viewer.on('error', () => {
          if (!cancelled) onErrorRef.current?.();
        });
      } catch {
        if (!cancelled) onErrorRef.current?.();
      }
    }

    init();

    return () => {
      cancelled = true;
      viewer?.destroy();
    };
  }, [config]);

  return <div ref={mountRef} className={className} />;
});
