const API = '/api';

const { createApp, ref, reactive, computed, watch, onMounted, onUnmounted, nextTick, h } = Vue;
const { createDiscreteApi, darkTheme } = naive;

// ─── 主题配色（与 CSS 变量同值，naive-ui 需要 JS 色值做派生计算）───
const PALETTE = {
  dark: {
    bgPrimary: '#0e0e0f', bgSecondary: '#151416', bgCard: '#1b1a1c', bgCardHover: '#222124',
    border: '#2a292c', borderHover: '#3a383d',
    textPrimary: '#e8e3d9', textSecondary: '#9b9488', textMuted: '#6f6a60',
    accent: '#c2a46b', accentDim: '#9f8554', accentGlow: 'rgba(194, 164, 107, 0.12)',
    danger: '#b75a5a', dangerBg: 'rgba(183, 90, 90, 0.12)',
    success: '#5f9f7a',
    mask: 'rgba(0, 0, 0, 0.75)',
  },
  light: {
    bgPrimary: '#f6f3ee', bgSecondary: '#ebe7df', bgCard: '#ffffff', bgCardHover: '#f3efe8',
    border: '#ddd6cc', borderHover: '#cfc7bb',
    textPrimary: '#1c1a17', textSecondary: '#6e685f', textMuted: '#9a948a',
    accent: '#b89a5d', accentDim: '#9c824c', accentGlow: 'rgba(184, 154, 93, 0.15)',
    danger: '#b75a5a', dangerBg: 'rgba(183, 90, 90, 0.1)',
    success: '#5f9f7a',
    mask: 'rgba(0, 0, 0, 0.5)',
  },
};

function buildOverrides(p) {
  return {
    common: {
      primaryColor: p.accent,
      primaryColorHover: p.accent,
      primaryColorPressed: p.accentDim,
      primaryColorSuppl: p.accent,
      errorColor: p.danger,
      errorColorHover: p.danger,
      errorColorPressed: p.danger,
      errorColorSuppl: p.danger,
      successColor: p.success,
      successColorHover: p.success,
      successColorPressed: p.success,
      successColorSuppl: p.success,
      warningColor: p.accent,
      warningColorHover: p.accent,
      warningColorPressed: p.accentDim,
      warningColorSuppl: p.accent,
      borderRadius: '8px',
      borderRadiusSmall: '6px',
      fontFamily: "'Manrope', sans-serif",
      fontFamilyMono: "'DM Mono', monospace",
      textColor1: p.textPrimary,
      textColor2: p.textSecondary,
      textColor3: p.textMuted,
      bodyColor: p.bgPrimary,
      cardColor: p.bgCard,
      modalColor: p.bgSecondary,
      popoverColor: p.bgCard,
      inputColor: p.bgCard,
      inputColorDisabled: p.bgSecondary,
      actionColor: p.bgSecondary,
      tableColor: p.bgCard,
      hoverColor: p.bgCardHover,
      borderColor: p.border,
      dividerColor: p.border,
    },
    Button: {
      fontWeight: '500',
      fontWeightStrong: '600',
    },
    Input: {
      borderHover: p.borderHover,
      borderFocus: p.accent,
      boxShadowFocus: `0 0 0 3px ${p.accentGlow}`,
      color: p.bgCard,
      colorFocus: p.bgCard,
      border: p.border,
      borderRadius: '8px',
      textColor: p.textPrimary,
      placeholderColor: p.textMuted,
      caretColor: p.accent,
    },
    Select: {
      peers: {
        InternalSelection: {
          color: p.bgCard,
          colorActive: p.bgCard,
          border: p.border,
          borderHover: p.borderHover,
          borderActive: p.accent,
          borderFocus: p.accent,
          boxShadowFocus: `0 0 0 3px ${p.accentGlow}`,
          boxShadowActive: `0 0 0 3px ${p.accentGlow}`,
          textColor: p.textPrimary,
          arrowColor: p.textMuted,
        },
        InternalSelectMenu: {
          color: p.bgCard,
          optionTextColor: p.textPrimary,
          optionTextColorActive: p.accent,
          optionColorPending: p.bgCardHover,
        },
      },
    },
    Modal: {
      maskColor: p.mask,
    },
    Tag: {
      borderRadius: '4px',
      colorBordered: p.accentGlow,
      color: p.accentGlow,
      textColor: p.accent,
      border: p.accentGlow,
    },
    Pagination: {
      itemTextColor: p.textSecondary,
      itemTextColorHover: p.accent,
      itemTextColorActive: p.accent,
      itemColor: 'transparent',
      itemColorHover: p.bgCardHover,
      itemColorActive: p.accentGlow,
      itemBorder: p.border,
      itemBorderHover: p.borderHover,
      itemBorderActive: p.accent,
      itemBorderRadius: '8px',
    },
    Progress: {
      fillColor: p.accent,
      railColor: p.border,
      textColor: p.textMuted,
    },
    Empty: {
      textColor: p.textSecondary,
    },
    Upload: {
      draggerColor: 'transparent',
      draggerBorder: `2px dashed ${p.border}`,
      draggerBorderHover: p.accent,
      draggerColorHover: p.accentGlow,
    },
    Form: {
      labelTextColor: p.textSecondary,
    },
    Message: {
      color: p.bgCard,
      textColor: p.textPrimary,
      borderColor: p.border,
    },
    Dialog: {
      color: p.bgSecondary,
      textColor: p.textPrimary,
      titleTextColor: p.textPrimary,
      iconColor: p.accent,
    },
  };
}

