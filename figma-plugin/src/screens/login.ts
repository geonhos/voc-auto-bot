import { COLORS, RADIUS, SCREEN_WIDTH } from '../utils/constants';
import { createAutoLayoutFrame, createText, createPlaceholder, solidPaint, finalize, markFillH } from '../utils/helpers';
import { buildButton, buildInput } from '../design-system/components';

export async function generateLogin(): Promise<FrameNode[]> {

  const root = createAutoLayoutFrame({
    name: 'Login',
    direction: 'VERTICAL',
    width: SCREEN_WIDTH,
    height: 900,
    fill: COLORS.bgLight,
  });
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';

  // Card
  const card = createAutoLayoutFrame({
    name: 'Login Card',
    direction: 'VERTICAL',
    width: 400,
    padding: 40,
    gap: 24,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });
  card.counterAxisAlignItems = 'CENTER';

  // Logo area
  const logoArea = createAutoLayoutFrame({
    name: 'Logo Area',
    direction: 'VERTICAL',
    gap: 8,
  });
  logoArea.counterAxisAlignItems = 'CENTER';

  const logo = createPlaceholder('Logo', 48, 48, COLORS.primary);
  logo.cornerRadius = RADIUS.lg;
  logoArea.appendChild(logo);
  logoArea.appendChild(createText({ text: 'VOC Auto Bot', size: 24, weight: 700, color: COLORS.primaryDark }));
  logoArea.appendChild(createText({ text: '고객의 소리 자동 분류 시스템', size: 14, color: COLORS.textSecondary }));
  card.appendChild(logoArea);

  // Form
  const form = createAutoLayoutFrame({ name: 'Login Form', direction: 'VERTICAL', gap: 16, width: 'FILL' });
  form.appendChild(buildInput('이메일', 'email@example.com', 320));
  form.appendChild(buildInput('비밀번호', '••••••••', 320));

  // Remember me
  const rememberRow = createAutoLayoutFrame({ name: 'Remember', direction: 'HORIZONTAL', gap: 8, width: 'FILL' });
  rememberRow.counterAxisAlignItems = 'CENTER';
  const checkbox = createPlaceholder('Checkbox', 16, 16, COLORS.borderLight);
  checkbox.cornerRadius = 3;
  rememberRow.appendChild(checkbox);
  rememberRow.appendChild(createText({ text: '로그인 상태 유지', size: 13, color: COLORS.textSecondary }));
  form.appendChild(rememberRow);

  card.appendChild(form);

  // Login button
  const loginBtn = buildButton('로그인', 'primary');
  markFillH(loginBtn);
  loginBtn.primaryAxisAlignItems = 'CENTER';
  card.appendChild(loginBtn);

  // Footer link
  card.appendChild(createText({ text: '비밀번호를 잊으셨나요?', size: 13, color: COLORS.primary }));

  root.appendChild(card);
  finalize(root);
  return [root];
}
