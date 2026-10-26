import { MatchableTextElement } from "./TextElementMatcher";

import { SectionObservation } from "./SectionObservation";

export class FigmaPageSectionObserver {
  private static isTechnicalFrame(value: string | undefined): boolean {
    if (!value) {
      return false;
    }

    return /^Frame(?: \d+)?$/i.test(value);
  }

  private static resolveRootPath(path: string[]): string[] | null {
    if (path.length < 2) {
      return null;
    }

    /*
     * If the design root has immediate named top-level sections (e.g. HERO, REVIEWS, FOOTER),
     * treat path.slice(0, 2) as the logical section root.
     */
    if (path[0] !== "Homepage") {
      return path.slice(0, 2);
    }

    /*
     * Navigation, Header and Footer are
     * meaningful top-level page regions.
     */
    if (
      path[1] === "Navigation" ||
      path[1] === "Header" ||
      path[1] === "Footer"
    ) {
      return path.slice(0, 2);
    }

    if (path[1] !== "Section" || path.length < 3) {
      return null;
    }

    const sectionType = path[2];

    /*
     * Content contains multiple independent
     * content blocks, so use its child frame
     * as the logical section root.
     */
    if (sectionType === "Content") {
      if (path.length >= 4 && this.isTechnicalFrame(path[3])) {
        return path.slice(0, 4);
      }

      return null;
    }

    /*
     * Location cards should remain
     * independent sections.
     */
    if (sectionType === "Card") {
      if (path.length >= 4 && this.isTechnicalFrame(path[3])) {
        return path.slice(0, 4);
      }

      return path.slice(0, 3);
    }

    /*
     * Category Cards contains three
     * independent cards.
     */
    if (sectionType === "Category Cards") {
      if (path.length >= 4 && this.isTechnicalFrame(path[3])) {
        return path.slice(0, 4);
      }

      return path.slice(0, 3);
    }

    /*
     * Product Card (Large) represents
     * one logical product-list section.
     */
    if (sectionType === "Product Card (Large)") {
      return path.slice(0, 3);
    }

    /*
     * Normal Section > Frame XXX
     * blocks are independent visual
     * content sections.
     */
    if (this.isTechnicalFrame(sectionType)) {
      return path.slice(0, 3);
    }

    /*
     * Other direct text-only structures
     * are still covered by the raw
     * element audit. Do not manufacture
     * section boundaries for them yet.
     */
    return null;
  }

