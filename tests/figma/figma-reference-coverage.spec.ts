import {
    test,
    expect,
  } from '@playwright/test';
  
  import fs from 'fs';
  import path from 'path';
  
  import {
    viewports,
  } from '../../config/viewports';
  
  import {
    OfflineFigmaTextReference,
  } from '../../utils/OfflineFigmaTextReference';
  
  test.describe(
    'Figma Reference Coverage',
    () => {
      test(
        'should validate all configured Figma reference viewports',
        async () => {
          const requiredViewports =
            viewports.filter(
              viewport =>
                viewport.figmaReference ===
                true
            );
  
          expect(
            requiredViewports.length,
            'At least one viewport must be configured as a Figma reference viewport.'
          ).toBeGreaterThan(
            0
          );
  
          const results =
            requiredViewports.map(
              viewport => {
                const textReferencePath =
                  path.join(
                    process.cwd(),
                    'figma',
                    'references',
                    'data',
                    `text-elements-${viewport.name}.json`
                  );
  
                const metadataPath =
                  path.join(
                    process.cwd(),
                    'figma',
                    'references',
                    'data',
                    `text-elements-${viewport.name}.meta.json`
                  );
  
                const imageReferencePath =
                  path.join(
                    process.cwd(),
                    'figma',
                    'references',
                    viewport.name,
                    'homepage.png'
                  );
  
                const textReferenceExists =
                  fs.existsSync(
                    textReferencePath
                  );
  
                const metadataExists =
                  fs.existsSync(
                    metadataPath
                  );
  
                const imageReferenceExists =
                  fs.existsSync(
                    imageReferencePath
                  );
  
                let textElementCount =
                  0;
  
                let textReferenceLoadPassed =
                  false;
  
                let metadataValid:
                  boolean |
                  null =
                  null;
  
                let loadError:
                  string |
                  null =
                  null;
  
                try {
                  const references =
                    OfflineFigmaTextReference.load(
                      viewport.name
                    );
  
                  textElementCount =
                    references.length;
  
                  textReferenceLoadPassed =
                    references.length >
                    0;
  
                  const metadata =
                    OfflineFigmaTextReference.loadMetadata(
                      viewport.name
                    );
  
                  if (metadata) {
                    metadataValid =
                      metadata.viewport ===
                        viewport.name &&
                      metadata.elementCount ===
                        references.length &&
                      (metadata.source === 'figma-api' || metadata.source === 'local-file') &&
                      metadata.fileKey.trim()
                        .length >
                        0 &&
                      metadata.nodeId.trim()
                        .length >
                        0 &&
                      metadata.generatedAt.trim()
                        .length >
                        0;
                  }
                } catch (
                  error
                ) {
                  loadError =
                    error instanceof Error
                      ? error.message
                      : String(
                          error
                        );
                }
  
                const blockingPassed =
                  textReferenceExists &&
                  textReferenceLoadPassed &&
                  imageReferenceExists &&
                  (
                    metadataValid ===
                      null ||
                    metadataValid ===
                      true
                  );
  
                return {
                  viewport:
                    viewport.name,
  
                  textReferencePath,
  
                  metadataPath,
  
                  imageReferencePath,
  
                  textReferenceExists,
  
                  metadataExists,
  
                  imageReferenceExists,
  
                  textReferenceLoadPassed,
  
                  textElementCount,
  
                  metadataValid,
  
                  loadError,
  
                  blockingPassed,
                };
              }
            );
  
          const blockingFailureCount =
            results.filter(
              result =>
                !result.blockingPassed
            ).length;
  
          const metadataMissingCount =
            results.filter(
              result =>
                !result.metadataExists
            ).length;
  
          const report = {
            expectedReferenceViewportCount:
              requiredViewports.length,
  
            validatedReferenceViewportCount:
              results.length,
  
            blockingFailureCount,
  
            metadataMissingCount,
  
            blockingPassed:
              blockingFailureCount ===
              0,
  
            results,
          };
  
          const reportPath =
            path.join(
              process.cwd(),
              'reports',
              'audit',
              'figma-reference-coverage-xl-1728.json'
            );
  
          fs.mkdirSync(
            path.dirname(
              reportPath
            ),
            {
              recursive:
                true,
            }
          );
  
          fs.writeFileSync(
            reportPath,
            JSON.stringify(
              report,
              null,
              2
            ),
            'utf8'
          );
  
          console.log(
            'FIGMA REFERENCE COVERAGE'
          );
  
          console.log(
            JSON.stringify(
              report,
              null,
              2
            )
          );
  
          console.log(
            `Report: ${reportPath}`
          );
  
          expect(
            results.length,
            'Every configured Figma reference viewport must be evaluated.'
          ).toBe(
            requiredViewports.length
          );
  
          expect(
            blockingFailureCount,
            'One or more required Figma references are missing or invalid.'
          ).toBe(
            0
          );
        }
      );
    }
  );
  