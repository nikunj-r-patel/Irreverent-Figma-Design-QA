import {
  ElementAuditResult,
} from './ElementAudit';

import {
  ElementDifference,
} from './ElementComparison';

import {
  GroupedAuditIssue,
  GroupedAuditReport,
} from './GroupedAuditIssue';

export class AuditIssueGrouper {
 private static getSectionName(
  figmaPath?: string[]
): string {
  if (!figmaPath || figmaPath.length < 2) {
    return 'Unknown Section';
  }

  const topLevelSection =
    figmaPath[1];

  if (topLevelSection !== 'Section') {
    return topLevelSection;
  }

  /*
 * When a text node sits directly inside a
 * technical Figma frame, use the frame as
 * the section key instead of the text itself.
 *
 * Example:
 * Homepage > Section > Frame 15 > Gather
 * Homepage > Section > Frame 15 > Feast
 *
 * Both should belong to:
 * Section > Frame 15
 */
if (
  figmaPath.length === 4 &&
  /^Frame(?: \d+)?$/i.test(
    figmaPath[2]
  )
) {
  return [
    figmaPath[1],
    figmaPath[2],
  ].join(' > ');
}

const sectionPath =
  figmaPath.slice(
    1,
    Math.min(4, figmaPath.length)
  );

return sectionPath.join(' > ');
}


private static isTechnicalFigmaName(
  value: string
): boolean {
  const normalized =
    value.trim();

  return (
    normalized === 'Section' ||
    normalized === 'Content' ||
    normalized === 'Card' ||
    /^Frame(?: \d+)?$/i.test(
      normalized
    ) ||
    /^Group(?: \d+)?$/i.test(
      normalized
    )
  );
}
  private static isUsableSectionLabel(
  value: string
): boolean {
  const normalized =
    value.trim();

  if (
    normalized === '' ||
    this.isTechnicalFigmaName(
      normalized
    )
  ) {
    return false;
  }

  /*
   * Very long text is usually body copy,
   * not a section title.
   */
  if (normalized.length > 60) {
    return false;
  }

  const words =
    normalized
      .split(/\s+/)
      .filter(Boolean);

  if (words.length > 8) {
    return false;
  }

  /*
   * Generic actions should not become
   * section names.
   */
  const genericActions = [
    'view all',
    'learn more',
    'add to cart',
    'shop now',
    'read more',
  ];

  if (
    genericActions.includes(
      normalized.toLowerCase()
    )
  ) {
    return false;
  }

  return /[A-Za-z0-9]/.test(
    normalized
  );
}
private static buildSectionLabelMap(
  audit: ElementAuditResult
): Map<string, string> {
  const labels =
    new Map<string, string>();

  const sectionItems =
    new Map<
      string,
      typeof audit.items
    >();

  /*
   * First collect all audit items
   * belonging to each Figma section key.
   */
  for (const item of audit.items) {
    const sectionKey =
      this.getSectionName(
        item.figmaPath
      );

    const existing =
      sectionItems.get(
        sectionKey
      ) ?? [];

    existing.push(item);

    sectionItems.set(
      sectionKey,
      existing
    );
  }

  /*
   * First pass:
   * build the normal human-readable labels.
   */
  for (
    const [sectionKey, items]
    of sectionItems
  ) {
    const firstItem =
      items[0];

    if (
      !sectionKey.startsWith(
        'Section >'
      )
    ) {
      labels.set(
        sectionKey,
        sectionKey
      );

      continue;
    }

    const meaningfulPathName =
      sectionKey
        .split(' > ')
        .slice(1)
        .find(
          part =>
            this.isUsableSectionLabel(
              part
            )
        );

    const fallbackLabel =
      this.isUsableSectionLabel(
        firstItem.elementName
      )
        ? firstItem.elementName
        : 'Unnamed Section';

    labels.set(
      sectionKey,
      meaningfulPathName ??
        fallbackLabel
    );
  }

  /*
   * Second pass:
   * single Content frames are often
   * descriptions/actions belonging to the
   * previous main content block.
   *
   * Example:
   * Frame 140 = Scroggin Brown T-shirt
   * Frame 141 = product description
   */
  for (
    const [sectionKey, items]
    of sectionItems
  ) {
    if (
      !sectionKey.startsWith(
        'Section > Content >'
      ) ||
      items.length !== 1
    ) {
      continue;
    }

    const currentY =
      items[0].figma.pageY;

    if (
      typeof currentY !== 'number'
    ) {
      continue;
    }

    const candidates =
      Array.from(
        sectionItems.entries()
      )
        .filter(
          ([candidateKey, candidateItems]) =>
            candidateKey !== sectionKey &&
            candidateKey.startsWith(
              'Section > Content >'
            ) &&
            candidateItems.length > 1
        )
        .map(
          ([candidateKey, candidateItems]) => {
            const pageYs =
              candidateItems
                .map(
                  candidate =>
                    candidate.figma.pageY
                )
                .filter(
                  (
                    value
                  ): value is number =>
                    typeof value ===
                    'number'
                );

            const candidateY =
              pageYs.length > 0
                ? Math.min(...pageYs)
                : undefined;

            return {
              key: candidateKey,
              pageY: candidateY,
            };
          }
        )
        .filter(
          candidate =>
            typeof candidate.pageY ===
              'number' &&
            candidate.pageY <=
              currentY &&
            currentY -
              candidate.pageY <=
              900
        )
        .sort(
          (a, b) =>
            (b.pageY ?? 0) -
            (a.pageY ?? 0)
        );

    const nearest =
      candidates[0];

    if (!nearest) {
      continue;
    }

    const inheritedLabel =
      labels.get(
        nearest.key
      );

    if (
      inheritedLabel &&
      inheritedLabel !==
        'Unnamed Section'
    ) {
      labels.set(
        sectionKey,
        inheritedLabel
      );
    }
  }

  return labels;
}
private static getGroupingPath(
  figmaPath?: string[]
): string {
  if (
    !figmaPath ||
    figmaPath.length <= 1
  ) {
    return 'Unknown Path';
  }

  /*
   * Remove the final text-element name.
   *
   * Example:
   *
   * Homepage
   * > Navigation
   * > Frame 87
   * > Frame 1
   * > SHOP
   *
   * becomes:
   *
   * Homepage
   * > Navigation
   * > Frame 87
   * > Frame 1
   *
   * Sibling elements with the same
   * underlying issue can therefore be
   * grouped without merging unrelated
   * parts of the page.
   */
  return figmaPath
    .slice(
      0,
      -1
    )
    .join(' > ');
}
private static buildDifferenceSignature(
  differences: ElementDifference[]
): string {
  return differences
    .map(
      difference =>
        [
          difference.property,

          JSON.stringify(
            typeof difference.figmaValue ===
              'number'
              ? Number(
                  difference.figmaValue.toFixed(2)
                )
              : difference.figmaValue
          ),

          JSON.stringify(
            typeof difference.previewValue ===
              'number'
              ? Number(
                  difference.previewValue.toFixed(2)
                )
              : difference.previewValue
          ),
        ].join(':')
    )
    .sort()
    .join('||');
}

