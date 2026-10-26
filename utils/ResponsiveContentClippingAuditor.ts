import { Page } from "@playwright/test";

import {
  ResponsiveContentClippingAuditResult,
  ResponsiveContentClippingIssue,
} from "./ResponsiveContentClippingAudit";

export class ResponsiveContentClippingAuditor {
  static async audit(
    page: Page,
    viewportName: string,
  ): Promise<ResponsiveContentClippingAuditResult> {
    return await page.evaluate((viewport) => {
      const tolerance = 2;

      const viewportWidth = document.documentElement.clientWidth;

      const viewportHeight = window.innerHeight;

      const issues: ResponsiveContentClippingIssue[] = [];

      const normalizeText = (value: string | null): string => {
        return (value ?? "")
          .replace(/\u00A0/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 160);
      };

      const isVisible = (element: HTMLElement): boolean => {
        const style = getComputedStyle(element);

        const rect = element.getBoundingClientRect();

        const opacity = Number.parseFloat(style.opacity);

        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          (Number.isNaN(opacity) || opacity > 0) &&
          rect.width > 1 &&
          rect.height > 1
        );
      };

      const hasIntentionalOverflowIdentity = (
        element: HTMLElement,
      ): boolean => {
        const className = (element.getAttribute("class") ?? "").toLowerCase();

        const id = (element.getAttribute("id") ?? "").toLowerCase();

        const tagName = (element.localName ?? "").toLowerCase();

        const identity = [className, id, tagName].join(" ");

        return (
          identity.includes("carousel") ||
          identity.includes("slider") ||
          identity.includes("swiper") ||
          identity.includes("splide") ||
          identity.includes("marquee") ||
          identity.includes("scrolling-items") ||
          identity.includes("scrolling-text") ||
          identity.includes("flip-text")
        );
      };

      const isInsideIntentionalScrollableOrAnimatedRegion = (
        element: HTMLElement,
      ): boolean => {
        let current: HTMLElement | null = element;

        while (current && current !== document.body) {
          const className = (current.getAttribute("class") ?? "").toLowerCase();

          /*
           * Accessibility-only text is
           * intentionally visually clipped.
           *
           * It must never become a visual
           * responsive clipping finding.
           */
          const isAccessibilityOnly = className
            .split(/\s+/)
            .some((name) => name === "sr-only" || name === "visually-hidden");

          if (isAccessibilityOnly) {
            return true;
          }

          /*
           * Once content belongs to a known
           * carousel / slider / marquee /
           * scrolling animation component,
           * clipping by that component is
           * intentional.
           *
           * The actual overflow property may
           * live on a wrapper above or below
           * the semantic scrolling element,
           * so do not require both conditions
           * on the same DOM node.
           */
          if (hasIntentionalOverflowIdentity(current)) {
            return true;
          }

          current = current.parentElement;
        }

        return false;
      };

      const hasIntentionalLineClamp = (style: CSSStyleDeclaration): boolean => {
        const webkitLineClamp = style.getPropertyValue("-webkit-line-clamp");

        return (
          webkitLineClamp !== "" &&
          webkitLineClamp !== "none" &&
          Number.parseInt(webkitLineClamp, 10) > 0
        );
      };

      const buildSelector = (element: HTMLElement): string => {
        if (element.id) {
          return `#${element.id}`;
        }

        const parts: string[] = [];

        let current: HTMLElement | null = element;

        while (current && current !== document.body && parts.length < 4) {
          let part = current.tagName.toLowerCase();

          const classes = Array.from(current.classList)
            .filter((className) => className.length > 0)
            .slice(0, 2);

          if (classes.length > 0) {
            part += `.${classes.join(".")}`;
          }

          parts.unshift(part);

          current = current.parentElement;
        }

        return parts.join(" > ");
      };

      const findClippingAncestor = (
        element: HTMLElement,
      ): {
        element: HTMLElement;

        axis: "X" | "Y" | "BOTH";
      } | null => {
        const elementRect = element.getBoundingClientRect();

        let current: HTMLElement | null = element.parentElement;

        while (
          current &&
          current !== document.body &&
          current !== document.documentElement
        ) {
          const style = getComputedStyle(current);

          /*
           * Ignore known intentional
           * carousel / slider / marquee
           * clipping containers.
           */
          if (hasIntentionalOverflowIdentity(current)) {
            current = current.parentElement;

            continue;
          }

          const clipsX =
            style.overflowX === "hidden" || style.overflowX === "clip";

          const clipsY =
            style.overflowY === "hidden" || style.overflowY === "clip";

          if (!clipsX && !clipsY) {
            current = current.parentElement;

            continue;
          }

          const ancestorRect = current.getBoundingClientRect();

          const outsideX =
            clipsX &&
            (elementRect.left < ancestorRect.left - tolerance ||
              elementRect.right > ancestorRect.right + tolerance);

          const outsideY =
            clipsY &&
            (elementRect.top < ancestorRect.top - tolerance ||
              elementRect.bottom > ancestorRect.bottom + tolerance);

          if (outsideX || outsideY) {
            return {
              element: current,

              axis: outsideX && outsideY ? "BOTH" : outsideX ? "X" : "Y",
            };
          }

          current = current.parentElement;
        }

        return null;
      };

      const candidates = Array.from(
        document.body.querySelectorAll<HTMLElement>(
          [
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "p",
            "a",
            "button",
            "label",
            "span",
            "li",
          ].join(","),
        ),
      );

      const seen = new Set<string>();

      for (const element of candidates) {
        if (!isVisible(element)) {
          continue;
        }

        const text = normalizeText(element.innerText);

        if (!text) {
          continue;
        }

        const style = getComputedStyle(element);

        if (hasIntentionalLineClamp(style)) {
          continue;
        }

        if (isInsideIntentionalScrollableOrAnimatedRegion(element)) {
          continue;
        }

        const horizontalClipping =
          element.scrollWidth > element.clientWidth + tolerance;

        const verticalClipping =
          element.scrollHeight > element.clientHeight + tolerance;

        const clipsHorizontally =
          horizontalClipping &&
          (style.overflowX === "hidden" || style.overflowX === "clip");

        const clipsVertically =
          verticalClipping &&
          (style.overflowY === "hidden" || style.overflowY === "clip");

        const clippingAncestor = findClippingAncestor(element);

        if (!clipsHorizontally && !clipsVertically && !clippingAncestor) {
          continue;
        }

        const selector = buildSelector(element);

        const clippingAncestorSelector = clippingAncestor
          ? buildSelector(clippingAncestor.element)
          : undefined;

        const clippingAxis: "X" | "Y" | "BOTH" | undefined = clippingAncestor
          ? clippingAncestor.axis
          : clipsHorizontally && clipsVertically
            ? "BOTH"
            : clipsHorizontally
              ? "X"
              : clipsVertically
                ? "Y"
                : undefined;

        const key = [
          selector,
          text,
          clippingAncestorSelector ?? "",
          clippingAxis ?? "",
        ].join("|");

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);

        issues.push({
          type: clippingAncestor ? "CONTENT_CLIPPED" : "TEXT_CLIPPED",

          selector,

          text,

          clientWidth: element.clientWidth,

          scrollWidth: element.scrollWidth,

          clientHeight: element.clientHeight,

          scrollHeight: element.scrollHeight,

          overflowX: style.overflowX,

          overflowY: style.overflowY,

          clippingAncestorSelector,

          clippingAxis,
        });

        if (issues.length >= 20) {
          break;
        }
      }

      return {
        viewport,

        width: viewportWidth,

        height: viewportHeight,

        issues,
      };
    }, viewportName);
  }
}