  static observe(elements: MatchableTextElement[]): SectionObservation[] {
    const groups = new Map<
      string,
      {
        rootPath: string[];
        elements: MatchableTextElement[];
      }
    >();

    for (const element of elements) {
      const path = element.figmaPath;

      if (!path) {
        continue;
      }

      const rootPath = this.resolveRootPath(path);

      if (!rootPath) {
        continue;
      }

      const key = rootPath.join(" > ");

      const existing = groups.get(key) ?? {
        rootPath,
        elements: [],
      };

      existing.elements.push(element);

      groups.set(key, existing);
    }

    const observations: SectionObservation[] = [];

    for (const [sectionKey, group] of groups) {
      const uniqueTexts = Array.from(
        new Set(group.elements.map((element) => element.text).filter(Boolean)),
      );

      /*
       * A section-level finding should
       * represent a content block rather
       * than a single isolated text node.
       *
       * Single elements remain protected
       * by the raw element audit.
       */
      if (uniqueTexts.length < 2) {
        continue;
      }

      const anchor = [...group.elements].sort((a, b) => {
        const aFontSize = a.styles.fontSize ?? 0;

        const bFontSize = b.styles.fontSize ?? 0;

        if (bFontSize !== aFontSize) {
          return bFontSize - aFontSize;
        }

        return (
          (a.styles.pageY ?? Number.MAX_SAFE_INTEGER) -
          (b.styles.pageY ?? Number.MAX_SAFE_INTEGER)
        );
      })[0];

      if (!anchor) {
        continue;
      }

      const pageXs = group.elements
        .map((element) => element.styles.pageX)
        .filter((value): value is number => typeof value === "number");

      const pageYs = group.elements
        .map((element) => element.styles.pageY)
        .filter((value): value is number => typeof value === "number");

      observations.push({
        id: `figma:${sectionKey}`,

        source: "figma",

        sectionName: anchor.text,

        anchorText: anchor.text,

        texts: uniqueTexts,

        bounds: {
          pageX: pageXs.length > 0 ? Math.min(...pageXs) : undefined,

          pageY:
            anchor.styles.pageY ??
            (pageYs.length > 0 ? Math.min(...pageYs) : 0),

          width: anchor.styles.width,

          height: anchor.styles.height,
        },

        rootPath: group.rootPath,

        memberPaths: group.elements
          .map((element) => element.figmaPath)
          .filter((path): path is string[] => Boolean(path)),

        figmaPath: anchor.figmaPath,
      });
    }
    /*
     * Some Figma Content elements live in
     * separate technical frames even though
     * they clearly belong to the preceding
     * logical content section.
     *
     * Examples:
     *
     * Baked Goods
     *   -> description
     *   -> View all
     *
     * Scroggin Gift Voucher
     *   -> gift-card description
     *
     * About Scroggin
     *   -> supporting description
     *
     * Scroggin Brown T-shirt
     *   -> product description
     *
     * Attach those fragments to the nearest
     * preceding Content section instead of
     * manufacturing separate sections.
     */
    const representedPaths = new Set(
      observations.flatMap((section) =>
        (section.memberPaths ?? []).map((path) => path.join(" > ")),
      ),
    );

    const supportingContentElements = elements.filter((element) => {
      const path = element.figmaPath;

      if (!path || path.length < 4) {
        return false;
      }

      if (
        path[0] !== "Homepage" ||
        path[1] !== "Section" ||
        path[2] !== "Content"
      ) {
        return false;
      }

      return !representedPaths.has(path.join(" > "));
    });

    for (const element of supportingContentElements) {
      const pageY = element.styles.pageY;

      if (typeof pageY !== "number") {
        continue;
      }

      const candidates = observations
        .filter(
          (section) =>
            section.rootPath?.[0] === "Homepage" &&
            section.rootPath?.[1] === "Section" &&
            section.rootPath?.[2] === "Content" &&
            section.bounds.pageY <= pageY &&
            pageY - section.bounds.pageY <= 900,
        )
        .sort((a, b) => pageY - a.bounds.pageY - (pageY - b.bounds.pageY));

      const nearest = candidates[0];

      if (!nearest) {
        continue;
      }

      if (!nearest.texts.includes(element.text)) {
        nearest.texts.push(element.text);
      }

      if (element.figmaPath) {
        nearest.memberPaths ??= [];

        const pathKey = element.figmaPath.join(" > ");

        const alreadyIncluded = nearest.memberPaths.some(
          (path) => path.join(" > ") === pathKey,
        );

        if (!alreadyIncluded) {
          nearest.memberPaths.push(element.figmaPath);
        }
      }
    }
    /*
     * Detect the repeated horizontal
     * marquee/ticker block.
     *
     * These Figma elements are separate
     * text nodes but visually represent
     * one logical section.
     */
    const marqueeTexts = new Set([
      "Stay for a while...",
      "Gather the people",
      "Feast on the freshest",
    ]);

    const marqueeElements = elements.filter(
      (element) =>
        marqueeTexts.has(element.text) &&
        element.figmaPath?.[0] === "Homepage" &&
        element.figmaPath?.[1] === "Section" &&
        typeof element.styles.pageY === "number",
    );

    if (marqueeElements.length >= 2) {
      const pageYs = marqueeElements.map(
        (element) => element.styles.pageY as number,
      );

      const minY = Math.min(...pageYs);

      const maxY = Math.max(...pageYs);

      /*
       * Only group them when they occupy
       * the same visual row.
       */
      if (maxY - minY <= 2) {
        const ordered = [...marqueeElements].sort(
          (a, b) => (a.styles.pageX ?? 0) - (b.styles.pageX ?? 0),
        );

        const anchor = ordered[0];

        const uniqueTexts = Array.from(
          new Set(ordered.map((element) => element.text)),
        );

        observations.push({
          id: "figma:Homepage > Section > Marquee",

          source: "figma",

          sectionName: "Repeated text marquee",

          anchorText: anchor.text,

          texts: uniqueTexts,

          bounds: {
            pageX: anchor.styles.pageX,

            pageY: minY,

            width: anchor.styles.width,

            height: anchor.styles.height,
          },

          /*
           * This is a logical QA root rather
           * than a literal Figma hierarchy
           * path. Exact members are preserved
           * below in memberPaths.
           */
          rootPath: ["Homepage", "Section", "Marquee"],

          memberPaths: ordered
            .map((element) => element.figmaPath)
            .filter((path): path is string[] => Boolean(path)),

          figmaPath: anchor.figmaPath,
        });
      }
    }
    return observations.sort((a, b) => a.bounds.pageY - b.bounds.pageY);
  }
}
