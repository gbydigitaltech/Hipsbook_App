import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Modal,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import AppButton from '../buttons/AppButton';
import AppTextInput from '../inputs/AppTextInput';
import AppText from '../texts/AppText';
import { getWhipUrl } from './streamConfig';
import { AppFontSize } from '../../styles/sharedstyles';

type StreamPublisherProps = {
  visible: boolean;
  onClose: () => void;
};

const buildPublisherHtml = (whipUrl: string) => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;overflow:hidden;font-family:sans-serif}
video{width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0}
#status{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);
color:#fff;background:rgba(0,0,0,0.6);padding:8px 16px;border-radius:20px;
font-size:14px;z-index:10}
.error{color:#E34A42}
.connected{color:#22C03C}
</style>
</head>
<body>
<video id="preview" autoplay muted playsinline></video>
<div id="status">กำลังเตรียมกล้อง...</div>
<script>
var pc=null;var localStream=null;
async function startPublish(){
  var statusEl=document.getElementById('status');
  try{
    localStream=await navigator.mediaDevices.getUserMedia({
      video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},
      audio:true
    });
    document.getElementById('preview').srcObject=localStream;
    statusEl.textContent='กำลังเชื่อมต่อ...';
    pc=new RTCPeerConnection({iceServers:[]});
    localStream.getTracks().forEach(function(t){pc.addTrack(t,localStream)});
    var offer=await pc.createOffer();
    await pc.setLocalDescription(offer);
    await new Promise(function(resolve){
      if(pc.iceGatheringState==='complete'){resolve();return}
      pc.addEventListener('icegatheringstatechange',function(){
        if(pc.iceGatheringState==='complete')resolve()
      })
    });
    var res=await fetch('${whipUrl}',{
      method:'POST',
      headers:{'Content-Type':'application/sdp'},
      body:pc.localDescription.sdp
    });
    if(!res.ok)throw new Error('Server: '+res.status);
    var answerSdp=await res.text();
    await pc.setRemoteDescription({type:'answer',sdp:answerSdp});
    statusEl.textContent='กำลัง Stream...';
    statusEl.className='connected';
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'connected'}));
  }catch(e){
    statusEl.textContent='ผิดพลาด: '+e.message;
    statusEl.className='error';
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',message:e.message}));
  }
}
startPublish();
window.addEventListener('beforeunload',function(){
  if(pc){pc.close();pc=null}
  if(localStream){localStream.getTracks().forEach(function(t){t.stop()})}
});
</script>
</body>
</html>
`;

const StreamPublisher = ({ visible, onClose }: StreamPublisherProps) => {
  const insets = useSafeAreaInsets();
  const { scale, verticalScale } = useResponsive();
  const webViewRef = useRef<WebView>(null);

  const [streamName, setStreamName] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<
    'idle' | 'connecting' | 'live' | 'error'
  >('idle');

  const whipUrl = useMemo(
    () => getWhipUrl(streamName || 'default'),
    [streamName],
  );
  const publisherHtml = useMemo(() => buildPublisherHtml(whipUrl), [whipUrl]);

  const handleStartStream = useCallback(() => {
    if (!streamName.trim()) return;
    setIsStreaming(true);
    setStreamStatus('connecting');
  }, [streamName]);

  const handleStopStream = useCallback(() => {
    setIsStreaming(false);
    setStreamStatus('idle');
  }, []);

  const handleClose = useCallback(() => {
    handleStopStream();
    setStreamName('');
    onClose();
  }, [handleStopStream, onClose]);

  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'connected') setStreamStatus('live');
      if (data.type === 'error') setStreamStatus('error');
    } catch {}
  }, []);

  const statusColor = useMemo(() => {
    switch (streamStatus) {
      case 'live':
        return AppColors.success;
      case 'connecting':
        return AppColors.warning;
      case 'error':
        return AppColors.danger;
      default:
        return AppColors.grayLight;
    }
  }, [streamStatus]);

  const statusText = useMemo(() => {
    switch (streamStatus) {
      case 'live':
        return 'กำลัง Stream อยู่';
      case 'connecting':
        return 'กำลังเชื่อมต่อ...';
      case 'error':
        return 'เชื่อมต่อไม่สำเร็จ';
      default:
        return 'พร้อม Stream';
    }
  }, [streamStatus]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: AppColors.secondary,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: insets.top + verticalScale(8),
          paddingHorizontal: scale(16),
          paddingBottom: verticalScale(12),
          backgroundColor: AppColors.scrimStrong,
          zIndex: 10,
        },
        closeBtn: {
          padding: scale(8),
        },
        headerTitle: {
          flex: 1,
          marginLeft: scale(8),
        },
        statusBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
          backgroundColor: AppColors.surface,
          paddingHorizontal: scale(12),
          paddingVertical: verticalScale(4),
          borderRadius: scale(12),
        },
        statusDot: {
          width: scale(8),
          height: scale(8),
          borderRadius: scale(4),
        },
        setupContainer: {
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: scale(24),
          gap: verticalScale(20),
        },
        setupTitle: {
          textAlign: 'center',
          marginBottom: verticalScale(8),
        },
        previewHint: {
          textAlign: 'center',
          color: AppColors.grayLight,
          marginTop: verticalScale(4),
        },
        webviewContainer: {
          flex: 1,
        },
        bottomBar: {
          paddingHorizontal: scale(16),
          paddingTop: verticalScale(12),
          paddingBottom: insets.bottom + verticalScale(12),
          backgroundColor: AppColors.scrimStrong,
        },
      }),
    [insets.top, insets.bottom, scale, verticalScale],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      supportedOrientations={['portrait']}
      onRequestClose={handleClose}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons
              name="arrow-back"
              size={IS_TABLET ? 32 : 24}
              color="white"
            />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <AppText fontWeight="medium" fontSize={AppFontSize.subtitle}>
              {isStreaming ? streamName : 'เริ่ม Stream'}
            </AppText>
          </View>
          {isStreaming && (
            <View style={styles.statusBadge}>
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <AppText fontSize={AppFontSize.caption}>{statusText}</AppText>
            </View>
          )}
        </View>

        {!isStreaming ? (
          <View style={styles.setupContainer}>
            <AppText
              fontWeight="medium"
              fontSize={AppFontSize.h1}
              style={styles.setupTitle}
            >
              ตั้งค่า Stream
            </AppText>

            <AppTextInput
              label="ชื่อ Stream"
              placeholder="ใส่ชื่อ Stream ของคุณ"
              value={streamName}
              onChangeText={setStreamName}
            />

            <AppText fontSize={AppFontSize.caption} style={styles.previewHint}>
              จะใช้กล้องหน้าในการ Stream
            </AppText>

            <AppButton
              title="เริ่ม Stream"
              onPress={handleStartStream}
              disabled={!streamName.trim()}
            />
          </View>
        ) : (
          <>
            <View style={styles.webviewContainer}>
              <WebView
                ref={webViewRef}
                source={{ html: publisherHtml }}
                originWhitelist={['*']}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                mediaCapturePermissionGrantType="grant"
                javaScriptEnabled
                onMessage={handleWebViewMessage}
                style={{ backgroundColor: '#000' }}
              />
            </View>

            <View style={styles.bottomBar}>
              <AppButton
                title="หยุด Stream"
                onPress={handleStopStream}
                useGradient={false}
                backgroundColor={AppColors.danger}
              />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

export default StreamPublisher;
