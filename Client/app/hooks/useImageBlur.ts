import { useContext } from 'react';

import { ImageBlurContext } from '../providers/ImageBlurContext';

const useImageBlur = () => {
  const context = useContext(ImageBlurContext);

  if (!context) {
    throw new Error('useImageBlur must be used within a ImageBlurProvider');
  }

  return context;
};

export default useImageBlur;