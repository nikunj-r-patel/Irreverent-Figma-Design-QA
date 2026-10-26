import { Page } from "@playwright/test";

import { PreviewTextElement } from "./PreviewTextElementReader";

import { PreviewSectionObserver } from "./PreviewSectionObserver";

import { SectionObservation } from "./SectionObservation";

interface PreviewDomSection {
  id: string;
  sectionName: string;
  anchorText: string;
  texts: string[];

  bounds: {
    pageX?: number;
    pageY: number;
    width?: number;
    height?: number;
  };
}

export class PreviewPageSectionObserver {
  static async observe(
    page: Page,
    previewElements: PreviewTextElement[],
  ): Promise<SectionObservation[]> {
    const domSections = await page.evaluate(() => {
      const normalize = (value: string | null): string =>
        (value ?? "")
          .replace(/\u00A0/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      const isVisible = (element: HTMLElement): boolean => {
        const style = getComputedStyle(element);

        const rect = element.getBoundingClientRect();

        const opacity = Number.parseFloat(style.opacity);

        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          (Number.isNaN(opacity) || opacity > 0) &&
          rect.width > 0 &&
          rect.height > 0
        );
      };

      const getTexts = (root: HTMLElement): string[] => {
        const candidates = Array.from(
          root.querySelectorAll<HTMLElement>(
            "h1,h2,h3,h4,h5,h6,p,a,button,label,span",
          ),
        )
          .filter((element) => isVisible(element))
          .map((element) => normalize(element.innerText))
          .filter(Boolean);

        return Array.from(new Set(candidates));
      };

      const getBounds = (element: HTMLElement) => {
        const rect = element.getBoundingClientRect();

        return {
          pageX: rect.x + window.scrollX,

          pageY: rect.y + window.scrollY,

          width: rect.width,

          height: rect.height,
        };
      };

      const observations: PreviewDomSection[] = [];

      const addObservation = (
        id: string,
        sectionName: string,
        element: HTMLElement,
        texts?: string[],
      ) => {
        const semanticTexts = texts ?? getTexts(element);

        const ownText = normalize(element.innerText);

        const resolvedTexts =
          semanticTexts.length > 0 ? semanticTexts : ownText ? [ownText] : [];

        observations.push({
          id,

          sectionName,

          anchorText: sectionName,

          texts: Array.from(
            new Set(
              resolvedTexts.map((text) => normalize(text)).filter(Boolean),
            ),
          ),

          bounds: getBounds(element),
        });
      };

      /*
       * NAVIGATION
       *
       * Figma treats the announcement
       * bar and main site navigation as
       * one logical Navigation region.
       */
      const announcement = document.querySelector<HTMLElement>(
        'section[role="complementary"]',
      );

      const siteHeader = document.querySelector<HTMLElement>("header");

      if (
        announcement &&
        siteHeader &&
        isVisible(announcement) &&
        isVisible(siteHeader)
      ) {
        const texts = Array.from(
          new Set([...getTexts(announcement), ...getTexts(siteHeader)]),
        );

        const announcementRect = announcement.getBoundingClientRect();

        const headerRect = siteHeader.getBoundingClientRect();

        observations.push({
          id: "preview:navigation",

          sectionName: "Navigation",

          anchorText: texts[0] ?? "Navigation",

          texts,

          bounds: {
            pageX: 0,

            pageY: announcementRect.y + window.scrollY,

            width: Math.max(announcementRect.width, headerRect.width),

            height: headerRect.bottom - announcementRect.top,
          },
        });
      }

      const mainSections = Array.from(
        document.querySelectorAll<HTMLElement>("main section"),
      ).filter((section) => isVisible(section));

      /*
       * DYNAMIC MAIN SECTIONS
       * Discover every visible section / shopify-section on the page
       */
      mainSections.forEach((section, index) => {
        const texts = getTexts(section);
        if (texts.length === 0) return;

        // Use the first substantial heading or prominent text as section name
        const heading = section.querySelector<HTMLElement>('h1, h2, h3, h4');
        const sectionName = heading && isVisible(heading) && normalize(heading.innerText)
          ? normalize(heading.innerText)
          : texts[0];

        const sectionId = section.id || section.getAttribute('data-section-id') || `preview:section:${index}`;
        addObservation(sectionId, sectionName, section, texts);
      });

      /*
       * FOOTER
       */
      const footer = document.querySelector<HTMLElement>("footer");

      if (footer && isVisible(footer)) {
        const footerTexts = getTexts(footer);
        const footerHeading = footer.querySelector<HTMLElement>('h1, h2, h3, h4');
        const footerName = footerHeading && isVisible(footerHeading) && normalize(footerHeading.innerText)
          ? normalize(footerHeading.innerText)
          : (footerTexts[0] ?? "Footer");
        addObservation("preview:footer", footerName, footer, footerTexts);
      }

      return observations;
    });

    const structuralSections: SectionObservation[] = domSections.map(
      (section) => ({
        id: section.id,

        source: "preview",

        sectionName: section.sectionName,

        anchorText: section.anchorText,

        texts: section.texts,

        bounds: section.bounds,
      }),
    );

    /*
     * Preserve the already validated
     * Shopify product-detail detector.
     *
     * This provides sections such as:
     *
     * Cookie Dough
     * Gift card
     */
    const productSections = PreviewSectionObserver.observe(previewElements);

    const merged = new Map<string, SectionObservation>();

    for (const section of [...structuralSections, ...productSections]) {
      merged.set(section.id, section);
    }

    return Array.from(merged.values()).sort(
      (a, b) => a.bounds.pageY - b.bounds.pageY,
    );
  }
}
