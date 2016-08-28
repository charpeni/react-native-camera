import React, { Component, PropTypes } from 'react';
import {
  NativeAppEventEmitter,
  NativeModules,
  Platform,
  requireNativeComponent,
  View,
} from 'react-native';

const CameraManager = NativeModules.CameraManager || NativeModules.CameraModule;

export const constants = {
  Aspect: CameraManager.Aspect,
  BarCodeType: CameraManager.BarCodeType,
  CaptureMode: CameraManager.CaptureMode,
  CaptureQuality: CameraManager.CaptureQuality,
  CaptureTarget: CameraManager.CaptureTarget,
  FlashMode: CameraManager.FlashMode,
  Orientation: CameraManager.Orientation,
  TorchMode: CameraManager.TorchMode,
  Type: CameraManager.Type,
};

function convertNativeProps(props) {
  const newProps = { ...props };
  if (typeof props.aspect === 'string') {
    newProps.aspect = constants.Aspect[props.aspect];
  }

  if (typeof props.flashMode === 'string') {
    newProps.flashMode = constants.FlashMode[props.flashMode];
  }

  if (typeof props.orientation === 'string') {
    newProps.orientation = constants.Orientation[props.orientation];
  }

  if (typeof props.torchMode === 'string') {
    newProps.torchMode = constants.TorchMode[props.torchMode];
  }

  if (typeof props.type === 'string') {
    newProps.type = constants.Type[props.type];
  }

  if (typeof props.captureQuality === 'string') {
    newProps.captureQuality = constants.CaptureQuality[props.captureQuality];
  }

  if (typeof props.captureMode === 'string') {
    newProps.captureMode = constants.CaptureMode[props.captureMode];
  }

  // do not register barCodeTypes if no barcode listener
  if (typeof props.onBarCodeRead !== 'function') {
    newProps.barCodeTypes = [];
  }

  return newProps;
}

export default class Camera extends Component {

  static constants = constants;

  static propTypes = {
    ...View.propTypes,
    aspect: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    captureAudio: PropTypes.bool,
    captureMode: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    captureQuality: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    captureTarget: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    defaultOnFocusComponent: PropTypes.bool,
    flashMode: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    keepAwake: PropTypes.bool,
    onBarCodeRead: PropTypes.func,
    onFocusChanged: PropTypes.func,
    onZoomChanged: PropTypes.func,
    mirrorImage: PropTypes.bool,
    barCodeTypes: PropTypes.array,
    orientation: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    playSoundOnCapture: PropTypes.bool,
    torchMode: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    type: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
  };

  static defaultProps = {
    aspect: CameraManager.Aspect.fill,
    barCodeTypes: Object.values(CameraManager.BarCodeType),
    captureAudio: true,
    captureMode: CameraManager.CaptureMode.still,
    captureQuality: CameraManager.CaptureQuality.high,
    captureTarget: CameraManager.CaptureTarget.cameraRoll,
    defaultOnFocusComponent: true,
    flashMode: CameraManager.FlashMode.off,
    mirrorImage: false,
    orientation: CameraManager.Orientation.auto,
    playSoundOnCapture: true,
    torchMode: CameraManager.TorchMode.off,
    type: CameraManager.Type.back,
  };

  static checkDeviceAuthorizationStatus = CameraManager.checkDeviceAuthorizationStatus;
  static checkVideoAuthorizationStatus = CameraManager.checkVideoAuthorizationStatus;
  static checkAudioAuthorizationStatus = CameraManager.checkAudioAuthorizationStatus;

  constructor() {
    super();
    this.state = {
      isAuthorized: false,
      isRecording: false,
    };
    this.camera = null;
  }

  async componentWillMount() {
    this.cameraBarCodeReadListener = NativeAppEventEmitter.addListener(
      'CameraBarCodeRead',
      this.onBarCodeRead,
    );

    const { captureMode } = convertNativeProps({ captureMode: this.props.captureMode });
    const hasVideoAndAudio = this.props.captureAudio &&
      captureMode === Camera.constants.CaptureMode.video;
    const check = hasVideoAndAudio ?
      Camera.checkDeviceAuthorizationStatus : Camera.checkVideoAuthorizationStatus;

    if (check) {
      const isAuthorized = await check();
      this.setState({ isAuthorized });
    }
  }

  componentWillUnmount() {
    this.cameraBarCodeReadListener.remove();

    if (this.state.isRecording) {
      this.stopCapture();
    }
  }

  onBarCodeRead = (data) => {
    if (this.props.onBarCodeRead) {
      this.props.onBarCodeRead(data);
    }
  };

  setNativeProps(props) {
    this.camera.setNativeProps(props);
  }

  getFOV() {
    return CameraManager.getFOV();
  }

  capture(passOptions) {
    const props = convertNativeProps(this.props);
    const options = {
      audio: props.captureAudio,
      barCodeTypes: props.barCodeTypes,
      mode: props.captureMode,
      playSoundOnCapture: props.playSoundOnCapture,
      target: props.captureTarget,
      quality: props.captureQuality,
      type: props.type,
      title: '',
      description: '',
      ...passOptions,
    };

    if (options.mode === Camera.constants.CaptureMode.video) {
      options.totalSeconds = (options.totalSeconds > -1 ? options.totalSeconds : -1);
      options.preferredTimeScale = options.preferredTimeScale || 30;
      this.setState({ isRecording: true });
    }

    return CameraManager.capture(options);
  }

  stopCapture() {
    if (this.state.isRecording) {
      this.setState({ isRecording: false });
      return CameraManager.stopCapture();
    }
    return Promise.resolve('Not Recording.');
  }

  hasFlash() {
    if (Platform.OS === 'android') {
      const props = convertNativeProps(this.props);
      return CameraManager.hasFlash({
        type: props.type,
      });
    }
    return CameraManager.hasFlash();
  }

  render() {
    const nativeProps = convertNativeProps(this.props);

    return <RCTCamera ref={ref => { this.camera = ref; }} {...nativeProps} />;
  }
}

const RCTCamera = requireNativeComponent('RCTCamera', Camera);
