import {
    test,
    expect,
  } from '@playwright/test';
  
  import {
    PNG,
  } from 'pngjs';
  
  import fs from 'fs';
  import path from 'path';
  
  import {
    FigmaTextSource,
  } from '../../utils/FigmaTextSource';
  
  import {
    FigmaPageSectionObserver,
  } from '../../utils/FigmaPageSectionObserver';
  
  import {
    FigmaVisualBlockObserver,
  } from '../../utils/FigmaVisualBlockObserver';
  
  import {
    xl1728VisualBlocks,
  } from '../../config/visualBlocks';
  
  test.describe(
    'Figma Visual Blocks',
    () => {
      test(
        'should build the 11 visual QA blocks',
        async () => {
          const viewport =
            'xl-1728';
  
          const referencePath =
            path.join(
              'figma',
              'references',
              viewport,
              'homepage.png'
            );
  
          expect(
            fs.existsSync(
              referencePath
            )
          ).toBe(true);
  
          const image =
            PNG.sync.read(
              fs.readFileSync(
                referencePath
              )
            );
  
          const figmaSource =
            FigmaTextSource.load(
              viewport
            );
  
          const sections =
            FigmaPageSectionObserver.observe(
              figmaSource.elements
            );
  
          const blocks =
            FigmaVisualBlockObserver.observe(
              sections,
              figmaSource.elements,
              image.width,
              image.height,
              xl1728VisualBlocks
            );
  
          console.log(
            '\nFIGMA VISUAL BLOCKS'
          );
  
          console.log({
            logicalSections:
              sections.length,
  
            visualBlocks:
              blocks.length,
          });
  
          let representedSectionCount =
            0;
  
          for (
            const block of
            blocks
          ) {
            representedSectionCount +=
              block.sectionIds.length;
  
            console.log(
              '\n--------------------'
            );
  
            console.log({
              blockName:
                block.blockName,
  
              sectionCount:
                block.sectionIds.length,
  
              sectionNames:
                block.sectionNames,
  
              bounds:
                block.bounds,
            });
          }
  
          console.log(
            '\nREPRESENTATION'
          );
  
          console.log({
            representedSectionCount,
            totalLogicalSections:
              sections.length,
          });
  
          expect(
            blocks.length
          ).toBe(11);
  
          expect(
            representedSectionCount
          ).toBe(
            sections.length
          );
        }
      );
    }
  );
  