import React, { useRef, useState, useEffect } from 'react';
import { Image, View, ViewStyle } from 'react-native';

import { ImageBlurProvider } from '../../providers/ImageBlurContext';
import { getImageSource } from '../../utils/image';

import ImageBlurShape, { type ImageBlurShapeProps } from './ImageBlurShape';

import styles from './ImageBlur.styles';

type ImageBlurContainerSize = {
  height: number | undefined;
  width: number | undefined;
};

export type ImageBlurRadius = number;

export type ImageBlurProps = {
  blurChildren: ImageBlurShapeProps['children'];
  children?: React.ReactNode;
  resizeMode?: ImageBlurShapeProps['resizeMode'];
  src: string;
  blurRadius?: ImageBlurRadius;
  style?: ViewStyle;
};

const ImageBlur = ({
  blurChildren,
  children,
  resizeMode = 'cover',
  src,
  blurRadius = 10,
  style,
}: ImageBlurProps) => {
  const [containerSize, setContainerSize] = useState<ImageBlurContainerSize>({
    height: undefined,
    width: undefined,
  });

  const containerRef = useRef<View | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.setNativeProps({ style: { opacity: 1 } });
    }
  }, [containerSize]);

  return (
    <View
      onLayout={({ nativeEvent }) => {
        setContainerSize({
          width: nativeEvent.layout.width,
          height: nativeEvent.layout.height,
        });
      }}
      style={[
        styles.container,
        style,
      ]}
    >
      {containerSize.height && containerSize.width && (
        <View
          ref={containerRef}
          style={[styles.sticked, styles.fitAvailableSpace]}
        >
          <ImageBlurProvider>
            <ImageBlurShape
              containerRef={containerRef}
              image={{
                height: containerSize.height,
                src,
                width: containerSize.width,
              }}
              resizeMode={resizeMode}
              blurRadius={blurRadius}
            >
              {blurChildren}
            </ImageBlurShape>
          </ImageBlurProvider>
        </View>
      )}
      <Image
        style={[styles.sticked, styles.fitAvailableSpace]}
        resizeMode={resizeMode}
        source={getImageSource(src)}
        blurRadius={blurRadius}
      />
      {children}
    </View>
  );
};

export default ImageBlur;