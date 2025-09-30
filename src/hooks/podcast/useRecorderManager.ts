import { useState } from 'react';

interface ILocalTrack {
  stop: () => void;
  close: () => void;
}

export const useRecorderManager = () => {
  const [localTracks, setLocalTracks] = useState<ILocalTrack[]>([]);

  const createTracks = async () => {
    return [];
  };

  const destroyTracks = async () => {};

  return {
    localTracks,
    createTracks,
    destroyTracks,
  };
};
