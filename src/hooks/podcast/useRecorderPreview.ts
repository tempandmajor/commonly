import { useRef } from 'react';

interface ILocalTrack {
  play: (container: HTMLElement) => void;
  stop: () => void;
}

export const useRecorderPreview = (localTracks: ILocalTrack[]) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const startPreview = () => {};

  const stopPreview = () => {};

  return {
    videoRef,
    audioRef,
    startPreview,
    stopPreview,
  };
};
