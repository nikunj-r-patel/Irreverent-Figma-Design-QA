import { FigmaProjectFreezer, PageSnapshotResult } from '../figma/FigmaProjectFreezer';

(async () => {
  try {
    const result = await FigmaProjectFreezer.freezeProject(
      'https://www.figma.com/design/Dw1Dj8TdcDwpvnshkjytBG/Irreverent-Website?node-id=41-505&m=dev',
      undefined,
      {
        localFileOverride: 'figma/cache/Dw1Dj8TdcDwpvnshkjytBG.json',
        targetPages: ['home']
      }
    );
    console.log('FREEZE RESULT:');
    console.log('Total frozen:', result.totalPageCount);
    result.frozenPages.forEach((p: PageSnapshotResult) => console.log('  ->', p.pageKey, p.frameName, 'Viewport:', p.viewport, 'Elements:', p.elementCount, 'Output:', p.outputPath));
    if (result.skippedPages.length > 0) {
      console.log('Skipped:');
      result.skippedPages.forEach((s: { pageKey: string; reason: string }) => console.log('  x', s.pageKey, s.reason));
    }
  } catch (err) {
    console.error('Error during freeze:', err);
  }
})();
