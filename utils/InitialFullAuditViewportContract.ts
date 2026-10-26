import {
    viewports,
  } from '../config/viewports';
  
  export interface InitialFullAuditViewportContractResult {
    expectedViewportNames:
      string[];
  
    expectedViewportCount:
      number;
  
    uniqueViewportCount:
      number;
  
    duplicateViewportNames:
      string[];
  
    figmaReferenceViewportNames:
      string[];
  
    valid:
      boolean;
  }
  
  export class InitialFullAuditViewportContract {
    static getExpectedViewportNames():
      string[] {
      return viewports.map(
        viewport =>
          viewport.name
      );
    }
  
    static analyze():
      InitialFullAuditViewportContractResult {
      const expectedViewportNames =
        this.getExpectedViewportNames();
  
      const viewportCounts =
        new Map<
          string,
          number
        >();
  
      for (
        const viewportName of
        expectedViewportNames
      ) {
        viewportCounts.set(
          viewportName,
          (
            viewportCounts.get(
              viewportName
            ) ??
            0
          ) +
          1
        );
      }
  
      const duplicateViewportNames =
        Array.from(
          viewportCounts.entries()
        )
          .filter(
            (
              [
                ,
                count,
              ]
            ) =>
              count >
              1
          )
          .map(
            (
              [
                viewportName,
              ]
            ) =>
              viewportName
          );
  
      const figmaReferenceViewportNames =
        viewports
          .filter(
            viewport =>
              viewport.figmaReference
          )
          .map(
            viewport =>
              viewport.name
          );
  
      const uniqueViewportCount =
        new Set(
          expectedViewportNames
        ).size;
  
      const valid =
        expectedViewportNames.length >
          0 &&
        duplicateViewportNames.length ===
          0 &&
        uniqueViewportCount ===
          expectedViewportNames.length;
  
      return {
        expectedViewportNames,
  
        expectedViewportCount:
          expectedViewportNames.length,
  
        uniqueViewportCount,
  
        duplicateViewportNames,
  
        figmaReferenceViewportNames,
  
        valid,
      };
    }
  }
  