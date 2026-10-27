import { useStore } from '../store';

/** The image the preview shows, plus whether it carries any EXIF values. */
export const useActiveImage = () => {
  const { state } = useStore();
  const activeImage = state.images.find((img) => img.id === state.activeImageId);
  const hasExif = !!activeImage && Object.values(activeImage.exif).some((val) => val !== undefined && val !== null && val !== '');
  return { activeImage, hasExif };
};
