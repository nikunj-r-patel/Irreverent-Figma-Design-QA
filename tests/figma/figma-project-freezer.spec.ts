import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  FigmaProjectFreezer,
} from '../../figma/FigmaProjectFreezer';

test.describe('Figma Project Freezer (Bulk Offline Slicer)', () => {
  const tempDir = path.join('figma', 'references', '__freezer-test');

  test.afterEach(async () => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const mockDocument = {
    document: {
      id: '0:0',
      name: 'Document',
      type: 'DOCUMENT',
      children: [
        {
          id: '1:1',
          name: 'Home - Desktop 1728px',
          type: 'FRAME',
          absoluteBoundingBox: { x: 0, y: 0, width: 1728, height: 4000 },
          children: [
            {
              id: '1:10',
              name: 'Hero Title',
              type: 'TEXT',
              characters: 'PARAGON HOODIE',
              style: {
                fontFamily: 'Inter',
                fontWeight: 700,
                fontSize: 48,
                textAlignHorizontal: 'CENTER',
              },
            },
          ],
        },
        {
          id: '2:1',
          name: 'Product Details - Desktop 1728px',
          type: 'FRAME',
          absoluteBoundingBox: { x: 2000, y: 0, width: 1728, height: 3500 },
          children: [
            {
              id: '2:10',
              name: 'Price Tag',
              type: 'TEXT',
              characters: '$85.00',
              style: {
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: 24,
              },
            },
            {
              id: '2:11',
              name: 'CTA Button',
              type: 'TEXT',
              characters: 'BUY NOW',
              style: {
                fontFamily: 'Inter',
                fontWeight: 700,
                fontSize: 16,
              },
            },
          ],
        },
        {
          id: '3:1',
          name: 'Collection - Desktop 1440px',
          type: 'FRAME',
          absoluteBoundingBox: { x: 4000, y: 0, width: 1440, height: 3000 },
          children: [
            {
              id: '3:10',
              name: 'Grid Header',
              type: 'TEXT',
              characters: 'ALL PRODUCTS',
              style: {
                fontFamily: 'Inter',
                fontWeight: 700,
                fontSize: 32,
              },
            },
          ],
        },
      ],
    },
  };

  test('should find frames by exact name or fuzzy page match', () => {
    const homeFrame = FigmaProjectFreezer.findNode(
      mockDocument.document,
      node => node.name === 'Home - Desktop 1728px'
    );
    expect(homeFrame).toBeTruthy();
    expect(homeFrame.id).toBe('1:1');

    const pdpFrame = FigmaProjectFreezer.findNode(
      mockDocument.document,
      node => node.id === '2:1'
    );
    expect(pdpFrame).toBeTruthy();
    expect(pdpFrame.name).toBe('Product Details - Desktop 1728px');
  });

  test('should extract all text references and token styles from a frame', () => {
    const pdpFrame = FigmaProjectFreezer.findNode(
      mockDocument.document,
      node => node.id === '2:1'
    );
    const elements = FigmaProjectFreezer.extractFrameReferences(pdpFrame);

    expect(elements).toHaveLength(2);
    expect(elements[0].text).toBe('$85.00');
    expect(elements[1].text).toBe('BUY NOW');
    expect(elements[0].figmaNodeId).toBe('2:10');
  });

  test('should freeze multiple pages from a local document override without API calls', async () => {
    const mockFilePath = path.join(tempDir, 'mock-figma-file.json');
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(mockFilePath, JSON.stringify(mockDocument, null, 2), 'utf8');

    const report = await FigmaProjectFreezer.freezeProject(
      'https://www.figma.com/design/testKey/Test-File?node-id=0-1',
      undefined,
      {
        localFileOverride: mockFilePath,
        outputDirectory: tempDir,
        targetPages: ['home', 'pdp', 'collection'],
      }
    );

    expect(report.totalPageCount).toBe(3);
    expect(report.frozenPages).toHaveLength(3);

    // Verify Home snapshot
    const home = report.frozenPages.find(p => p.pageKey === 'home');
    expect(home).toBeTruthy();
    expect(home?.viewport).toBe('xl-1728');
    expect(home?.elementCount).toBe(1);
    expect(fs.existsSync(home!.outputPath)).toBe(true);

    // Verify PDP snapshot
    const pdp = report.frozenPages.find(p => p.pageKey === 'pdp');
    expect(pdp).toBeTruthy();
    expect(pdp?.viewport).toBe('xl-1728');
    expect(pdp?.elementCount).toBe(2);
    expect(fs.existsSync(pdp!.outputPath)).toBe(true);

    // Verify Collection snapshot with auto-detected 1440px width
    const collection = report.frozenPages.find(p => p.pageKey === 'collection');
    expect(collection).toBeTruthy();
    expect(collection?.viewport).toBe('desktop-1440');
    expect(collection?.elementCount).toBe(1);
    expect(fs.existsSync(collection!.outputPath)).toBe(true);
  });
});
