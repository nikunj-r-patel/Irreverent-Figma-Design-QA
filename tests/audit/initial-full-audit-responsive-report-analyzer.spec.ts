import {
    test,
    expect,
  } from '@playwright/test';
  
  import {
    InitialFullAuditResponsiveReportAnalyzer,
  } from '../../utils/InitialFullAuditResponsiveReportAnalyzer';
  
  test.describe(
    'Initial Full Audit Responsive Report Analyzer',
    () => {
      const expectedViewports = [
        'xl-1728',
        'desktop-1440',
        'laptop-1366',
        'mobile-390',
      ];
  
      test(
        'should accept a complete and internally consistent responsive layout report',
        async () => {
          const result =
            InitialFullAuditResponsiveReportAnalyzer
              .analyzeLayout(
                expectedViewports,
                {
                  viewportCount:
                    4,
  
                  blockingViewportCount:
                    0,
  
                  results: [
                    {
                      viewport:
                        'xl-1728',
  
                      horizontalOverflow:
                        0,
                    },
  
                    {
                      viewport:
                        'desktop-1440',
  
                      horizontalOverflow:
                        1,
                    },
  
                    {
                      viewport:
                        'laptop-1366',
  
                      horizontalOverflow:
                        2,
                    },
  
                    {
                      viewport:
                        'mobile-390',
  
                      horizontalOverflow:
                        0,
                    },
                  ],
                }
              );
  
          expect(
            result.coverage.complete
          ).toBe(
            true
          );
  
          expect(
            result.summaryConsistent
          ).toBe(
            true
          );
  
          expect(
            result.calculatedBlockingViewportCount
          ).toBe(
            0
          );
  
          expect(
            result.complete
          ).toBe(
            true
          );
  
          expect(
            result.blockingPassed
          ).toBe(
            true
          );
        }
      );
  
      test(
        'should reject a layout report whose blocking summary does not match its actual results',
        async () => {
          const result =
            InitialFullAuditResponsiveReportAnalyzer
              .analyzeLayout(
                expectedViewports,
                {
                  viewportCount:
                    4,
  
                  /*
                   * Deliberately incorrect.
                   *
                   * One viewport below has
                   * more than 2px overflow.
                   */
                  blockingViewportCount:
                    0,
  
                  results: [
                    {
                      viewport:
                        'xl-1728',
  
                      horizontalOverflow:
                        0,
                    },
  
                    {
                      viewport:
                        'desktop-1440',
  
                      horizontalOverflow:
                        6,
                    },
  
                    {
                      viewport:
                        'laptop-1366',
  
                      horizontalOverflow:
                        0,
                    },
  
                    {
                      viewport:
                        'mobile-390',
  
                      horizontalOverflow:
                        0,
                    },
                  ],
                }
              );
  
          expect(
            result.coverage.complete
          ).toBe(
            true
          );
  
          expect(
            result.reportedBlockingViewportCount
          ).toBe(
            0
          );
  
          expect(
            result.calculatedBlockingViewportCount
          ).toBe(
            1
          );
  
          expect(
            result.summaryConsistent
          ).toBe(
            false
          );
  
          expect(
            result.complete
          ).toBe(
            false
          );
  
          expect(
            result.blockingPassed
          ).toBe(
            false
          );
        }
      );
  
      test(
        'should accept a complete and internally consistent diagnostic report',
        async () => {
          const result =
            InitialFullAuditResponsiveReportAnalyzer
              .analyzeDiagnostic(
                expectedViewports,
                {
                  viewportCount:
                    4,
  
                  viewportWithCandidateCount:
                    2,
  
                  totalCandidateCount:
                    3,
  
                  results: [
                    {
                      viewport:
                        'xl-1728',
  
                      issues: [
                        {
                          id:
                            'candidate-1',
                        },
  
                        {
                          id:
                            'candidate-2',
                        },
                      ],
                    },
  
                    {
                      viewport:
                        'desktop-1440',
  
                      issues:
                        [],
                    },
  
                    {
                      viewport:
                        'laptop-1366',
  
                      issues: [
                        {
                          id:
                            'candidate-3',
                        },
                      ],
                    },
  
                    {
                      viewport:
                        'mobile-390',
  
                      issues:
                        [],
                    },
                  ],
                }
              );
  
          expect(
            result.coverage.complete
          ).toBe(
            true
          );
  
          expect(
            result.calculatedViewportWithCandidateCount
          ).toBe(
            2
          );
  
          expect(
            result.calculatedTotalCandidateCount
          ).toBe(
            3
          );
  
          expect(
            result.candidateCount
          ).toBe(
            3
          );
  
          expect(
            result.summaryConsistent
          ).toBe(
            true
          );
  
          expect(
            result.complete
          ).toBe(
            true
          );
        }
      );
  
      test(
        'should reject a diagnostic report whose candidate summary does not match its actual issues',
        async () => {
          const result =
            InitialFullAuditResponsiveReportAnalyzer
              .analyzeDiagnostic(
                expectedViewports,
                {
                  viewportCount:
                    4,
  
                  /*
                   * Deliberately incorrect.
                   *
                   * Actual result entries
                   * contain candidates in
                   * two viewports.
                   */
                  viewportWithCandidateCount:
                    1,
  
                  /*
                   * Deliberately incorrect.
                   *
                   * Actual total is three.
                   */
                  totalCandidateCount:
                    2,
  
                  results: [
                    {
                      viewport:
                        'xl-1728',
  
                      issues: [
                        {
                          id:
                            'candidate-1',
                        },
  
                        {
                          id:
                            'candidate-2',
                        },
                      ],
                    },
  
                    {
                      viewport:
                        'desktop-1440',
  
                      issues:
                        [],
                    },
  
                    {
                      viewport:
                        'laptop-1366',
  
                      issues: [
                        {
                          id:
                            'candidate-3',
                        },
                      ],
                    },
  
                    {
                      viewport:
                        'mobile-390',
  
                      issues:
                        [],
                    },
                  ],
                }
              );
  
          expect(
            result.coverage.complete
          ).toBe(
            true
          );
  
          expect(
            result.reportedViewportWithCandidateCount
          ).toBe(
            1
          );
  
          expect(
            result.calculatedViewportWithCandidateCount
          ).toBe(
            2
          );
  
          expect(
            result.reportedTotalCandidateCount
          ).toBe(
            2
          );
  
          expect(
            result.calculatedTotalCandidateCount
          ).toBe(
            3
          );
  
          expect(
            result.summaryConsistent
          ).toBe(
            false
          );
  
          expect(
            result.complete
          ).toBe(
            false
          );
        }
      );
  
      test(
        'should reject a report with duplicate and missing viewport identities even when counts appear correct',
        async () => {
          const result =
            InitialFullAuditResponsiveReportAnalyzer
              .analyzeDiagnostic(
                expectedViewports,
                {
                  viewportCount:
                    4,
  
                  viewportWithCandidateCount:
                    0,
  
                  totalCandidateCount:
                    0,
  
                  results: [
                    {
                      viewport:
                        'xl-1728',
  
                      issues:
                        [],
                    },
  
                    {
                      viewport:
                        'desktop-1440',
  
                      issues:
                        [],
                    },
  
                    {
                      viewport:
                        'laptop-1366',
  
                      issues:
                        [],
                    },
  
                    /*
                     * Duplicate xl-1728
                     * replaces mobile-390.
                     *
                     * Result count remains
                     * four, so a count-only
                     * check would miss this.
                     */
                    {
                      viewport:
                        'xl-1728',
  
                      issues:
                        [],
                    },
                  ],
                }
              );
  
          expect(
            result.reportedViewportCount
          ).toBe(
            4
          );
  
          expect(
            result.actualResultCount
          ).toBe(
            4
          );
  
          expect(
            result.summaryConsistent
          ).toBe(
            true
          );
  
          expect(
            result.coverage.missingViewportNames
          ).toEqual(
            [
              'mobile-390',
            ]
          );
  
          expect(
            result.coverage.duplicateViewportNames
          ).toEqual(
            [
              'xl-1728',
            ]
          );
  
          expect(
            result.coverage.complete
          ).toBe(
            false
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