import { useState } from 'react';

interface ILocalTrack {
  setEnabled: (enabled: boolean) => Promise<void>;
}

export const useRecordingControls = (localTracks: ILocalTrack[]) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const toggleAudio = async () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  const toggleVideo = async () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  return {
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
  };
};
