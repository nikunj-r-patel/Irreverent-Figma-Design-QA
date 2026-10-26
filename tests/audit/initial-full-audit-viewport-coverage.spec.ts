import {
    test,
    expect,
  } from '@playwright/test';
  
  import {
    InitialFullAuditViewportCoverage,
  } from '../../utils/InitialFullAuditViewportCoverage';
  
  test.describe(
    'Initial Full Audit Viewport Coverage',
    () => {
      const expectedViewports = [
        'xl-1728',
        'desktop-1440',
        'laptop-1366',
        'mobile-390',
      ];
  
      test(
        'should report complete coverage when every expected viewport appears exactly once',
        async () => {
          const result =
            InitialFullAuditViewportCoverage.analyze(
              expectedViewports,
              [
                'xl-1728',
                'desktop-1440',
                'laptop-1366',
                'mobile-390',
              ]
            );
  
          expect(
            result.expectedViewportCount
          ).toBe(
            4
          );
  
          expect(
            result.reportedViewportCount
          ).toBe(
            4
          );
  
          expect(
            result.matchedViewportCount
          ).toBe(
            4
          );
  
          expect(
            result.missingViewportNames
          ).toEqual(
            []
          );
  
          expect(
            result.unexpectedViewportNames
          ).toEqual(
            []
          );
  
          expect(
            result.duplicateViewportNames
          ).toEqual(
            []
          );
  
          expect(
            result.complete
          ).toBe(
            true
          );
        }
      );
  
      test(
        'should report incomplete coverage when an expected viewport is missing',
        async () => {
          const result =
            InitialFullAuditViewportCoverage.analyze(
              expectedViewports,
              [
                'xl-1728',
                'desktop-1440',
                'laptop-1366',
              ]
            );
  
          expect(
            result.missingViewportNames
          ).toEqual(
            [
              'mobile-390',
            ]
          );
  
          expect(
            result.reportedViewportCount
          ).toBe(
            3
          );
  
          expect(
            result.complete
          ).toBe(
            false
          );
        }
      );
  
      test(
        'should report incomplete coverage when one viewport is duplicated and another is missing',
        async () => {
          const result =
            InitialFullAuditViewportCoverage.analyze(
              expectedViewports,
              [
                'xl-1728',
                'desktop-1440',
                'laptop-1366',
                'xl-1728',
              ]
            );
  
          /*
           * Count alone appears correct:
           *
           * expected = 4
           * reported = 4
           *
           * But identity coverage is not.
           */
          expect(
            result.expectedViewportCount
          ).toBe(
            4
          );
  
          expect(
            result.reportedViewportCount
          ).toBe(
            4
          );
  
          expect(
            result.missingViewportNames
          ).toEqual(
            [
              'mobile-390',
            ]
          );
  
          expect(
            result.duplicateViewportNames
          ).toEqual(
            [
              'xl-1728',
            ]
          );
  
          expect(
            result.complete
          ).toBe(
            false
          );
        }
      );
  
      test(
        'should report incomplete coverage when an unexpected viewport replaces an expected viewport',
        async () => {
          const result =
            InitialFullAuditViewportCoverage.analyze(
              expectedViewports,
              [
                'xl-1728',
                'desktop-1440',
                'laptop-1366',
                'obsolete-1280',
              ]
            );
  
          expect(
            result.missingViewportNames
          ).toEqual(
            [
              'mobile-390',
            ]
          );
  
          expect(
            result.unexpectedViewportNames
          ).toEqual(
            [
              'obsolete-1280',
            ]
          );
  
          expect(
            result.complete
          ).toBe(
            false
          );
        }
      );
    }
  );
  