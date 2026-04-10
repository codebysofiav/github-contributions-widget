const monthsContainer = document.getElementById("months");
const grid = document.getElementById("contribution-grid");
const totalCount = document.getElementById("total-count");
const contributionRing = document.getElementById("contribution-ring");
const themeToggle = document.getElementById("theme-toggle");
const widgetMenu = document.getElementById("widget-menu");
const menuLogin = document.getElementById("menu-login");
const menuLogout = document.getElementById("menu-logout");
const menuRefresh = document.getElementById("menu-refresh");
const themeOptions = document.querySelectorAll(".theme-option");
const sizeOptions = document.querySelectorAll(".size-option");
const layoutOptions = document.querySelectorAll(".layout-option");
const themeParents = document.querySelectorAll(".theme-parent");
const themeParentToggles = document.querySelectorAll(".theme-parent-toggle");
const profileName = document.getElementById("profile-name");
const connectionStatus = document.getElementById("connection-status");
const profileAvatar = document.querySelector(".profile-avatar");
const loginModal = document.getElementById("login-modal");
const loginModalPanel = document.querySelector(".modal-login__panel");
const loginModalClose = document.getElementById("login-modal-close");
const loginConnect = document.getElementById("login-connect");
const windowMinimize = document.getElementById("window-minimize");
const windowClose = document.getElementById("window-close");
const githubUsernameInput = document.getElementById("github-username");
const githubTokenInput = document.getElementById("github-token");
const loginError = document.getElementById("login-error");

const DAYS_PER_WEEK = 7;
const THEMES = ["Github", "Loto", "tiktok", "cream", "lavander", "Matcha", "Midnight", "Peach", "Soft Lavender", "Sakura", "Vintage"];
const STORAGE_KEYS = {
  user: "github_user",
  token: "github_token",
  widgetSize: "widget_size",
  widgetLayout: "widget_layout"
};
const WIDGET_SIZES = {
  small: 0.8,
  medium: 0.9,
  large: 1
};
const WIDGET_LAYOUTS = ["horizontal", "vertical"];
const DEFAULT_PROFILE = {
  login: "codebysofiav",
  avatarUrl: "img/avatar.jpg"
};

let currentLevelCounts = [0, 0, 0, 0, 0];
let syncWindowSizeTimeout;

function getTauriWindowApi() {
  return window.__TAURI__?.window ?? null;
}

async function resizeAppWindow(size) {
  const tauriWindow = getTauriWindowApi();
  const appWindow = tauriWindow?.appWindow;
  const LogicalSize = tauriWindow?.LogicalSize;

  if (!appWindow || !LogicalSize) {
    return;
  }

  await appWindow.setSize(
    new LogicalSize(Math.ceil(size.width), Math.ceil(size.height))
  );
}

function formatDate(date) {
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatMonth(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", { month: "short" });
}

function toIsoDate(date) {
  return date.toISOString().split("T")[0];
}

function startOfWeek(date) {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  normalizedDate.setDate(normalizedDate.getDate() - normalizedDate.getDay());
  return normalizedDate;
}

function syncWindowSize() {
  if (!getTauriWindowApi()) {
    return;
  }

  window.clearTimeout(syncWindowSizeTimeout);

  syncWindowSizeTimeout = window.setTimeout(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const widgetRect = document.querySelector(".widget")?.getBoundingClientRect();
        const modalRect = !loginModal.hidden
          ? loginModalPanel?.getBoundingClientRect()
          : null;
        const floatingRects = [];
        const widgetMenuRect = !widgetMenu.hidden ? widgetMenu.getBoundingClientRect() : null;
        const framePadding = 28;

        if (widgetMenuRect) {
          floatingRects.push(widgetMenuRect);
        }

        document.querySelectorAll(".theme-submenu").forEach((submenu) => {
          const styles = window.getComputedStyle(submenu);

          if (styles.visibility !== "hidden" && styles.opacity !== "0") {
            floatingRects.push(submenu.getBoundingClientRect());
          }
        });

        const allRects = [widgetRect, modalRect, ...floatingRects].filter(Boolean);
        const minLeft = Math.min(...allRects.map((rect) => rect.left));
        const minTop = Math.min(...allRects.map((rect) => rect.top));
        const maxRight = Math.max(...allRects.map((rect) => rect.right));
        const maxBottom = Math.max(...allRects.map((rect) => rect.bottom));

        const width = (maxRight - minLeft) + (framePadding * 2);
        const height = (maxBottom - minTop) + (framePadding * 2);

        resizeAppWindow({
          width: Math.max(width, 620),
          height: Math.max(height, 300)
        }).catch((error) => {
          console.error("No se pudo redimensionar la ventana.", error);
        });
      });
    });
  }, 30);
}

