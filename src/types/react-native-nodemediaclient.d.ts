declare module 'react-native-nodemediaclient' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  export class NodePublisher extends Component<
    ViewProps & {
      url?: string;
      audioParam?: Record<string, unknown>;
      videoParam?: Record<string, unknown>;
      frontCamera?: boolean;
      HWAccelEnable?: boolean;
      onEvent?: (code: number, msg: string) => void;
    }
  > {
    start(): void;
    stop(): void;
    startPreview(): void;
    stopPreview(): void;
    static NMC_CODEC_ID_H264: number;
    static NMC_CODEC_ID_AAC: number;
    static NMC_PROFILE_H264_HIGH: number;
    static NMC_PROFILE_AAC_LC: number;
  }
}
