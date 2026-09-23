declare module '@api.video/react-native-livestream' {
  import * as React from 'react';
  import { ViewStyle } from 'react-native';

  export type ApiVideoLiveStreamMethods = {
    startStreaming: (streamKey: string, url?: string) => Promise<boolean>;
    stopStreaming: () => void;
    setZoomRatio: (zoomRatio: number) => void;
  };

  type ApiVideoLiveStreamProps = {
    style?: ViewStyle;
    camera?: 'front' | 'back';
    video?: {
      bitrate?: number;
      fps?: number;
      resolution?: string;
      gopDuration?: number;
    };
    isMuted?: boolean;
    audio?: {
      bitrate?: number;
      sampleRate?: number;
      isStereo?: boolean;
    };
    zoomRatio?: number;
    enablePinchedZoom?: boolean;
    onConnectionSuccess?: () => void;
    onConnectionFailed?: (code: string) => void;
    onDisconnect?: () => void;
    onPermissionsDenied?: (permissions: string[]) => void;
  };

  export const ApiVideoLiveStreamView: React.ForwardRefExoticComponent<
    ApiVideoLiveStreamProps & React.RefAttributes<ApiVideoLiveStreamMethods>
  >;
}
