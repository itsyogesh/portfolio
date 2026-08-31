import type { ComponentProps } from 'react';

type ImageProperties = Omit<ComponentProps<'img'>, 'ref'> & {
  alt: string;
};

export const Image = ({ alt, ...props }: ImageProperties) => (
  // biome-ignore lint/nursery/noImgElement: <explanation>
  // biome-ignore lint/a11y/useAltText: <explanation>
  <img alt={alt || 'Content Image'} {...props} />
);
