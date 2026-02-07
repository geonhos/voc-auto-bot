import { COLORS, RADIUS } from '../utils/constants';
import { buildAppShell, createAutoLayoutFrame, createText, finalize, markFillH } from '../utils/helpers';
import { buildButton, buildInput, buildSelect, buildTextarea } from '../design-system/components';

export async function generateVocInput(): Promise<FrameNode[]> {

  const { root, content } = buildAppShell('VOC 입력');

  // Page header
  const pageHeader = createAutoLayoutFrame({ name: 'Page Header', direction: 'HORIZONTAL', width: 'FILL' });
  pageHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pageHeader.counterAxisAlignItems = 'CENTER';
  pageHeader.appendChild(createText({ text: 'VOC 입력', size: 24, weight: 700 }));
  const templateBtn = buildButton('템플릿 선택', 'secondary');
  pageHeader.appendChild(templateBtn);
  content.appendChild(pageHeader);

  // Form card
  const card = createAutoLayoutFrame({
    name: 'Form Card',
    direction: 'VERTICAL',
    width: 'FILL',
    padding: 24,
    gap: 20,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });

  // Row 1: Category + Priority
  const row1 = createAutoLayoutFrame({ name: 'Row 1', direction: 'HORIZONTAL', gap: 24, width: 'FILL' });
  const cat = buildSelect('카테고리', '카테고리를 선택하세요', 300);
  markFillH(cat);
  row1.appendChild(cat);
  const pri = buildSelect('우선순위', 'NORMAL', 200);
  markFillH(pri);
  row1.appendChild(pri);
  card.appendChild(row1);

  // Row 2: Title
  const titleInput = buildInput('제목', 'VOC 제목을 입력하세요', 600);
  markFillH(titleInput);
  card.appendChild(titleInput);

  // Row 3: Content
  const contentArea = buildTextarea('내용', '고객의 소리 내용을 입력하세요...', 600, 160);
  markFillH(contentArea);
  card.appendChild(contentArea);

  // Row 4: Customer info
  const row4 = createAutoLayoutFrame({ name: 'Customer Info', direction: 'HORIZONTAL', gap: 24, width: 'FILL' });
  const name = buildInput('고객명', '홍길동', 240);
  markFillH(name);
  row4.appendChild(name);
  const email = buildInput('이메일', 'customer@example.com', 240);
  markFillH(email);
  row4.appendChild(email);
  const phone = buildInput('연락처', '010-1234-5678', 200);
  markFillH(phone);
  row4.appendChild(phone);
  card.appendChild(row4);

  // Row 5: Source + Channel
  const row5 = createAutoLayoutFrame({ name: 'Source Info', direction: 'HORIZONTAL', gap: 24, width: 'FILL' });
  const source = buildSelect('접수 경로', '웹', 240);
  markFillH(source);
  row5.appendChild(source);
  const channel = buildSelect('채널', '이메일', 240);
  markFillH(channel);
  row5.appendChild(channel);
  card.appendChild(row5);

  // Actions
  const actions = createAutoLayoutFrame({ name: 'Actions', direction: 'HORIZONTAL', gap: 12, width: 'FILL' });
  actions.primaryAxisAlignItems = 'MAX';
  actions.appendChild(buildButton('취소', 'secondary'));
  actions.appendChild(buildButton('저장', 'primary'));
  card.appendChild(actions);

  content.appendChild(card);
  finalize(root);
  return [root];
}