  private static addIssue(
  issueMap: Map<
    string,
    GroupedAuditIssue
  >,
  key: string,
  issue: GroupedAuditIssue
): void {
  const existing =
    issueMap.get(key);

  if (existing) {
    for (const element of issue.elements) {
      const alreadyExists =
        existing.elements.some(
          existingElement =>
            existingElement.figmaNodeId ===
            element.figmaNodeId
        );

      if (!alreadyExists) {
        existing.elements.push(
          element
        );
      }
    }

    if (issue.differences) {
      existing.differences ??= [];

      for (
        const difference
        of issue.differences
      ) {
        const normalizeDifferenceValue = (
  value: unknown
): unknown => {
  if (typeof value === 'number') {
    return Number(
      value.toFixed(2)
    );
  }

  return value;
};

const alreadyExists =
  existing.differences.some(
    existingDifference =>
      existingDifference.property ===
        difference.property &&
      JSON.stringify(
        normalizeDifferenceValue(
          existingDifference.figmaValue
        )
      ) ===
        JSON.stringify(
          normalizeDifferenceValue(
            difference.figmaValue
          )
        ) &&
      JSON.stringify(
        normalizeDifferenceValue(
          existingDifference.previewValue
        )
      ) ===
        JSON.stringify(
          normalizeDifferenceValue(
            difference.previewValue
          )
        )
  );

        if (!alreadyExists) {
          existing.differences.push(
            difference
          );
        }
      }
    }

    existing.affectedCount =
      existing.elements.length;

    return;
  }

  issue.affectedCount =
    issue.elements.length;

  issueMap.set(
    key,
    issue
  );
}

