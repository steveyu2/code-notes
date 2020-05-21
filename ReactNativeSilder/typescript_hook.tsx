// from https://github.com/jeanregisser/react-native-slider
import React, {useState, useMemo, useEffect, useCallback} from 'react';

import {
  Animated,
  Image,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  View,
  Easing,
  StyleProp,
  ViewStyle,
  ImageSourcePropType,
  I18nManager,
  ImageStyle
} from 'react-native';

interface GestureStateType {
  dx: number;
}

const TRACK_SIZE = 4;
const THUMB_SIZE = 20;

class Rect {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  containsPoint = (x: number, y: number) => {
    return x >= this.x && y >= this.y && x <= this.x + this.width && y <= this.y + this.height;
  };
}

const DEFAULT_ANIMATION_CONFIGS = {
  spring: {
    friction: 7,
    tension: 100
  },
  timing: {
    duration: 150,
    easing: Easing.inOut(Easing.ease),
    delay: 0
  }
  // decay : { // This has a serious bug
  //   velocity     : 1,
  //   deceleration : 0.997
  // }
};

interface SliderProps {
  /**
   * Initial value of the slider. The value should be between minimumValue
   * and maximumValue, which default to 0 and 1 respectively.
   * Default value is 0.
   *
   * *This is not a controlled component*, e.g. if you don't update
   * the value, the component won't be reset to its inital value.
   */
  value?: number;

  /**
   * If true the user won't be able to move the slider.
   * Default value is false.
   */
  disabled?: boolean;

  /**
   * Initial minimum value of the slider. Default value is 0.
   */
  minimumValue?: number;

  /**
   * Initial maximum value of the slider. Default value is 1.
   */
  maximumValue?: number;

  /**
   * Step value of the slider. The value should be between 0 and
   * (maximumValue - minimumValue). Default value is 0.
   */
  step?: number;

  /**
   * The color used for the track to the left of the button. Overrides the
   * default blue gradient image.
   */
  minimumTrackTintColor?: string;

  /**
   * The color used for the track to the right of the button. Overrides the
   * default blue gradient image.
   */
  maximumTrackTintColor?: string;

  /**
   * The color used for the thumb.
   */
  thumbTintColor?: string;

  /**
   * The size of the touch area that allows moving the thumb.
   * The touch area has the same center has the visible thumb.
   * This allows to have a visually small thumb while still allowing the user
   * to move it easily.
   * The default is {width: 40, height: 40}.
   */
  thumbTouchSize?: {width: number; height: number};

  /**
   * Callback continuously called while the user is dragging the slider.
   */
  onValueChange?: (value: number) => any;

  valueSholudChange?: (value: number) => boolean;
  /**
   * Callback called when the user starts changing the value (e.g. when
   * the slider is pressed).
   */
  onSlidingStart?: () => {};

  /**
   * Callback called when the user finishes changing the value (e.g. when
   * the slider is released).
   */
  onSlidingComplete?: () => {};

  /**
   * The style applied to the slider container.
   */
  style?: StyleProp<ViewStyle>;

  styles?: {[_: string]: StyleProp<{}>};

  /**
   * The style applied to the track.
   */
  trackStyle?: StyleProp<ViewStyle>;

  /**
   * The style applied to the thumb.
   */
  thumbStyle?: StyleProp<ViewStyle>;

  /**
   * Sets an image for the thumb.
   */
  thumbImage?: ImageSourcePropType;

  thumbImageStyle?: StyleProp<ImageStyle>;

  /**
   * Set this to true to visually see the thumb touch rect in green.
   */
  debugTouchArea?: boolean;

  /**
   * Set to true to animate values with default 'timing' animation type
   */
  animateTransitions?: boolean;

  /**
   * Custom Animation type. 'spring' or 'timing'.
   */
  animationType?: 'spring' | 'timing';