function endOfWeek(date) {
  const normalizedDate = startOfWeek(date);
  normalizedDate.setDate(normalizedDate.getDate() + 6);
  return normalizedDate;
}

function subtractThreeMonths(date) {
  const result = new Date(date);
  result.setMonth(result.getMonth() - 3);
  result.setHours(0, 0, 0, 0);
  return result;
}

function normalizeContributions(rawContributions) {
  return rawContributions
    .map((item) => ({
      isoDate: item.date,
      count: item.count
    }))
    .sort((first, second) => new Date(first.isoDate) - new Date(second.isoDate));
}

function createThreeMonthContributions(rawContributions) {
  const contributionData = [];
  const normalizedContributions = normalizeContributions(rawContributions);
  const countsByDate = new Map(
    normalizedContributions.map((item) => [item.isoDate, item.count])
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rangeStart = subtractThreeMonths(today);
  const visibleStart = startOfWeek(rangeStart);
  const visibleEnd = endOfWeek(today);

  for (
    let currentDate = new Date(visibleStart);
    currentDate <= visibleEnd;
    currentDate.setDate(currentDate.getDate() + 1)
  ) {
    const dayDate = new Date(currentDate);
    const isoDate = toIsoDate(dayDate);
    const isInRange = dayDate >= rangeStart && dayDate <= today;
    const isFuture = dayDate > today;
    const count = isInRange ? (countsByDate.get(isoDate) ?? 0) : 0;

    contributionData.push({
      isoDate,
      date: formatDate(dayDate),
      count,
      isInRange,
      isFuture
    });
  }

  return contributionData;
}

function getMonthLabels(contributions, rowsPerColumn) {
  const labels = [];

  for (let index = 0; index < contributions.length; index += rowsPerColumn) {
    const day = contributions[index];

    if (!day.isInRange) {
      continue;
    }

    const month = formatMonth(day.isoDate);
    const lastMonth = labels[labels.length - 1];

    if (month !== lastMonth) {
      labels.push(month);
    }
  }

  return labels.slice(-3);
}

function renderMonths(contributions) {
  monthsContainer.innerHTML = "";
  const monthLabels = getMonthLabels(contributions, DAYS_PER_WEEK);

  monthLabels.forEach((month) => {
    const label = document.createElement("span");
    label.textContent = month;
    monthsContainer.appendChild(label);
  });
}

function getLevel(value) {
  if (value === 0) return 0;
  if (value <= 1) return 1;
  if (value <= 2) return 2;
  if (value <= 3) return 3;
  return 4;
}

function updateRing(levelCounts) {
  const totalDays = levelCounts.reduce((sum, count) => sum + count, 0);
  const gapDegrees = 4;
  let currentDegree = -90;
  const segments = [];
  const ringColor = getComputedStyle(document.body).getPropertyValue("--ring").trim() || "rgba(52, 29, 56, 0.96)";

  if (totalDays === 0) {
    contributionRing.style.background = `
      radial-gradient(closest-side, ${ringColor} 69%, transparent 70% 100%),
      conic-gradient(rgba(255, 255, 255, 0.12) 0deg 360deg)
    `;
    return;
  }

  levelCounts.forEach((count, level) => {
    if (count === 0) {
      return;
    }

    const segmentDegrees = (count / totalDays) * 360;
    const visibleDegrees = Math.max(segmentDegrees - gapDegrees, 2);
    const segmentStart = currentDegree;
    const segmentEnd = segmentStart + visibleDegrees;

    segments.push(`var(--level-${level}) ${segmentStart}deg ${segmentEnd}deg`);
    currentDegree += segmentDegrees;
  });

  contributionRing.style.background = `
    radial-gradient(closest-side, ${ringColor} 69%, transparent 70% 100%),
    conic-gradient(${segments.join(", ")})
  `;
}

function applyTheme(themeName) {
  document.body.dataset.theme = themeName;
  localStorage.setItem("theme", themeName);
  themeToggle.dataset.theme = themeName;
  themeToggle.setAttribute("aria-label", `Tema actual: ${themeName}. Abrir menu`);
  themeOptions.forEach((option) => {
    const isActive = option.dataset.theme === themeName;
    option.dataset.active = String(isActive);
    option.setAttribute("aria-pressed", String(isActive));
  });
  updateRing(currentLevelCounts);
}

function applyWidgetSize(sizeName) {
  const normalizedSize = WIDGET_SIZES[sizeName] ? sizeName : "small";
  document.body.dataset.widgetSize = normalizedSize;
  document.documentElement.style.setProperty("--widget-scale", String(WIDGET_SIZES[normalizedSize]));
  localStorage.setItem(STORAGE_KEYS.widgetSize, normalizedSize);

  sizeOptions.forEach((option) => {
    const isActive = option.dataset.size === normalizedSize;
    option.dataset.active = String(isActive);
    option.setAttribute("aria-pressed", String(isActive));
  });

  syncWindowSize();
}

function applyWidgetLayout(layoutName) {
  const normalizedLayout = WIDGET_LAYOUTS.includes(layoutName) ? layoutName : "horizontal";
  document.body.dataset.layout = normalizedLayout;
  localStorage.setItem(STORAGE_KEYS.widgetLayout, normalizedLayout);

  layoutOptions.forEach((option) => {
    const isActive = option.dataset.layout === normalizedLayout;
    option.dataset.active = String(isActive);
    option.setAttribute("aria-pressed", String(isActive));
  });

  syncWindowSize();
}

function toggleMenu(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : widgetMenu.hidden;
  widgetMenu.hidden = !shouldOpen;
  themeToggle.setAttribute("aria-expanded", String(shouldOpen));

  if (!shouldOpen) {
    closeSubmenus();
  }

  syncWindowSize();
}

function closeSubmenus(options = {}) {
  const { skipSync = false } = options;

  themeParents.forEach((parent) => {
    parent.dataset.open = "false";
  });

  themeParentToggles.forEach((toggle) => {
    toggle.setAttribute("aria-expanded", "false");
  });

  if (!skipSync) {
    syncWindowSize();
  }
}

function toggleSubmenu(toggleButton) {
  const parent = toggleButton.closest(".theme-parent");
  const willOpen = parent?.dataset.open !== "true";

  closeSubmenus({ skipSync: true });

  if (!parent || !willOpen) {
    syncWindowSize();
    return;
  }

  parent.dataset.open = "true";
  toggleButton.setAttribute("aria-expanded", "true");
  syncWindowSize();
}

function initWindowControls() {
  windowMinimize?.addEventListener("click", () => {
    const appWindow = getTauriWindowApi()?.appWindow;

    appWindow?.minimize().catch((error) => {
      console.error("No se pudo minimizar la ventana.", error);
    });
  });

  windowClose?.addEventListener("click", () => {
    const appWindow = getTauriWindowApi()?.appWindow;

    appWindow?.close().catch((error) => {
      console.error("No se pudo cerrar la ventana.", error);
    });
  });
}

function openLoginModal() {
  loginError.hidden = true;
  loginError.textContent = "";
  githubUsernameInput.value = localStorage.getItem(STORAGE_KEYS.user) ?? "";
  githubTokenInput.value = localStorage.getItem(STORAGE_KEYS.token) ?? "";
  loginModal.hidden = false;
  document.body.classList.add("modal-open");
  githubUsernameInput.focus();
  syncWindowSize();
}

function closeLoginModal() {
  loginModal.hidden = true;
  document.body.classList.remove("modal-open");
  syncWindowSize();
}

function showLoginError(message) {
  loginError.textContent = message;
  loginError.hidden = false;
  syncWindowSize();
}

function getStoredCredentials() {
  const username = localStorage.getItem(STORAGE_KEYS.user)?.trim();
  const token = localStorage.getItem(STORAGE_KEYS.token)?.trim();

  if (!username || !token) {
    return null;
  }

  return { username, token };
}

function saveCredentials(username, token) {
  localStorage.setItem(STORAGE_KEYS.user, username);
  localStorage.setItem(STORAGE_KEYS.token, token);
}

function clearCredentials() {
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.token);
}

