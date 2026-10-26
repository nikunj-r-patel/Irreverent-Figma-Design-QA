import { Api } from 'figma-api';
import fs from 'fs';
import path from 'path';

export class FigmaClient {
  private readonly client: Api;

  constructor(accessToken: string) {
    this.client = new Api({
      personalAccessToken: accessToken,
    });
  }

 async getFile(
  fileKey: string,
  forceRefresh = false
): Promise<
  Awaited<
    ReturnType<Api['getFile']>
  >
> {
  const cacheDirectory =
    path.join(
      process.cwd(),
      'figma',
      'cache'
    );

  const cacheFile =
    path.join(
      cacheDirectory,
      `${fileKey}.json`
    );

  /*
   * Normal QA runs should reuse
   * previously downloaded Figma data.
   */
  if (
    !forceRefresh &&
    fs.existsSync(cacheFile)
  ) {
    const cachedContent =
      fs.readFileSync(
        cacheFile,
        'utf8'
      );

    return JSON.parse(
  cachedContent
) as Awaited<
  ReturnType<Api['getFile']>
>;
  }

  /*
 * Cache does not exist yet,
 * or refresh was explicitly requested.
 *
 * Figma may temporarily return HTTP 429.
 * Retry only rate-limit failures and let
 * all other API errors fail immediately.
 */
let file:
  Awaited<
    ReturnType<Api['getFile']>
  >;

const retryDelays = [
  15000,
  30000,
];

for (
  let attempt = 0;
  ;
  attempt++
) {
  try {
    file =
      await this.client.getFile({
        file_key: fileKey,
      });

    break;
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);
        const apiError =
  error as {
    error?: {
      response?: {
        status?: number;
        data?: unknown;
        headers?: {
          get?: (
            name: string
          ) => unknown;

          [key: string]:
            unknown;
        };
      };
    };
  };

const response =
  apiError.error?.response;

const retryAfter =
  response?.headers?.get?.(
    'retry-after'
  ) ??
  response?.headers?.[
    'retry-after'
  ];
const planTier =
  response?.headers?.get?.(
    'x-figma-plan-tier'
  ) ??
  response?.headers?.[
    'x-figma-plan-tier'
  ];

const rateLimitType =
  response?.headers?.get?.(
    'x-figma-rate-limit-type'
  ) ??
  response?.headers?.[
    'x-figma-rate-limit-type'
  ];

const upgradeLink =
  response?.headers?.get?.(
    'x-figma-upgrade-link'
  ) ??
  response?.headers?.[
    'x-figma-upgrade-link'
  ];
console.log(
  'Figma API diagnostic:',
  {
    status:
      response?.status,

    retryAfter,

    planTier,

    rateLimitType,

    upgradeLink,

    data:
      response?.data,
  }
);

    const isRateLimited =
  response?.status === 429 ||
  message.includes('429');

const retryAfterSeconds =
  typeof retryAfter === 'string'
    ? Number.parseInt(
        retryAfter,
        10
      )
    : typeof retryAfter === 'number'
      ? retryAfter
      : Number.NaN;

const hasLongRetryAfter =
  Number.isFinite(
    retryAfterSeconds
  ) &&
  retryAfterSeconds > 60;

if (
  !isRateLimited ||
  hasLongRetryAfter ||
  attempt >= retryDelays.length
) {
  if (
    isRateLimited &&
    hasLongRetryAfter
  ) {
    console.log(
      `Figma API retry blocked by server. ` +
      `Retry-After: ${retryAfterSeconds}s.`
    );
  }

  throw error;
}

const serverDelay =
  Number.isFinite(
    retryAfterSeconds
  )
    ? retryAfterSeconds * 1000
    : 0;

const delay =
  Math.max(
    retryDelays[attempt],
    serverDelay
  );

    console.log(
      `Figma API rate limited. ` +
      `Retrying in ${delay / 1000}s...`
    );

    await new Promise<void>(
      resolve =>
        setTimeout(
          resolve,
          delay
        )
    );
  }
}

  fs.mkdirSync(
    cacheDirectory,
    {
      recursive: true,
    }
  );

  fs.writeFileSync(
    cacheFile,
    JSON.stringify(
      file,
      null,
      2
    ),
    'utf8'
  );

  return file;
}

  static parseFigmaUrl(figmaUrl: string): {
  fileKey: string;
  nodeId: string | null;
  } {
  const url = new URL(figmaUrl);

  const pathParts = url.pathname.split('/').filter(Boolean);

  const fileKey = pathParts[1];

  const nodeIdParam = url.searchParams.get('node-id');

  const nodeId = nodeIdParam
    ? nodeIdParam.replace('-', ':')
    : null;

  return {
    fileKey,
    nodeId,
  };
}
static findNodeByName(
  node: any,
  targetName: string
): any | null {
  if (node.name === targetName) {
    return node;
  }

  if (!Array.isArray(node.children)) {
    return null;
  }

  for (const child of node.children) {
    const found = this.findNodeByName(
      child,
      targetName
    );

    if (found) {
      return found;
    }
  }

  return null;
}

static findAllTextNodes(
  node: any
): any[] {
  const results: any[] = [];

  if (
    node.type === 'TEXT' &&
    typeof node.characters === 'string' &&
    node.characters.trim() !== ''
  ) {
    results.push(node);
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      results.push(
        ...this.findAllTextNodes(child)
      );
    }
  }

  return results;
}
static findAllTextNodesWithPath(
  node: any,
  path: string[] = []
): Array<{
  node: any;
  path: string[];
}> {
  const results: Array<{
    node: any;
    path: string[];
  }> = [];

  const currentPath = [
    ...path,
    node.name,
  ];

  if (
    node.type === 'TEXT' &&
    typeof node.characters === 'string' &&
    node.characters.trim() !== ''
  ) {
    results.push({
      node,
      path: currentPath,
    });
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      results.push(
        ...this.findAllTextNodesWithPath(
          child,
          currentPath
        )
      );
    }
  }

  return results;
}

}