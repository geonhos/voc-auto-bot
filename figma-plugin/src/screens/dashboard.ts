import { COLORS, RADIUS, CHART_PALETTE, STATUS_COLORS, PRIORITY_COLORS } from '../utils/constants';
import { buildAppShell, createAutoLayoutFrame, createText, createPlaceholder, finalize, markFillH } from '../utils/helpers';
import { buildCard, buildBadge } from '../design-system/components';

export async function generateDashboard(): Promise<FrameNode[]> {

  const { root, content } = buildAppShell('Dashboard');

  // Page header
  const pageHeader = createAutoLayoutFrame({ name: 'Page Header', direction: 'HORIZONTAL', width: 'FILL' });
  pageHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pageHeader.counterAxisAlignItems = 'CENTER';
  pageHeader.appendChild(createText({ text: 'Dashboard', size: 24, weight: 700 }));
  pageHeader.appendChild(createText({ text: '최근 30일 기준', size: 13, color: COLORS.textSecondary }));
  content.appendChild(pageHeader);

  // KPI Row (4 cards)
  const kpiRow = createAutoLayoutFrame({ name: 'KPI Row', direction: 'HORIZONTAL', gap: 16, width: 'FILL' });
  const kpis = [
    { title: '총 접수', value: '1,234', change: '+12.5%' },
    { title: '처리 중', value: '56', change: '-3.2%' },
    { title: '완료율', value: '89.2%', change: '+5.1%' },
    { title: '평균 처리시간', value: '2.3일', change: '-8.7%' },
  ];
  for (const kpi of kpis) {
    const card = buildCard('KPI', kpi.title, kpi.value, kpi.change);
    markFillH(card);
    kpiRow.appendChild(card);
  }
  content.appendChild(kpiRow);

  // Chart Row (2 charts side by side)
  const chartRow = createAutoLayoutFrame({ name: 'Chart Row', direction: 'HORIZONTAL', gap: 16, width: 'FILL' });

  // Status Chart
  const statusChart = createAutoLayoutFrame({
    name: 'Status Chart',
    direction: 'VERTICAL',
    width: 'FILL',
    padding: 20,
    gap: 16,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });
  statusChart.appendChild(createText({ text: '상태별 VOC', size: 16, weight: 600 }));

  // Donut chart placeholder
  const donutArea = createAutoLayoutFrame({ name: 'Donut Area', direction: 'HORIZONTAL', gap: 24, width: 'FILL' });
  donutArea.counterAxisAlignItems = 'CENTER';
  const donut = createPlaceholder('Donut Chart', 160, 160, '#f0f0f0');
  donut.cornerRadius = 9999;
  donutArea.appendChild(donut);

  // Legend
  const legend = createAutoLayoutFrame({ name: 'Legend', direction: 'VERTICAL', gap: 8 });
  const statusItems = [
    { label: '접수', color: STATUS_COLORS.received.bg },
    { label: '분석중', color: STATUS_COLORS.analyzing.bg },
    { label: '처리중', color: STATUS_COLORS.processing.bg },
    { label: '완료', color: STATUS_COLORS.completed.bg },
    { label: '실패', color: STATUS_COLORS.failed.bg },
  ];
  for (const item of statusItems) {
    const legendItem = createAutoLayoutFrame({ name: item.label, direction: 'HORIZONTAL', gap: 8 });
    legendItem.counterAxisAlignItems = 'CENTER';
    const dot = createPlaceholder('Dot', 12, 12, item.color);
    dot.cornerRadius = 9999;
    legendItem.appendChild(dot);
    legendItem.appendChild(createText({ text: item.label, size: 12 }));
    legend.appendChild(legendItem);
  }
  donutArea.appendChild(legend);
  statusChart.appendChild(donutArea);
  chartRow.appendChild(statusChart);

  // Priority Chart
  const priorityChart = createAutoLayoutFrame({
    name: 'Priority Chart',
    direction: 'VERTICAL',
    width: 'FILL',
    padding: 20,
    gap: 16,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });
  priorityChart.appendChild(createText({ text: '우선순위별 VOC', size: 16, weight: 600 }));

  // Bar chart placeholder
  const barArea = createAutoLayoutFrame({ name: 'Bar Area', direction: 'VERTICAL', gap: 8, width: 'FILL' });
  const priorities = [
    { label: 'LOW', value: 320, color: PRIORITY_COLORS.LOW },
    { label: 'NORMAL', value: 580, color: PRIORITY_COLORS.NORMAL },
    { label: 'HIGH', value: 240, color: PRIORITY_COLORS.HIGH },
    { label: 'URGENT', value: 94, color: PRIORITY_COLORS.URGENT },
  ];
  const maxVal = Math.max(...priorities.map(p => p.value));

  for (const p of priorities) {
    const barRow = createAutoLayoutFrame({ name: p.label, direction: 'HORIZONTAL', gap: 12, width: 'FILL' });
    barRow.counterAxisAlignItems = 'CENTER';
    barRow.appendChild(createText({ text: p.label, size: 12, weight: 500, width: 60 }));

    const barBg = createAutoLayoutFrame({ name: 'Bar BG', direction: 'HORIZONTAL', width: 'FILL', height: 24, fill: COLORS.bgLight, cornerRadius: 4 });
    const barWidth = Math.max(20, Math.round((p.value / maxVal) * 300));
    const bar = createPlaceholder('Bar', barWidth, 24, p.color);
    bar.cornerRadius = 4;
    barBg.appendChild(bar);
    barRow.appendChild(barBg);

    barRow.appendChild(createText({ text: String(p.value), size: 12, weight: 600, width: 40 }));
    barArea.appendChild(barRow);
  }
  priorityChart.appendChild(barArea);
  chartRow.appendChild(priorityChart);
  content.appendChild(chartRow);

  // Trend + Category charts row
  const chartRow2 = createAutoLayoutFrame({ name: 'Chart Row 2', direction: 'HORIZONTAL', gap: 16, width: 'FILL' });

  // Trend chart
  const trendChart = createAutoLayoutFrame({
    name: 'Trend Chart',
    direction: 'VERTICAL',
    width: 'FILL',
    padding: 20,
    gap: 16,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });
  trendChart.appendChild(createText({ text: '일별 VOC 추이', size: 16, weight: 600 }));
  trendChart.appendChild(createPlaceholder('Line Chart', 500, 200, '#f8f8f8'));
  chartRow2.appendChild(trendChart);

  // Category chart
  const categoryChart = createAutoLayoutFrame({
    name: 'Category Chart',
    direction: 'VERTICAL',
    width: 'FILL',
    padding: 20,
    gap: 16,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });
  categoryChart.appendChild(createText({ text: '카테고리별 VOC', size: 16, weight: 600 }));
  categoryChart.appendChild(createPlaceholder('Bar Chart', 500, 200, '#f8f8f8'));
  chartRow2.appendChild(categoryChart);
  content.appendChild(chartRow2);

  // Recent VOC Table
  const recentSection = createAutoLayoutFrame({
    name: 'Recent VOC',
    direction: 'VERTICAL',
    width: 'FILL',
    padding: 20,
    gap: 12,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });

  const recentHeader = createAutoLayoutFrame({ name: 'Recent Header', direction: 'HORIZONTAL', width: 'FILL' });
  recentHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  recentHeader.counterAxisAlignItems = 'CENTER';
  recentHeader.appendChild(createText({ text: '최근 VOC', size: 16, weight: 600 }));
  recentHeader.appendChild(createText({ text: '전체 보기 →', size: 13, color: COLORS.primary }));
  recentSection.appendChild(recentHeader);

  // Mini table
  const cols = ['ID', '제목', '카테고리', '상태', '등록일'];
  const colW = [80, 300, 140, 100, 120];

  const tableHeader = createAutoLayoutFrame({ name: 'TH', direction: 'HORIZONTAL', width: 'FILL', padding: { top: 8, right: 0, bottom: 8, left: 0 } });
  for (let i = 0; i < cols.length; i++) {
    const cell = createAutoLayoutFrame({ name: cols[i], direction: 'HORIZONTAL', width: colW[i] });
    cell.appendChild(createText({ text: cols[i], size: 12, weight: 600, color: COLORS.textSecondary }));
    tableHeader.appendChild(cell);
  }
  recentSection.appendChild(tableHeader);

  const rows = [
    ['VOC-001', '로그인 오류 반복 발생', '시스템 오류', 'RECEIVED', '2025-01-15'],
    ['VOC-002', '결제 화면 느려짐', '성능 이슈', 'PROCESSING', '2025-01-14'],
    ['VOC-003', '앱 업데이트 후 크래시', '앱 오류', 'COMPLETED', '2025-01-13'],
  ];

  for (const rowData of rows) {
    const row = createAutoLayoutFrame({ name: 'Row', direction: 'HORIZONTAL', width: 'FILL', padding: { top: 10, right: 0, bottom: 10, left: 0 } });
    row.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.88 } }];
    row.strokeWeight = 1;
    row.strokeAlign = 'INSIDE';

    for (let i = 0; i < rowData.length; i++) {
      const cell = createAutoLayoutFrame({ name: `Cell ${i}`, direction: 'HORIZONTAL', width: colW[i] });
      cell.appendChild(createText({ text: rowData[i], size: 13 }));
      row.appendChild(cell);
    }
    recentSection.appendChild(row);
  }

  content.appendChild(recentSection);
  finalize(root);
  return [root];
}
