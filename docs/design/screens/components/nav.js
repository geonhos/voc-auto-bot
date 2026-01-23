/**
 * VOC Auto Bot - Common Navigation Component
 * 모든 화면에서 공통으로 사용되는 네비게이션 바
 */

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: 'SC-11-dashboard.html' },
  { id: 'voc-entry', label: 'VOC Entry', href: 'SC-02-voc-input.html' },
  { id: 'voc-list', label: 'VOC List', href: 'SC-04-voc-kanban.html' },
  { id: 'settings', label: 'Settings', href: 'SC-09-category.html' },
];

function renderNav(activeId) {
  const navContainer = document.getElementById('main-nav');
  if (!navContainer) return;

  const navHTML = NAV_ITEMS.map(item => {
    const isActive = item.id === activeId;
    const baseClass = 'transition-colors';
    const activeClass = 'text-primary border-b-2 border-primary pb-1';
    const inactiveClass = 'text-slate-500 dark:text-slate-400 hover:text-primary';

    return `<a class="${baseClass} ${isActive ? activeClass : inactiveClass}" href="${item.href}">${item.label}</a>`;
  }).join('\n');

  navContainer.innerHTML = navHTML;
}

function renderHeader(activeId, userInitials = 'JD') {
  const headerContainer = document.getElementById('app-header');
  if (!headerContainer) return;

  const navLinks = NAV_ITEMS.map(item => {
    const isActive = item.id === activeId;
    const baseClass = 'transition-colors';
    const activeClass = 'text-primary border-b-2 border-primary pb-1';
    const inactiveClass = 'text-slate-500 dark:text-slate-400 hover:text-primary';

    return `<a class="${baseClass} ${isActive ? activeClass : inactiveClass}" href="${item.href}">${item.label}</a>`;
  }).join('\n');

  headerContainer.innerHTML = `
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <a href="SC-11-dashboard.html" class="flex items-center gap-2">
        <span class="material-icons-outlined text-primary text-3xl">smart_toy</span>
        <span class="font-bold text-xl tracking-tight">VOC Auto Bot</span>
      </a>
      <nav id="main-nav" class="hidden md:flex gap-6 text-sm font-medium">
        ${navLinks}
      </nav>
      <div class="flex items-center gap-4">
        <button class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <span class="material-icons-outlined text-slate-600 dark:text-slate-300">notifications</span>
        </button>
        <a href="SC-01-login.html" title="로그아웃" class="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-white font-bold text-xs hover:ring-2 hover:ring-primary transition-all">${userInitials}</a>
      </div>
    </div>
  `;
}

// Export for use
window.VOCNav = {
  render: renderNav,
  renderHeader: renderHeader,
  items: NAV_ITEMS
};
