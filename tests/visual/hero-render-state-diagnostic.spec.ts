import { test, expect } from "@playwright/test";

import { env } from "../../config/env";

test.describe("Hero Render State Diagnostic", () => {
  test("should inspect Hero media state and preview tooling", async ({
    page,
  }) => {
    test.setTimeout(120000);

    await page.setViewportSize({
      width: 1728,
      height: 1080,
    });

    const response = await page.goto(env.previewUrl, {
      waitUntil: "domcontentloaded",

      timeout: 60000,
    });

    expect(response).not.toBeNull();

    const inspect = async (label: string) => {
      const result = await page.evaluate((currentLabel) => {
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
            rect.height > 0 &&
            rect.bottom > 0 &&
            rect.top < window.innerHeight
          );
        };

        const mainSections = Array.from(
          document.querySelectorAll<HTMLElement>("main section"),
        );

        const hero =
          mainSections.find((section) =>
            normalize(section.innerText).includes("Cafe and Bakery in Wanaka"),
          ) ?? null;

        const heroImages = hero
          ? Array.from(hero.querySelectorAll<HTMLImageElement>("img")).map(
              (image, index) => {
                const rect = image.getBoundingClientRect();

                const style = getComputedStyle(image);

                return {
                  index,

                  src: image.src,

                  currentSrc: image.currentSrc,

                  alt: image.alt,

                  visible: isVisible(image),

                  pageX: rect.x + window.scrollX,

                  pageY: rect.y + window.scrollY,

                  width: rect.width,

                  height: rect.height,

                  display: style.display,

                  visibility: style.visibility,

                  opacity: style.opacity,

                  objectFit: style.objectFit,

                  objectPosition: style.objectPosition,
                };
              },
            )
          : [];

        const iframes = Array.from(
          document.querySelectorAll<HTMLIFrameElement>("iframe"),
        ).map((iframe) => {
          const rect = iframe.getBoundingClientRect();

          return {
            id: iframe.id,

            className: iframe.className,

            title: iframe.title,

            src: iframe.src,

            pageX: rect.x + window.scrollX,

            pageY: rect.y + window.scrollY,

            width: rect.width,

            height: rect.height,

            visible: isVisible(iframe),
          };
        });

        const previewLikeElements = Array.from(
          document.body.querySelectorAll<HTMLElement>("*"),
        )
          .filter((element) => {
            const id = (element.getAttribute("id") ?? "").toLowerCase();

            const className = (
              element.getAttribute("class") ?? ""
            ).toLowerCase();

            const text = normalize(element.innerText).toLowerCase();

            return (
              id.includes("preview") ||
              className.includes("preview") ||
              text === "hide bar" ||
              text === "exit preview" ||
              text === "copy link"
            );
          })
          .slice(0, 30)
          .map((element) => {
            const rect = element.getBoundingClientRect();

            const style = getComputedStyle(element);

            return {
              tag: element.tagName.toLowerCase(),

              id: element.getAttribute("id") ?? "",

              className: element.getAttribute("class") ?? "",

              text: normalize(element.innerText).slice(0, 120),

              position: style.position,

              zIndex: style.zIndex,

              pageX: rect.x + window.scrollX,

              pageY: rect.y + window.scrollY,

              width: rect.width,

              height: rect.height,

              visible: isVisible(element),
            };
          });

        return {
          label: currentLabel,

          scrollY: window.scrollY,

          heroFound: Boolean(hero),

          heroBounds: hero
            ? (() => {
                const rect = hero.getBoundingClientRect();

                return {
                  pageX: rect.x + window.scrollX,

                  pageY: rect.y + window.scrollY,

                  width: rect.width,

                  height: rect.height,
                };
              })()
            : null,

          heroImages,

          iframes,

          previewLikeElements,
        };
      }, label);

      console.log(`\nHERO STATE — ${label}`);

      console.log(JSON.stringify(result, null, 2));
    };

    /*
     * Inspect shortly after initial load.
     */
    await page.waitForTimeout(500);

    await inspect("INITIAL_500MS");

    /*
     * Inspect again after enough time
     * for a typical Hero carousel to
     * advance automatically.
     */
    await page.waitForTimeout(6000);

    await inspect("AFTER_6500MS");
  });
});