function setConnectionState({ connected, login, avatarUrl, message }) {
  profileName.textContent = login || DEFAULT_PROFILE.login;
  connectionStatus.textContent = message;
  connectionStatus.dataset.connected = String(connected);
  profileAvatar.src = avatarUrl || DEFAULT_PROFILE.avatarUrl;
  profileAvatar.alt = connected
    ? `Avatar de ${login}`
    : "Avatar de GitHub";
  menuLogout.hidden = !connected;
}

function renderEmptyState() {
  const contributions = createThreeMonthContributions([]);
  renderMonths(contributions);
  renderGrid(contributions);
  syncWindowSize();
}

async function fetchGitHubProfile(username, token) {
  const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("No se pudo validar el usuario o el token en GitHub.");
  }

  const data = await response.json();
  return {
    login: data.login,
    avatarUrl: data.avatar_url
  };
}

async function fetchGitHubContributions(username, token) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fromDate = subtractThreeMonths(today);
  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query,
      variables: {
        login: username,
        from: fromDate.toISOString(),
        to: today.toISOString()
      }
    })
  });

  if (!response.ok) {
    throw new Error("No se pudieron cargar las contribuciones desde GitHub.");
  }

  const result = await response.json();

  if (result.errors?.length) {
    throw new Error(result.errors[0].message || "GitHub devolvio un error al consultar contribuciones.");
  }

  return (
    result.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? []
  )
    .flatMap((week) => week.contributionDays)
    .map((day) => ({
      date: day.date,
      count: day.contributionCount
    }));
}