  /**
   * Used to configure the animation parameters.  These are the same parameters in the Animated library.
   */
  animationConfig?: object;
}
const thumbTouchSizeDefaultValue = {width: 40, height: 40};
export default (props: SliderProps) => {
  const {
    value: propValue = 0,
    minimumValue = 0,
    maximumValue = 5,
    step = 0,
    minimumTrackTintColor = '#3f3f3f',
    maximumTrackTintColor = '#b3b3b3',
    thumbTintColor = '#343434',
    thumbTouchSize = thumbTouchSizeDefaultValue,
    debugTouchArea = false,
    animationType = 'timing',
    styles,
    style,
    trackStyle,
    thumbStyle,
    animateTransitions,
    valueSholudChange,
    disabled,
    animationConfig,
    thumbImage,
    thumbImageStyle,
    onSlidingComplete,
    onSlidingStart,
    onValueChange,
    ...other
  } = props;

  const that: {
    _containerSize?: {width: number; height: number};
    _trackSize?: {width: number; height: number};
    _thumbSize?: {width: number; height: number};
    _previousLeft?: number;
  } = useMemo(() => ({}), []);
  console.log(that);
  // state
  const [containerSize, setContainerSize] = useState({width: 0, height: 0});
  const [, setTrackSize] = useState({width: 0, height: 0});
  const [thumbSize, setThumbSize] = useState({width: 0, height: 0});
  const [allMeasured, setAllMeasured] = useState(false);
  const [value]: [Animated.Value, (v: Animated.Value) => any] = useState(new Animated.Value(propValue));

  useEffect(() => {
    if (animateTransitions) {
      _setCurrentValueAnimated(propValue);
    } else {
      _setCurrentValue(propValue);
    }
  }, [propValue]);

  const mainStyles = styles || defaultStyles;
  const thumbLeft = value.interpolate({
    inputRange: [minimumValue, maximumValue],
    outputRange: I18nManager.isRTL ? [0, -(containerSize.width - thumbSize.width)] : [0, containerSize.width - thumbSize.width]
    // extrapolate: 'clamp',
  });
  const minimumTrackWidth = value.interpolate({
    inputRange: [minimumValue, maximumValue],
    outputRange: [0, containerSize.width - thumbSize.width]
    // extrapolate: 'clamp',
  });
  const valueVisibleStyle: ViewStyle = {};
  if (!allMeasured) {
    valueVisibleStyle.opacity = 0;
  }

  const minimumTrackStyle = {
    position: 'absolute',
    width: Animated.add(minimumTrackWidth, thumbSize.width / 2),
    backgroundColor: minimumTrackTintColor,
    ...valueVisibleStyle
  };

  const _getTouchOverflowSize = useCallback(() => {
    const size: any = {};
    if (allMeasured === true) {
      size.width = Math.max(0, thumbTouchSize.width - thumbSize.width);
      size.height = Math.max(0, thumbTouchSize.height - containerSize.height);
    }

    return size;
  }, [allMeasured, thumbTouchSize, thumbSize, containerSize]);

  const _getTouchOverflowStyle = useCallback(() => {
    const {width, height} = _getTouchOverflowSize();

    const touchOverflowStyle: ViewStyle = {};
    if (width !== undefined && height !== undefined) {
      const verticalMargin = -height / 2;
      touchOverflowStyle.marginTop = verticalMargin;
      touchOverflowStyle.marginBottom = verticalMargin;

      const horizontalMargin = -width / 2;
      touchOverflowStyle.marginLeft = horizontalMargin;
      touchOverflowStyle.marginRight = horizontalMargin;
    }

    if (debugTouchArea === true) {
      touchOverflowStyle.backgroundColor = 'orange';
      touchOverflowStyle.opacity = 0.5;
    }

    return touchOverflowStyle;
  }, [_getTouchOverflowSize, debugTouchArea]);
  const touchOverflowStyle = _getTouchOverflowStyle();

  const render = () => {
    return (
      <View {...getRenderContainerProps()} style={[mainStyles.container, style]} onLayout={_measureContainer}>
        <View
          style={[{backgroundColor: maximumTrackTintColor}, mainStyles.track, trackStyle]}
          renderToHardwareTextureAndroid
          onLayout={_measureTrack}
        />
        <Animated.View renderToHardwareTextureAndroid style={[mainStyles.track, trackStyle, minimumTrackStyle]} />
        <Animated.View
          onLayout={_measureThumb}
          renderToHardwareTextureAndroid
          style={[
            {backgroundColor: thumbTintColor},
            mainStyles.thumb,
            thumbStyle,
            {
              transform: [{translateX: thumbLeft}, {translateY: 0}],
              ...valueVisibleStyle
            }
          ]}
        >
          {_renderThumbImage()}
        </Animated.View>
        <View renderToHardwareTextureAndroid style={[defaultStyles.touchArea, touchOverflowStyle]} {..._panResponder.panHandlers}>
          {debugTouchArea === true && _renderDebugThumbTouchRect(minimumTrackWidth)}
        </View>
      </View>
    );
  };
  // function

  const getRenderContainerProps = () => {
    const {
      minimumValue,
      maximumValue,
      minimumTrackTintColor,
      maximumTrackTintColor,
      thumbTintColor,
      styles,
      style,
      trackStyle,
      thumbStyle,
      debugTouchArea,
      ...res
    } = props;
    return res;
  };

  // const _getPropsForComponentUpdate = (props: SliderProps) => {
  //   const {
  //     value,
  //     onValueChange,
  //     onSlidingStart,
  //     onSlidingComplete,
  //     style,
  //     trackStyle,
  //     thumbStyle,
  //     ...otherProps
  //   } = props;

  //   return otherProps;
  // };
  const _getCurrentValue = useCallback<() => number>(() => (value as any).__getValue(), []);

  const _setCurrentValue = useCallback((v: number) => {
    value.setValue(v);
  }, []);

  const _getRatio = useCallback(
    (value: number) => {
      return (value - minimumValue) / (maximumValue - minimumValue);
    },
    [maximumValue, minimumValue]
  );

  const _getThumbLeft = useCallback(
    (value: number) => {
      const nonRtlRatio = _getRatio(value);
      const ratio = I18nManager.isRTL ? 1 - nonRtlRatio : nonRtlRatio;
      return ratio * (containerSize.width - thumbSize.width);
    },
    [_getRatio, I18nManager, containerSize.width, thumbSize.width]
  );

  const _getThumbTouchRect = useCallback(() => {
    const touchOverflowSize = _getTouchOverflowSize();

    return new Rect(
      touchOverflowSize.width / 2 + _getThumbLeft(_getCurrentValue()) + (thumbSize.width - thumbTouchSize.width) / 2,
      touchOverflowSize.height / 2 + (containerSize.height - thumbTouchSize.height) / 2,
      thumbTouchSize.width,
      thumbTouchSize.height
    );
  }, [
    _getTouchOverflowSize,
    _getThumbLeft,
    _getCurrentValue,
    thumbSize.width,
    containerSize.height,
    thumbTouchSize.height,
    thumbTouchSize.width
  ]);

  const _thumbHitTest = useCallback(
    (e: any) => {
      const nativeEvent = e.nativeEvent;
      const thumbTouchRect = _getThumbTouchRect();
      return thumbTouchRect.containsPoint(nativeEvent.locationX, nativeEvent.locationY);
    },
    [_getThumbTouchRect]
  );
  const _handleStartShouldSetPanResponder = useCallback(
    (e: GestureResponderEvent /* gestureState: Object */): boolean => _thumbHitTest(e),
    [_thumbHitTest]
  );
  // Should we become active when the user presses down on the thumb?

  const _handleMoveShouldSetPanResponder = useCallback(
    (/* e: Object, gestureState: Object */): boolean => {
      // Should we become active when the user moves a touch over the thumb?
      return false;
    },
    []
  );

  const _fireChangeEvent = useCallback(
    (event: 'onSlidingComplete' | 'onSlidingStart') => {
      const ev = props[event];
      if (ev) {
        ev();
      }
    },
    [onSlidingComplete, onSlidingStart, _getCurrentValue]
  );

  const _handlePanResponderGrant = useCallback(
    (/* e: Object, gestureState: Object */) => {
      that._previousLeft = _getThumbLeft(_getCurrentValue());
      _fireChangeEvent('onSlidingStart');
    },
    [_getThumbLeft, _getCurrentValue, _fireChangeEvent]
  );

  const _getValue = useCallback(
    (gestureState: GestureStateType) => {
      const length = containerSize.width - thumbSize.width;
      const thumbLeft = (that._previousLeft || 0) + gestureState.dx;

      const nonRtlRatio = thumbLeft / length;
      const ratio = I18nManager.isRTL ? 1 - nonRtlRatio : nonRtlRatio;

      if (step) {
        return Math.max(
          minimumValue,
          Math.min(maximumValue, minimumValue + Math.round((ratio * (maximumValue - minimumValue)) / step) * step)
        );
      }
      return Math.max(minimumValue, Math.min(maximumValue, ratio * (maximumValue - minimumValue) + minimumValue));
    },
    [containerSize.width, thumbSize.width, that._previousLeft, I18nManager.isRTL, step, minimumValue, maximumValue]
  );

  const _handlePanResponderMove = useCallback(
    (e: GestureResponderEvent, gestureState: GestureStateType) => {
      if (disabled) {
        return;
      }
      const value = _getValue(gestureState);
      if ((valueSholudChange || (() => true))(value)) {
        _setCurrentValue(value);
        onValueChange && onValueChange(_getCurrentValue());
      }
    },
    [disabled, _getValue, valueSholudChange, _setCurrentValue, onValueChange]
  );

  const _handlePanResponderRequestEnd = useCallback(() => {
    // Should we allow another component to take over this pan?
    return false;
  }, []);
  const _handlePanResponderEnd = useCallback(
    (e: GestureResponderEvent, gestureState: GestureStateType) => {
      if (disabled) {
        return;
      }

      const value = _getValue(gestureState);
      if ((valueSholudChange || (() => true))(value)) {
        _setCurrentValue(value);
        _fireChangeEvent('onSlidingComplete');
      }
    },
    [disabled, _getValue, valueSholudChange, _setCurrentValue, _fireChangeEvent]
  );

  const _panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: _handleStartShouldSetPanResponder,
        onMoveShouldSetPanResponder: _handleMoveShouldSetPanResponder,
        onPanResponderGrant: _handlePanResponderGrant,
        onPanResponderMove: _handlePanResponderMove,
        onPanResponderRelease: _handlePanResponderEnd,
        onPanResponderTerminationRequest: _handlePanResponderRequestEnd,
        onPanResponderTerminate: _handlePanResponderEnd
      }),
    [
      _handleStartShouldSetPanResponder,
      _handleMoveShouldSetPanResponder,
      _handlePanResponderGrant,
      _handlePanResponderMove,
      _handlePanResponderEnd,
      _handlePanResponderRequestEnd
    ]
  );

  const _handleMeasure = useCallback(
    (name: 'containerSize' | 'trackSize' | 'thumbSize', x: any) => {
      const {width, height} = x.nativeEvent.layout;
      const size = {width, height};

      const storeName = `_${name}` as '_containerSize' | '_trackSize' | '_thumbSize';
      const currentSize: {width: number; height: number} | undefined = that[storeName];
      if (currentSize && width === currentSize.width && height === currentSize.height) {
        return;
      }
      that[storeName] = size;

      if (that._containerSize || that._trackSize || that._thumbSize) {
        that._containerSize && setContainerSize(that._containerSize);
        that._trackSize && setTrackSize(that._trackSize);
        that._thumbSize && setThumbSize(that._thumbSize);
        setAllMeasured(true);
      }
    },
    [
      that
      // that._containerSize,
      // that._trackSize,
      // that._thumbSize,
      // setContainerSize,
      // setTrackSize,
      // setThumbSize,
      // setAllMeasured
    ]
  );
  const _measureContainer = useCallback(
    (x: Object) => {
      _handleMeasure('containerSize', x);
    },
    [_handleMeasure]
  );

  const _measureTrack = useCallback(
    (x: Object) => {
      _handleMeasure('trackSize', x);
    },
    [_handleMeasure]
  );

  const _measureThumb = useCallback(
    (x: Object) => {
      _handleMeasure('thumbSize', x);
    },
    [_handleMeasure]
  );

  const _setCurrentValueAnimated = useCallback(
    (v: number) => {
      const animationConfig_ = Object.assign({}, DEFAULT_ANIMATION_CONFIGS[animationType], animationConfig, {
        toValue: v
      });

      Animated[animationType](value, animationConfig_).start();
    },
    [DEFAULT_ANIMATION_CONFIGS, animationType, Animated, animationConfig, value]
  );

  const _renderDebugThumbTouchRect = useCallback(
    (thumbLeft: Animated.AnimatedInterpolation) => {
      const thumbTouchRect = _getThumbTouchRect();
      const positionStyle = {
        left: thumbLeft,
        top: thumbTouchRect.y,
        width: thumbTouchRect.width,
        height: thumbTouchRect.height
      };

      return <Animated.View style={[defaultStyles.debugThumbTouchArea, positionStyle]} pointerEvents="none" />;
    },
    [_getThumbTouchRect, defaultStyles.debugThumbTouchArea]
  );
  const _renderThumbImage = () => {
    if (!thumbImage) return;

    return <Image source={thumbImage} style={thumbImageStyle} />;
  };

  return render();
};

var defaultStyles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center'
  },
  track: {
    height: TRACK_SIZE,
    borderRadius: TRACK_SIZE / 2
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2
  },
  touchArea: {
    position: 'absolute',
    backgroundColor: 'transparent',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  debugThumbTouchArea: {
    position: 'absolute',
    backgroundColor: 'green',
    opacity: 0.5
  }
});
