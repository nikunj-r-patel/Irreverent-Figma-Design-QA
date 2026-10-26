import { Page } from "@playwright/test";

export interface PageRuntimeError {
  message: string;
}

export interface PageConsoleError {
  text: string;

  location?: {
    url?: string;
    lineNumber?: number;
    columnNumber?: number;
  };
}

export interface BrokenImage {
  src: string;

  alt: string;

  naturalWidth: number;

  naturalHeight: number;
}

export interface FontHealthResult {
  status: string;

  fontsReady: boolean;
}

export interface PageHealthResult {
  runtimeErrors: PageRuntimeError[];

  consoleErrors: PageConsoleError[];

  brokenImages: BrokenImage[];

  fontHealth: FontHealthResult;
}

export class PageHealthManager {
  static captureRuntimeErrors(page: Page): PageRuntimeError[] {
    const errors: PageRuntimeError[] = [];

    const seen = new Set<string>();

    page.on("pageerror", (error) => {
      const message = error.message ?? String(error);

      if (seen.has(message)) {
        return;
      }

      seen.add(message);

      errors.push({
        message,
      });
    });

    return errors;
  }

  static captureConsoleErrors(page: Page): PageConsoleError[] {
    const errors: PageConsoleError[] = [];

    const seen = new Set<string>();

    page.on("console", (message) => {
      if (message.type() !== "error") {
        return;
      }

      const text = message.text();

      const location = message.location();

      const key = [
        text,
        location.url,
        location.lineNumber,
        location.columnNumber,
      ].join("|");

      if (seen.has(key)) {
        return;
      }

      seen.add(key);

      errors.push({
        text,

        location: {
          url: location.url,

          lineNumber: location.lineNumber,

          columnNumber: location.columnNumber,
        },
      });
    });

    return errors;
  }

  static async inspectRenderedPage(page: Page): Promise<{
    brokenImages: BrokenImage[];

    fontHealth: FontHealthResult;
  }> {
    return page.evaluate(async () => {
      const visibleImages = Array.from(document.images).filter((image) => {
        const rect = image.getBoundingClientRect();

        const style = getComputedStyle(image);

        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      });

      const brokenImages = visibleImages
        .filter(
          (image) =>
            image.complete &&
            (image.naturalWidth === 0 || image.naturalHeight === 0),
        )
        .map((image) => ({
          src: image.currentSrc || image.src,

          alt: image.alt ?? "",

          naturalWidth: image.naturalWidth,

          naturalHeight: image.naturalHeight,
        }));

      let fontsReady = false;

      try {
        await document.fonts.ready;

        fontsReady = document.fonts.status === "loaded";    
      } catch {
        fontsReady = false;
      }

      return {
        brokenImages,

        fontHealth: {
          status: document.fonts.status,

          fontsReady,
        },
      };
    });
  }
}
