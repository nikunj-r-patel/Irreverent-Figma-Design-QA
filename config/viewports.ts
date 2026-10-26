export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
  category: 'xl' | 'desktop' | 'tablet' | 'mobile';
  figmaReference: boolean;
}

export const viewports: ViewportConfig[] = [
  // ==========================================
  // XL — 1600px+
  // ==========================================

  {
    name: 'xl-1728',
    width: 1728,
    height: 1080,
    category: 'xl',
    figmaReference: true,
  },

  {
    name: 'xl-1600',
    width: 1600,
    height: 900,
    category: 'xl',
    figmaReference: false,
  },

  {
    name: 'xl-1920',
    width: 1920,
    height: 1080,
    category: 'xl',
    figmaReference: false,
  },

  // ==========================================
  // Desktop — 1200px to 1599px
  // ==========================================

  {
    name: 'desktop-1440',
    width: 1440,
    height: 900,
    category: 'desktop',
    figmaReference: false,
  },

  {
    name: 'desktop-1200',
    width: 1200,
    height: 900,
    category: 'desktop',
    figmaReference: false,
  },

  {
    name: 'desktop-1280',
    width: 1280,
    height: 900,
    category: 'desktop',
    figmaReference: true,
  },

  {
    name: 'desktop-1366',
    width: 1366,
    height: 900,
    category: 'desktop',
    figmaReference: false,
  },

  {
    name: 'desktop-1536',
    width: 1536,
    height: 900,
    category: 'desktop',
    figmaReference: false,
  },

  {
    name: 'desktop-1599',
    width: 1599,
    height: 900,
    category: 'desktop',
    figmaReference: false,
  },

  // ==========================================
  // Tablet — 744px to 1199px
  // ==========================================

  {
    name: 'tablet-775',
    width: 775,
    height: 1133,
    category: 'tablet',
    figmaReference: true,
  },

  {
    name: 'tablet-744',
    width: 744,
    height: 1133,
    category: 'tablet',
    figmaReference: false,
  },

  {
    name: 'tablet-768',
    width: 768,
    height: 1024,
    category: 'tablet',
    figmaReference: false,
  },

  {
    name: 'tablet-834',
    width: 834,
    height: 1112,
    category: 'tablet',
    figmaReference: false,
  },

  {
    name: 'tablet-1024',
    width: 1024,
    height: 1366,
    category: 'tablet',
    figmaReference: false,
  },

  {
    name: 'tablet-1199',
    width: 1199,
    height: 900,
    category: 'tablet',
    figmaReference: false,
  },

  // ==========================================
  // Mobile — below 768px
  // ==========================================

  {
    name: 'mobile-402',
    width: 402,
    height: 874,
    category: 'mobile',
    figmaReference: false,
  },

  {
    name: 'mobile-390',
    width: 390,
    height: 844,
    category: 'mobile',
    figmaReference: true,
  },

  {
    name: 'mobile-375',
    width: 375,
    height: 812,
    category: 'mobile',
    figmaReference: false,
  },

  {
    name: 'mobile-320',
    width: 320,
    height: 844,
    category: 'mobile',
    figmaReference: false,
  },

  {
    name: 'mobile-430',
    width: 430,
    height: 932,
    category: 'mobile',
    figmaReference: false,
  },
];