async function loadContributions(credentials) {
  if (!credentials) {
    return [];
  }

  return fetchGitHubContributions(credentials.username, credentials.token);
}

function renderGrid(contributions) {
  grid.innerHTML = "";
  let total = 0;
  const levelCounts = [0, 0, 0, 0, 0];

  contributions.forEach((day) => {
    if (day.isInRange) {
      total += day.count;
    }

    const cell = document.createElement("div");
    const level = getLevel(day.count);

    if (day.isInRange) {
      levelCounts[level] += 1;
    }

    cell.className = `cell level-${level}`;
    cell.title = day.isInRange
      ? `${day.count} contribuciones, ${day.date}`
      : day.isFuture
        ? day.date
        : `${day.date} fuera del rango de 3 meses`;

    grid.appendChild(cell);
  });

  currentLevelCounts = levelCounts;
  totalCount.textContent = total;
  updateRing(levelCounts);
  syncWindowSize();
}

async function refreshWidget(options = {}) {
  const { throwOnError = false } = options;
  const credentials = getStoredCredentials();

  if (!credentials) {
    setConnectionState({
      connected: false,
      login: DEFAULT_PROFILE.login,
      avatarUrl: DEFAULT_PROFILE.avatarUrl,
      message: "Not connected"
    });
    renderEmptyState();
    return;
  }

  setConnectionState({
    connected: true,
    login: credentials.username,
    avatarUrl: DEFAULT_PROFILE.avatarUrl,
    message: "Connecting..."
  });

  try {
    const [profile, rawContributions] = await Promise.all([
      fetchGitHubProfile(credentials.username, credentials.token),
      loadContributions(credentials)
    ]);
    const contributions = createThreeMonthContributions(rawContributions);
    saveCredentials(profile.login, credentials.token);

    setConnectionState({
      connected: true,
      login: profile.login,
      avatarUrl: profile.avatarUrl,
      message: "Connected"
    });
    renderMonths(contributions);
    renderGrid(contributions);
  } catch (error) {
    clearCredentials();
    setConnectionState({
      connected: false,
      login: DEFAULT_PROFILE.login,
      avatarUrl: DEFAULT_PROFILE.avatarUrl,
      message: "Not connected"
    });
    renderEmptyState();

    if (throwOnError) {
      throw error;
    }
  }
}

