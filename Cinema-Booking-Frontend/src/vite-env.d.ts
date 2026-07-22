/// <reference types="vite/client" />

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '@/components/RecommendationSection' {
  import type { ComponentType } from 'react';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RecommendationSection: ComponentType<any>;
  export default RecommendationSection;
}
