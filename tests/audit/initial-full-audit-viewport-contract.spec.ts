import {
    test,
    expect,
  } from '@playwright/test';
  
  import {
    InitialFullAuditViewportContract,
  } from '../../utils/InitialFullAuditViewportContract';
  
  test.describe(
    'Initial Full Audit Viewport Contract',
    () => {
      test(
        'should expose all configured viewport names in their current source order',
        async () => {
          const result =
            InitialFullAuditViewportContract.analyze();
  
          expect(
            result.expectedViewportNames
          ).toEqual([
            'xl-1728',
            'xl-1600',
            'xl-1920',
  
            'desktop-1440',
            'desktop-1200',
            'desktop-1280',
            'desktop-1366',
            'desktop-1536',
            'desktop-1599',
  
            'tablet-768',
            'tablet-834',
            'tablet-1024',
            'tablet-1199',
  
            'mobile-402',
            'mobile-390',
            'mobile-375',
            'mobile-320',
            'mobile-430',
          ]);
        }
      );
  
      test(
        'should require exactly 18 unique configured viewports',
        async () => {
          const result =
            InitialFullAuditViewportContract.analyze();
  
          expect(
            result.expectedViewportCount
          ).toBe(
            18
          );
  
          expect(
            result.uniqueViewportCount
          ).toBe(
            18
          );
  
          expect(
            result.duplicateViewportNames
          ).toEqual(
            []
          );
  
          expect(
            result.valid
          ).toBe(
            true
          );
        }
      );
  
      test(
        'should identify the configured Figma reference viewport',
        async () => {
          const result =
            InitialFullAuditViewportContract.analyze();
  
          expect(
            result.figmaReferenceViewportNames
          ).toEqual([
            'xl-1728',
          ]);
        }
      );
  
      test(
        'should expose the same viewport names through getExpectedViewportNames',
        async () => {
          const viewportNames =
            InitialFullAuditViewportContract
              .getExpectedViewportNames();
  
          expect(
            viewportNames
          ).toHaveLength(
            18
          );
  
          expect(
            viewportNames
          ).toContain(
            'xl-1728'
          );
  
          expect(
            viewportNames
          ).toContain(
            'desktop-1440'
          );
  
          expect(
            viewportNames
          ).toContain(
            'tablet-1024'
          );
  
          expect(
            viewportNames
          ).toContain(
            'mobile-320'
          );
  
          expect(
            viewportNames
          ).toContain(
            'mobile-430'
          );
        }
      );
    }
  );
  