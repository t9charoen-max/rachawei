import type { TourScene } from '../data/tour';
import { TOUR_CONFIG } from '../data/tour';

export interface SinglePanoramaConfig {
  panorama: string;
  pitch?: number;
  yaw?: number;
  hfov?: number;
}

export function buildTourPannellumConfig() {
  const scenes: Record<string, Record<string, unknown>> = {};

  for (const scene of TOUR_CONFIG.scenes) {
    scenes[scene.id] = {
      title: scene.title,
      type: 'equirectangular',
      panorama: scene.panorama,
      pitch: scene.pitch,
      yaw: scene.yaw,
      hfov: scene.hfov,
      hotSpots: scene.hotSpots.map((spot) => ({
        pitch: spot.pitch,
        yaw: spot.yaw,
        type: 'scene',
        text: spot.text,
        sceneId: spot.sceneId,
      })),
    };
  }

  return {
    default: {
      firstScene: TOUR_CONFIG.firstScene,
      sceneFadeDuration: TOUR_CONFIG.sceneFadeDuration,
      autoLoad: true,
      showControls: true,
      showZoomCtrl: true,
      showFullscreenCtrl: true,
      compass: false,
      mouseZoom: true,
      draggable: true,
      keyboardZoom: true,
      hfov: 95,
      minHfov: 50,
      maxHfov: 120,
    },
    scenes,
  };
}

export function buildSinglePannellumConfig({
  panorama,
  pitch = -5,
  yaw = 0,
  hfov = 85,
}: SinglePanoramaConfig) {
  return {
    type: 'equirectangular',
    panorama,
    autoLoad: true,
    showControls: true,
    showZoomCtrl: true,
    showFullscreenCtrl: true,
    compass: false,
    mouseZoom: true,
    draggable: true,
    keyboardZoom: true,
    pitch,
    yaw,
    hfov,
    minHfov: 45,
    maxHfov: 100,
  };
}

export type PannellumConfig = ReturnType<typeof buildTourPannellumConfig> | ReturnType<typeof buildSinglePannellumConfig>;

export function isTourConfig(config: PannellumConfig): config is ReturnType<typeof buildTourPannellumConfig> {
  return 'scenes' in config;
}

export function getTourScene(sceneId: string): TourScene | undefined {
  return TOUR_CONFIG.scenes.find((scene) => scene.id === sceneId);
}