function initThemeToggle() {
  const savedTheme = localStorage.getItem("theme");
  const initialTheme = THEMES.includes(savedTheme) ? savedTheme : THEMES[0];
  const savedWidgetSize = localStorage.getItem(STORAGE_KEYS.widgetSize);
  const savedWidgetLayout = localStorage.getItem(STORAGE_KEYS.widgetLayout);

  applyTheme(initialTheme);
  applyWidgetSize(savedWidgetSize);
  applyWidgetLayout(savedWidgetLayout);

  themeToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu();
  });

  themeOptions.forEach((option) => {
    option.addEventListener("click", () => {
      applyTheme(option.dataset.theme);
      closeSubmenus();
    });
  });

  sizeOptions.forEach((option) => {
    option.addEventListener("click", () => {
      applyWidgetSize(option.dataset.size);
      closeSubmenus();
    });
  });

  layoutOptions.forEach((option) => {
    option.addEventListener("click", () => {
      applyWidgetLayout(option.dataset.layout);
      closeSubmenus();
    });
  });

  themeParentToggles.forEach((toggle) => {
    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleSubmenu(toggle);
    });
  });

  menuRefresh.addEventListener("click", () => {
    refreshWidget().catch((error) => {
      console.error(error);
    });
    toggleMenu(false);
  });

  menuLogin.addEventListener("click", () => {
    openLoginModal();
    toggleMenu(false);
  });

  menuLogout.addEventListener("click", () => {
    clearCredentials();
    closeLoginModal();
    refreshWidget().catch((error) => {
      console.error(error);
    });
    toggleMenu(false);
  });

  loginModalClose.addEventListener("click", closeLoginModal);

  loginModal.addEventListener("click", (event) => {
    if (event.target.dataset.closeModal === "true") {
      closeLoginModal();
    }
  });

  loginConnect.addEventListener("click", async () => {
    const username = githubUsernameInput.value.trim();
    const token = githubTokenInput.value.trim();

    if (!username || !token) {
      showLoginError("Completa el username y el personal access token.");
      return;
    }

    loginConnect.disabled = true;
    loginConnect.textContent = "Connecting...";
    loginError.hidden = true;

    try {
      saveCredentials(username, token);
      await refreshWidget({ throwOnError: true });
      closeLoginModal();
    } catch (error) {
      showLoginError(error.message);
    } finally {
      loginConnect.disabled = false;
      loginConnect.textContent = "Connect";
    }
  });

  [githubUsernameInput, githubTokenInput].forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        loginConnect.click();
      }
    });
  });

  widgetMenu.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", (event) => {
    if (!widgetMenu.hidden && !event.target.closest(".menu-wrapper")) {
      toggleMenu(false);
      return;
    }

    if (!event.target.closest(".theme-parent")) {
      closeSubmenus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!loginModal.hidden) {
        closeLoginModal();
      }

      if (!widgetMenu.hidden) {
        toggleMenu(false);
      }
    }
  });
}

async function initWidget() {
  try {
    initWindowControls();
    initThemeToggle();
    await refreshWidget();
  } catch (error) {
    console.error("No se pudo inicializar el widget.", error);
    totalCount.textContent = "!";
    monthsContainer.innerHTML = "<span>error</span>";
    grid.innerHTML = "";
  }
}

initWidget();
