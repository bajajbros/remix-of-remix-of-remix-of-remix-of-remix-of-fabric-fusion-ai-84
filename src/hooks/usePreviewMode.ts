export const usePreviewMode = () => {
  const isPreviewMode = typeof window !== 'undefined' && 
    window.location.hostname === 'preview.qwii.in';
  
  return { isPreviewMode };
};

export const isPreviewDomain = () => {
  return typeof window !== 'undefined' && 
    window.location.hostname === 'preview.qwii.in';
};