  static group(
    audit: ElementAuditResult
  ): GroupedAuditReport {
    const issueMap =
  new Map<
    string,
    GroupedAuditIssue
  >();

const sectionLabels =
  this.buildSectionLabelMap(
    audit
  );

for (const item of audit.items) {
      if (item.status === 'MATCH') {
        continue;
      }

      /*
       * MISSING ELEMENT
       */
      if (item.status === 'MISSING') {
        // Skip currency/price amounts (e.g. $199.00, $309.00, Rs. 2,900.00) since localized currency is not a bug
        const isPriceString = /^[\$€£¥₹\.]\s*\d+|^\d+[\.,]\d{2}$|^Rs\.?\s*\d+/i.test(item.elementName.trim());
        if (isPriceString) {
          continue;
        }

        const sectionName =
          this.getSectionName(
            item.figmaPath
          );

        const key =
          [
            'MISSING_ELEMENT',
            sectionName,
            item.elementName,
          ].join('|');

        this.addIssue(
          issueMap,
          key,
          {
            id: key,

            type:
              'MISSING_ELEMENT',

            section:
  sectionLabels.get(
    sectionName
  ) ?? sectionName,

            affectedCount: 1,

            elements: [
  {
    figmaNodeId:
      item.figmaNodeId,

    elementName:
      item.elementName,

    figmaPath:
      item.figmaPath,

    candidateText:
      item.candidateText,

    candidateScore:
      item.candidateScore,

    pageX:
      item.figma.pageX,

    pageY:
      item.figma.pageY,
  },
],
          }
        );

        continue;
      }

      /*
 * TEXT MISMATCH
 */
if (
  item.status ===
  'TEXT_MISMATCH'
) {
  const sectionName =
    this.getSectionName(
      item.figmaPath
    );

  const blockingDifferences =
    item.comparison?.differences.filter(
      difference =>
        difference.exceedsTolerance ===
        true
    ) ?? [];

  /*
   * Text + style mismatch on the
   * same visible element.
   */
  if (
    blockingDifferences.length > 0
  ) {
    const differenceSignature =
      this.buildDifferenceSignature(
        blockingDifferences
      );

    const key =
      [
        'ELEMENT_MISMATCH',
        sectionName,
        item.elementName,
        item.preview?.text ?? '',
        differenceSignature,
      ].join('|');

    const firstDifference =
      blockingDifferences[0];

    this.addIssue(
      issueMap,
      key,
      {
        id: key,

        type:
          'ELEMENT_MISMATCH',

        section:
          sectionLabels.get(
            sectionName
          ) ?? sectionName,

        property:
          firstDifference.property,

        figmaValue:
          firstDifference.figmaValue,

        previewValue:
          firstDifference.previewValue,

        tolerance:
          firstDifference.tolerance,

        differences:
          blockingDifferences,

        textDifference: {
          figmaText:
            item.elementName,

          previewText:
            item.preview?.text ?? '',
        },

        affectedCount: 1,

        elements: [
          {
            figmaNodeId:
              item.figmaNodeId,

            elementName:
              item.elementName,

            figmaPath:
              item.figmaPath,

            previewText:
              item.preview?.text,

            pageX:
              item.figma.pageX,

            pageY:
              item.figma.pageY,
          },
        ],
      }
    );

    continue;
  }

  /*
   * Text-only mismatch.
   * If the only difference is letter case (e.g. lowercase in raw text vs uppercase styling),
   * skip flagging it as a text mismatch bug.
   */
  const previewTextVal = item.preview?.text ?? '';
  if (
    item.elementName.trim().toLowerCase() ===
    previewTextVal.trim().toLowerCase()
  ) {
    continue;
  }

  const key =
    [
      'TEXT_MISMATCH',
      sectionName,
      item.elementName,
      previewTextVal,
    ].join('|');

  this.addIssue(
    issueMap,
    key,
    {
      id: key,

      type:
        'TEXT_MISMATCH',

      section:
        sectionLabels.get(
          sectionName
        ) ?? sectionName,

      textDifference: {
        figmaText:
          item.elementName,

        previewText:
          item.preview?.text ?? '',
      },

      affectedCount: 1,

      elements: [
        {
          figmaNodeId:
            item.figmaNodeId,

          elementName:
            item.elementName,

          figmaPath:
            item.figmaPath,

          previewText:
            item.preview?.text,

          pageX:
            item.figma.pageX,

          pageY:
            item.figma.pageY,
        },
      ],
    }
  );

  continue;
}

     /*
 * STYLE MISMATCHES
 */
if (!item.comparison) {
  continue;
}

const blockingDifferences =
  item.comparison.differences.filter(
    difference =>
      difference.exceedsTolerance ===
      true
  );

if (
  blockingDifferences.length === 0
) {
  continue;
}

const sectionName =
  this.getSectionName(
    item.figmaPath
  );

const differenceSignature =
  this.buildDifferenceSignature(
    blockingDifferences
  );

const groupingPath =
  this.getGroupingPath(
    item.figmaPath
  );

const isDirectGenericSectionChild =
  item.figmaPath?.length === 3 &&
  item.figmaPath[1] === 'Section';

const visualRowKey =
  isDirectGenericSectionChild &&
  typeof item.figma.pageY === 'number'
    ? `row-${Math.round(
        item.figma.pageY
      )}`
    : sectionName;

const key =
  isDirectGenericSectionChild
    ? [
        'STYLE_MISMATCH',
        groupingPath,
        visualRowKey,
        differenceSignature,
      ].join('|')
    : [
        'STYLE_MISMATCH',
        sectionName,
        groupingPath,
        differenceSignature,
      ].join('|');

    const displaySectionName =
  isDirectGenericSectionChild
    ? 'Section'
    : (
        sectionLabels.get(
          sectionName
        ) ?? sectionName
      );  

const firstDifference =
  blockingDifferences[0];

this.addIssue(
  issueMap,
  key,
  {
    id: key,

    type:
      'STYLE_MISMATCH',

    section:
  displaySectionName,
    property:
      firstDifference.property,

    figmaValue:
      firstDifference.figmaValue,

    previewValue:
      firstDifference.previewValue,

    tolerance:
      firstDifference.tolerance,

    differences:
      blockingDifferences,

    affectedCount: 1,

    elements: [
      {
        figmaNodeId:
          item.figmaNodeId,

        elementName:
          item.elementName,

        figmaPath:
          item.figmaPath,

        previewText:
          item.preview?.text,

        pageX:
          item.figma.pageX,

        pageY:
          item.figma.pageY,
      },
    ],
  }
);
      
    }

    const issues =
      Array.from(
        issueMap.values()
      ).sort(
        (a, b) =>
          b.affectedCount -
          a.affectedCount
      );

    const totalElementFindings =
      audit.items.filter(
        item =>
          item.status !== 'MATCH'
      ).length;

    return {
      viewport:
        audit.viewport,

      totalElementFindings,

      groupedIssueCount:
        issues.length,

      issues,
    };
  }
}