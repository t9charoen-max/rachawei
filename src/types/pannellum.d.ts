interface PannellumViewer {
  destroy: () => void;
  getScene: () => string;
  loadScene: (sceneId: string, pitch?: number, yaw?: number, hfov?: number) => void;
  on: (event: string, callback: (sceneId?: string) => void) => void;
  off: (event: string, callback: (sceneId?: string) => void) => void;
}

interface PannellumLib {
  viewer: (container: HTMLElement, config: Record<string, unknown>) => PannellumViewer;
}

interface Window {
  pannellum?: PannellumLib;
}

declare module 'pannellum/build/pannellum.js' {
  const pannellum: unknown;
  export default pannellum;
}