createApp({
  setup() {
    const route = ref(location.hash || '#/login');
    const token = ref(localStorage.getItem('s3hub_token') || '');
    const user = ref(null);
    const langVersion = ref(0);
    const baseUrl = ref(location.origin);
    const lang = computed(() => { langVersion.value; return I18N.t(); });
    const isAdmin = computed(() => user.value?.role === 'admin');
    // 启动中：自动登录检查完成前不渲染任何页面，避免登录页闪烁
    const booting = ref(true);

    // ─── Theme ───
    const theme = ref('dark');
    const isDark = computed(() => theme.value === 'dark');
    let mediaListener = null;

    const themeOverrides = computed(() => buildOverrides(isDark.value ? PALETTE.dark : PALETTE.light));
    const appTheme = computed(() => (isDark.value ? darkTheme : null));

    function applyTheme(t) {
      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(t);
      theme.value = t;
    }

    function initTheme() {
      const stored = localStorage.getItem('s3hub_theme');
      if (stored === 'dark' || stored === 'light') {
        applyTheme(stored);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
      }
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      mediaListener = (e) => {
        if (localStorage.getItem('s3hub_theme')) return;
        applyTheme(e.matches ? 'dark' : 'light');
      };
      mql.addEventListener('change', mediaListener);
    }

    function toggleTheme() {
      const next = theme.value === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('s3hub_theme', next);
    }

    // ─── Discrete API（全局 message / dialog，无需 provider 包裹）───
    // naive-ui createDiscreteApi 在创建时读取 theme/themeOverrides；
    // 主题切换时重建以保持配色跟随。
    let discrete = createDiscrete();
    function createDiscrete() {
      return createDiscreteApi(['message', 'dialog'], {
        configProviderSettings: {
          theme: appTheme.value,
          themeOverrides: themeOverrides.value,
        },
        messageProviderProps: { placement: 'bottom-right', max: 5 },
      });
    }
    watch([appTheme, themeOverrides], () => {
      // 重建 discrete 实例以应用新主题
      discrete.destroy?.();
      discrete = createDiscrete();
    });

    function toast(msg, type = '') {
      if (type === 'success') discrete.message.success(msg);
      else if (type === 'error') discrete.message.error(msg, { duration: 5000 });
      else discrete.message.info(msg);
    }

    // ─── Login Form ───
    const loginForm = reactive({ username: '', password: '' });
    const loginError = ref('');
    const loginLoading = ref(false);

    async function handleLogin() {
      loginError.value = '';
      loginLoading.value = true;
      try {
        const data = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: loginForm.username, password: loginForm.password }),
        });
        token.value = data.token;
        user.value = data.user;
        localStorage.setItem('s3hub_token', data.token);
        loginForm.username = '';
        loginForm.password = '';
        toast(lang.value.login + ' ✓', 'success');
        navigate('#/home');
      } catch {
        loginError.value = lang.value.invalidCredentials;
      } finally {
        loginLoading.value = false;
      }
    }

    // ─── Router ───
    let autoLoginDone = false;

    function navigate(hash) { location.hash = hash; }

    function onHashChange() {
      if (!autoLoginDone) return;
      const h = location.hash || '#/login';
      if (h === '#/home' && !token.value) { navigate('#/login'); return; }
      if (h === '#/login' && token.value) { navigate('#/home'); return; }
      route.value = h;
    }

    // ─── API ───
    async function api(path, opts = {}) {
      const headers = { ...opts.headers };
      if (token.value) headers['Authorization'] = `Bearer ${token.value}`;
      if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API}${path}`, { ...opts, headers });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = null; }
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      return data;
    }

    // ─── Auth ───
    let initialHash = null;
    async function tryAutoLogin() {
      if (!token.value) { navigate('#/login'); finishBoot(); return; }
      initialHash = location.hash || '#/login';
      try {
        const cfg = await fetch('/api/config').then(r => r.json());
        if (cfg.baseUrl) baseUrl.value = cfg.baseUrl;
        const data = await api('/auth/me');
        user.value = data.user;
        navigate('#/home');
      } catch {
        token.value = '';
        user.value = null;
        localStorage.removeItem('s3hub_token');
        navigate('#/login');
      } finally {
        autoLoginDone = true;
        nextTick(() => {
          route.value = location.hash || '#/login';
          // 刷新停留在首页时 route 不会变化，watch 不会触发，需主动加载
          // （从 login 导航到 home 时 route 会变，watch 会处理，这里跳过）
          if (route.value === '#/home' && initialHash === '#/home') loadImages(1);
          finishBoot();
        });
      }
    }

    function finishBoot() {
      booting.value = false;
      document.getElementById('app-loading')?.remove();
    }

    function doLogout() {
      token.value = '';
      user.value = null;
      localStorage.removeItem('s3hub_token');
      navigate('#/login');
    }

    // ─── 用户下拉菜单 ───
    const userMenuOptions = computed(() => [
      { label: lang.value.logout, key: 'logout', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', style: 'width:14px;height:14px' }, [
        h('path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }),
        h('polyline', { points: '16 17 21 12 16 7' }),
        h('line', { x1: 21, y1: 12, x2: 9, y2: 12 }),
      ]) },
    ]);

    function onUserMenuSelect(key) {
      if (key === 'logout') doLogout();
    }

    // ─── Images ───
    const images = ref([]);
    const pagination = ref({ page: 1, limit: 24, total: 0, pages: 0 });
    const searchQuery = ref('');
    const loadingImages = ref(false);
    let searchTimer = null;

    async function loadImages(page = 1) {
      loadingImages.value = true;
      try {
        const params = new URLSearchParams({ page, limit: 24 });
        const q = searchQuery.value.trim();
        if (q) params.set('search', q);
        const data = await api(`/images?${params}`);
        images.value = data.images;
        pagination.value = data.pagination;
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        loadingImages.value = false;
      }
    }

    function onSearch() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => loadImages(1), 300);
    }

    // ─── Detail Modal ───
    const detailOpen = ref(false);
    const detailImage = ref(null);
    const detailStaticUrl = ref('');

    async function openDetail(id) {
      try {
        const data = await api(`/images/${id}`);
        detailImage.value = data.image;
        detailStaticUrl.value = `${baseUrl.value}/static/${data.image.md5}`;
        detailOpen.value = true;
      } catch (err) {
        toast(err.message, 'error');
      }
    }

    function copyStaticUrl() {
      navigator.clipboard.writeText(detailStaticUrl.value).then(() => toast(lang.value.copied, 'success'));
    }

    function copyQuickUrl(md5) {
      navigator.clipboard.writeText(`${baseUrl.value}/static/${md5}`).then(() => toast(lang.value.copied, 'success'));
    }

    // ─── Delete（用 NDialog 替代 confirm）───
    const deleting = ref(false);
    function deleteImage(id) {
      if (!id) return;
      discrete.dialog.warning({
        title: lang.value.confirm,
        content: lang.value.deleteConfirm,
        positiveText: lang.value.confirm,
        negativeText: lang.value.cancel,
        onPositiveClick: async () => {
          deleting.value = true;
          try {
            await api(`/images/${id}`, { method: 'DELETE' });
            toast(lang.value.deleted, 'success');
            detailOpen.value = false;
            loadImages(pagination.value.page);
          } catch (err) {
            toast(err.message, 'error');
          } finally {
            deleting.value = false;
          }
        },
      });
    }

    // ─── Upload Modal ───
    const uploadOpen = ref(false);
    const uploading = ref(false);
    const uploadPct = ref(0);
    const uploadList = ref([]);
    const fileInput = ref(null);

    function openUpload() { uploadOpen.value = true; uploadList.value = []; uploadPct.value = 0; }

    // NUpload @change 回调：收集原生 File 调用原上传逻辑
    function onUploadChange({ fileList }) {
      const files = fileList.map(f => f.file).filter(Boolean);
      if (files.length) uploadFiles(files);
    }

    function uploadFiles(files) {
      if (!files.length) return;
      const formData = new FormData();
      uploadList.value = [];
      for (const file of files) {
        formData.append('files', file);
        uploadList.value.push(file.name);
      }

      uploading.value = true;
      uploadPct.value = 0;

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API}/images/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token.value}`);

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) uploadPct.value = Math.round((e.loaded / e.total) * 100);
      };

      xhr.onload = () => {
        uploading.value = false;
        if (xhr.status === 200) {
          toast(lang.value.uploadResult(files.length), 'success');
          uploadOpen.value = false;
          loadImages(1);
        } else {
          let msg = lang.value.networkError;
          try { msg = JSON.parse(xhr.responseText).error || msg; } catch {}
          toast(msg, 'error');
        }
      };
      xhr.onerror = () => { uploading.value = false; toast(lang.value.networkError, 'error'); };
      xhr.send(formData);
    }

    // ─── Sync ───
    const syncing = ref(false);
    async function syncFromS3() {
      syncing.value = true;
      try {
        const data = await api('/sync', { method: 'POST' });
        toast(lang.value.syncResult(data.synced, data.skipped), 'success');
        loadImages(1);
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        syncing.value = false;
      }
    }

    // ─── Users Modal ───
    const usersOpen = ref(false);
    const usersList = ref([]);
    const loadingUsers = ref(false);
    const creatingUser = ref(false);
    const newUser = reactive({ username: '', password: '', role: 'user' });
    const resetModalOpen = ref(false);
    const resetUserId = ref('');
    const resetPass = ref('');
    const resettingPassword = ref(false);

    const roleOptions = computed(() => [
      { label: lang.value.user, value: 'user' },
      { label: lang.value.admin, value: 'admin' },
    ]);

    async function openUsers() {
      usersOpen.value = true;
      loadUsers();
    }

    async function loadUsers() {
      loadingUsers.value = true;
      try {
        const data = await api('/auth/users');
        usersList.value = data.users;
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        loadingUsers.value = false;
      }
    }

    async function createUser() {
      creatingUser.value = true;
      try {
        await api('/auth/users', {
          method: 'POST',
          body: JSON.stringify({ ...newUser }),
        });
        toast(lang.value.userCreated, 'success');
        newUser.username = '';
        newUser.password = '';
        newUser.role = 'user';
        loadUsers();
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        creatingUser.value = false;
      }
    }

    const deletingUser = ref(false);
    function deleteUser(id, username) {
      discrete.dialog.warning({
        title: lang.value.confirm,
        content: lang.value.deleteConfirmUser(username),
        positiveText: lang.value.confirm,
        negativeText: lang.value.cancel,
        onPositiveClick: async () => {
          deletingUser.value = true;
          try {
            await api(`/auth/users/${id}`, { method: 'DELETE' });
            toast(lang.value.userDeleted, 'success');
            loadUsers();
          } catch (err) {
            toast(err.message, 'error');
          } finally {
            deletingUser.value = false;
          }
        },
      });
    }

    function openReset(id) {
      resetUserId.value = id;
      resetPass.value = '';
      resetModalOpen.value = true;
    }

    async function doResetPassword() {
      resettingPassword.value = true;
      try {
        await api(`/auth/users/${resetUserId.value}/password`, {
          method: 'PUT',
          body: JSON.stringify({ password: resetPass.value }),
        });
        toast(lang.value.passwordReset, 'success');
        resetModalOpen.value = false;
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        resettingPassword.value = false;
      }
    }

    // ─── Lang ───
    function toggleLang() {
      I18N.setLang(I18N.getLang() === 'zh' ? 'en' : 'zh');
      langVersion.value++;
    }

    // ─── Helpers ───
    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // ─── Lifecycle ───
    onMounted(() => {
      initTheme();
      window.addEventListener('hashchange', onHashChange);
      tryAutoLogin();
    });

    onUnmounted(() => {
      window.removeEventListener('hashchange', onHashChange);
      if (mediaListener) window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', mediaListener);
      discrete.destroy?.();
    });

    watch(route, (r) => {
      if (r === '#/home') loadImages(1);
    });

    return {
      route, token, user, lang, isAdmin, booting,
      appTheme, themeOverrides, theme, toggleTheme,
      loginForm, loginError, loginLoading, handleLogin,
      doLogout, toggleLang, userMenuOptions, onUserMenuSelect,
      images, pagination, searchQuery, onSearch, loadImages, loadingImages, formatSize,
      detailOpen, detailImage, detailStaticUrl, openDetail, copyStaticUrl, copyQuickUrl, deleteImage, deleting,
      uploadOpen, uploading, uploadPct, uploadList, openUpload, onUploadChange,
      syncing, syncFromS3,
      usersOpen, usersList, loadingUsers, newUser, creatingUser, openUsers, createUser, deleteUser, deletingUser,
      roleOptions,
      resetModalOpen, resetUserId, resetPass, openReset, doResetPassword, resettingPassword,
    };
  },
}).use(naive).mount('#app');
