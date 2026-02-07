import { loadFonts } from './utils/helpers';
import { generateColors } from './design-system/colors';
import { generateTypography } from './design-system/typography';
import { generateComponents } from './design-system/components';
import { generateLogin } from './screens/login';
import { generateDashboard } from './screens/dashboard';
import { generateVocInput } from './screens/voc-input';
import { generateVocList } from './screens/voc-list';
import { generateVocKanban } from './screens/voc-kanban';
import { generateVocDetail } from './screens/voc-detail';
import { generateEmailCompose } from './screens/email-compose';
import { generateAdminUsers } from './screens/admin-users';
import { generateAdminCategories } from './screens/admin-categories';
import { generatePublicStatus } from './screens/public-status';
import { placeInFlowLayout } from './flow-diagram';
import { buildAnnotationPanel } from './annotations';

figma.showUI(__html__, { width: 320, height: 620 });

interface Selections {
  layout: 'row' | 'flow';
  designSystem: {
    colors: boolean;
    typography: boolean;
    components: boolean;
  };
  annotations: boolean;
  screens: string[];
}

type Generator = () => Promise<FrameNode[]>;

const screenGenerators: Record<string, Generator> = {
  'login': generateLogin,
  'dashboard': generateDashboard,
  'voc-input': generateVocInput,
  'voc-list': generateVocList,
  'voc-kanban': generateVocKanban,
  'voc-detail': generateVocDetail,
  'email-compose': generateEmailCompose,
  'admin-users': generateAdminUsers,
  'admin-categories': generateAdminCategories,
  'public-status': generatePublicStatus,
};

// ── Row Layout ──────────────────────────────────────────────────────

const FRAME_GAP = 200;

function placeFramesInRow(frames: FrameNode[], xRef: { x: number }): void {
  for (const frame of frames) {
    frame.x = xRef.x;
    frame.y = 0;
    figma.currentPage.appendChild(frame);
    xRef.x += frame.width + 100;
  }
  xRef.x += FRAME_GAP - 100;
}

// ── Main Handler ────────────────────────────────────────────────────

figma.ui.onmessage = async (msg: { type: string; selections?: Selections }) => {
  if (msg.type === 'cancel') {
    figma.closePlugin();
    return;
  }

  if (msg.type === 'generate' && msg.selections) {
    try {
      const sel = msg.selections;

      figma.ui.postMessage({ type: 'progress', message: 'Loading fonts...' });
      await loadFonts();

      // Generate design system frames
      const dsFrames: FrameNode[] = [];

      if (sel.designSystem.colors) {
        figma.ui.postMessage({ type: 'progress', message: 'Generating Color Palette...' });
        dsFrames.push(...await generateColors());
      }
      if (sel.designSystem.typography) {
        figma.ui.postMessage({ type: 'progress', message: 'Generating Typography Scale...' });
        dsFrames.push(...await generateTypography());
      }
      if (sel.designSystem.components) {
        figma.ui.postMessage({ type: 'progress', message: 'Generating Component Library...' });
        dsFrames.push(...await generateComponents());
      }

      // Generate screen frames
      const screenFrameMap = new Map<string, FrameNode[]>();

      for (const screen of sel.screens) {
        const generator = screenGenerators[screen];
        if (generator) {
          figma.ui.postMessage({ type: 'progress', message: `Generating ${screen}...` });
          screenFrameMap.set(screen, await generator());
        }
      }

      // Place frames based on layout mode
      if (sel.layout === 'flow') {
        figma.ui.postMessage({ type: 'progress', message: 'Arranging flow layout...' });
        placeInFlowLayout(dsFrames, screenFrameMap);
      } else {
        const pos = { x: 0 };
        for (const frame of dsFrames) {
          placeFramesInRow([frame], pos);
        }
        for (const frames of screenFrameMap.values()) {
          placeFramesInRow(frames, pos);
        }
      }

      // Place annotation panels next to each screen
      if (sel.annotations) {
        figma.ui.postMessage({ type: 'progress', message: 'Adding annotations...' });
        for (const [screenId, frames] of screenFrameMap) {
          const panel = buildAnnotationPanel(screenId);
          if (panel && frames[0]) {
            const lastFrame = frames[frames.length - 1];
            panel.x = lastFrame.x + lastFrame.width + 40;
            panel.y = lastFrame.y;
            figma.currentPage.appendChild(panel);
          }
        }
      }

      // Zoom to fit
      const allNodes = figma.currentPage.children;
      if (allNodes.length > 0) {
        figma.viewport.scrollAndZoomIntoView([...allNodes]);
      }

      const total = dsFrames.length + screenFrameMap.size;
      const layoutLabel = sel.layout === 'flow' ? 'flow diagram' : 'row';

      figma.ui.postMessage({
        type: 'done',
        message: `Done! ${total} frame(s), ${layoutLabel} layout.`,
      });
      figma.notify(`Generated ${total} frame(s) in ${layoutLabel} layout.`);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      figma.ui.postMessage({ type: 'done', message: `Error: ${message}` });
      figma.notify(`Error: ${message}`, { error: true });
    }
  }
};
