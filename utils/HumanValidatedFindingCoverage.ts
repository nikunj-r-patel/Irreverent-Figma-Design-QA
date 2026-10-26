export interface GroupedElementFindingLike {
    id:
      string;
  
    type:
      string;
  
    section:
      string;
  
    elements?: Array<{
      elementName?:
        string;
  
      previewText?:
        string;
    }>;
  }
  
  export interface HumanFindingMatchRule {
    humanFindingId:
      string;
  
    types?:
      string[];
  
    sections?:
      string[];
  
    elementNames?:
      string[];
  
    idContainsAny?:
      string[];
  }
  
  export interface RawFindingClassification {
    rawFindingId:
      string;
  
    humanFindingIds:
      string[];
  }
  
  export interface HumanValidatedFindingCoverageResult {
    totalRawFindings:
      number;
  
    classifiedRawFindings:
      number;
  
    unclassifiedRawFindings:
      number;
  
    multiplyClassifiedRawFindings:
      number;
  
    classifications:
      RawFindingClassification[];
  
    unclassifiedFindingIds:
      string[];
  
    multiplyClassifiedFindingIds:
      string[];
  }
  
  function normalize(
    value:
      string,
  ): string {
    return value
      .trim()
      .toLowerCase();
  }
  
  function matchesAny(
    value:
      string,
    expected:
      string[] | undefined,
  ): boolean {
    if (
      !expected ||
      expected.length ===
        0
    ) {
      return true;
    }
  
    const normalizedValue =
      normalize(
        value,
      );
  
    return expected.some(
      candidate =>
        normalize(
          candidate,
        ) ===
        normalizedValue,
    );
  }
  
  function ruleMatches(
    finding:
      GroupedElementFindingLike,
    rule:
      HumanFindingMatchRule,
  ): boolean {
    if (
      !matchesAny(
        finding.type,
        rule.types,
      )
    ) {
      return false;
    }
  
    if (
      !matchesAny(
        finding.section,
        rule.sections,
      )
    ) {
      return false;
    }
  
    if (
      rule.elementNames &&
      rule.elementNames.length >
        0
    ) {
      const actualElementNames =
        (
          finding.elements ??
          []
        )
          .map(
            element =>
              element.elementName,
          )
          .filter(
            (
              elementName,
            ): elementName is string =>
              typeof elementName ===
              'string',
          )
          .map(
            elementName =>
              normalize(
                elementName,
              ),
          );
  
      const hasElementMatch =
        rule.elementNames.some(
          expectedElementName =>
            actualElementNames.includes(
              normalize(
                expectedElementName,
              ),
            ),
        );
  
      if (
        !hasElementMatch
      ) {
        return false;
      }
    }
  
    if (
      rule.idContainsAny &&
      rule.idContainsAny.length >
        0
    ) {
      const normalizedId =
        normalize(
          finding.id,
        );
  
      const hasIdMatch =
        rule.idContainsAny.some(
          fragment =>
            normalizedId.includes(
              normalize(
                fragment,
              ),
            ),
        );
  
      if (
        !hasIdMatch
      ) {
        return false;
      }
    }
  
    return true;
  }
  
  export class HumanValidatedFindingCoverage {
    static analyze(
      rawFindings:
        GroupedElementFindingLike[],
      rules:
        HumanFindingMatchRule[],
      validHumanFindingIds:
        string[],
    ): HumanValidatedFindingCoverageResult {
      const validIds =
        new Set(
          validHumanFindingIds,
        );
  
      for (
        const rule of
        rules
      ) {
        if (
          !validIds.has(
            rule.humanFindingId,
          )
        ) {
          throw new Error(
            `Unknown human finding ID in coverage rule: ${rule.humanFindingId}`,
          );
        }
      }
  
      const classifications:
        RawFindingClassification[] =
          rawFindings.map(
            finding => {
              const humanFindingIds =
                rules
                  .filter(
                    rule =>
                      ruleMatches(
                        finding,
                        rule,
                      ),
                  )
                  .map(
                    rule =>
                      rule.humanFindingId,
                  );
  
              return {
                rawFindingId:
                  finding.id,
  
                humanFindingIds:
                  Array.from(
                    new Set(
                      humanFindingIds,
                    ),
                  ),
              };
            },
          );
  
      const unclassified =
        classifications.filter(
          classification =>
            classification
              .humanFindingIds
              .length ===
            0,
        );
  
      const multiplyClassified =
        classifications.filter(
          classification =>
            classification
              .humanFindingIds
              .length >
            1,
        );
  
      return {
        totalRawFindings:
          classifications.length,
  
        classifiedRawFindings:
          classifications.length -
          unclassified.length,
  
        unclassifiedRawFindings:
          unclassified.length,
  
        multiplyClassifiedRawFindings:
          multiplyClassified.length,
  
        classifications,
  
        unclassifiedFindingIds:
          unclassified.map(
            classification =>
              classification.rawFindingId,
          ),
  
        multiplyClassifiedFindingIds:
          multiplyClassified.map(
            classification =>
              classification.rawFindingId,
          ),
      };
    }
  }
  