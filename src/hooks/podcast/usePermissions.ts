import { useState, useEffect } from 'react';

export const usePermissions = (requiresVideo: boolean) => {
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'prompt' | 'unknown'
  >('unknown');

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [requiresVideo]);

  const checkPermissions = async () => {
    try {
      // Check if the permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        // Check microphone permission
        const micPermission = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });

        // Check camera permission if video is required
        if (requiresVideo) {
          const cameraPermission = await navigator.permissions.query({
            name: 'camera' as PermissionName,
          });

          // If either permission is denied, consider the overall status as denied
          if (micPermission.state === 'denied' || cameraPermission.state === 'denied') {
            setPermissionStatus('denied');
          } else if (
            micPermission.state === 'granted' &&
            (requiresVideo ? cameraPermission.state === 'granted' : true)
          ) {
            setPermissionStatus('granted');
          } else {
            setPermissionStatus('prompt');
          }

          // Set up event listeners to track permission changes
          micPermission.addEventListener('change', checkPermissions);
          cameraPermission.addEventListener('change', checkPermissions);
        } else {
          // Only microphone is required
          setPermissionStatus(micPermission.state as 'granted' | 'denied' | 'prompt');

          // Set up event listener to track permission changes
          micPermission.addEventListener('change', checkPermissions);
        }
      } else {
        setPermissionStatus('unknown');
      }
    } catch (error) {
      setPermissionStatus('unknown');
    }
  };

  // Request permissions explicitly
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: requiresVideo,
      };

      // Request permissions by attempting to access media devices
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Stop all tracks immediately - we just need this to trigger the permission dialog
      stream.getTracks().forEach(track => track.stop());

      // Update permission status after request
      await checkPermissions();

      // If we got this far, permissions were granted
      return true;
    } catch (error) {
      // Update permission status after failed request
      await checkPermissions();

      return false;
    }
  };

  // Function to help user open browser permission settings
  const openPermissionSettings = () => {
    if (permissionStatus === 'denied') {
      if (navigator.userAgent.indexOf('Chrome') !== -1) {
        alert('Please open chrome://settings/content/camera in a new tab to enable camera access');
      } else if (navigator.userAgent.indexOf('Firefox') !== -1) {
        alert('Please open about:preferences#privacy in Firefox and allow camera access');
      } else {
        alert('Please check your browser settings to enable camera and microphone permissions');
      }
    }
  };

  return {
    permissionStatus,
    requestPermissions,
    openPermissionSettings,
  };
};
