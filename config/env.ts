import dotenv from 'dotenv';
dotenv.config();

export const env = {
  projectName:
    process.env.PROJECT_NAME ||
    'Irreverent',

  previewUrl:
    process.env.PREVIEW_URL ||
    '',

  figmaUrl:
    process.env.FIGMA_URL ||
    '',

  figmaAccessToken:
    process.env.FIGMA_ACCESS_TOKEN ||
    '',

  figmaSource:
    process.env.FIGMA_SOURCE ||
    'offline',
  
  figmaRefresh:
  process.env.FIGMA_REFRESH ===
  'true',

  figmaLiveApi:
  process.env.FIGMA_LIVE_API ===
  'true',

  passwordProtected:
    process.env.PASSWORD_PROTECTED ===
    'true',

  shopifyStoreUrl:
    process.env.SHOPIFY_STORE_URL ||
    '',

  shopifyThemeId:
    process.env.SHOPIFY_THEME_ID ||
    '',

  shopifyStorefrontPassword:
    process.env.SHOPIFY_STOREFRONT_PASSWORD ||
    '',

  clickupApiToken:
    process.env.CLICKUP_API_TOKEN ||
    '',

  clickupListId:
    process.env.CLICKUP_LIST_ID ||
    '',
};