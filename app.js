const DB_NAME = "private-todo-memo";
const DB_VERSION = 1;
const SETTINGS_KEY = "todoMemoSettings";

const themes = [
  { id: "sage", name: "Sage", bg: "#ffffff", surface: "#ffffff", text: "#202124", muted: "#7a7d82", primary: "#4f8f7b", strong: "#28725f" },
  { id: "coral", name: "Coral", bg: "#fff7f4", surface: "#ffffff", text: "#2c2422", muted: "#7a6863", primary: "#e97864", strong: "#c65344" },
  { id: "sky", name: "Sky", bg: "#f2f8fb", surface: "#ffffff", text: "#202832", muted: "#657383", primary: "#4b93c6", strong: "#276b9b" },
  { id: "olive", name: "Olive", bg: "#f6f7ed", surface: "#ffffff", text: "#24281f", muted: "#6b715f", primary: "#839a45", strong: "#61752d" },
  { id: "rose", name: "Rose", bg: "#fff5f8", surface: "#ffffff", text: "#2d2228", muted: "#806772", primary: "#d7638a", strong: "#ad3f68" },
  { id: "indigo", name: "Indigo", bg: "#f5f6ff", surface: "#ffffff", text: "#232438", muted: "#686b84", primary: "#6976d9", strong: "#4350b7" },
  { id: "strawberry", name: "Strawberry", bg: "#fff7fa", surface: "#ffffff", text: "#2d2328", muted: "#806b73", primary: "#f08daf", strong: "#d8628c" },
  { id: "plum", name: "Plum", bg: "#fbf5fb", surface: "#ffffff", text: "#2b2330", muted: "#77677c", primary: "#9869b7", strong: "#704991" },
  { id: "amber", name: "Amber", bg: "#fff8ea", surface: "#ffffff", text: "#2d281d", muted: "#756a54", primary: "#d4933b", strong: "#a96a1b" },
  { id: "dark", name: "Dark", bg: "#151718", surface: "#252a2d", text: "#f0f3f2", muted: "#a4aba8", primary: "#7bb8ff", strong: "#a8d0ff" }
];

const fontOptions = [
  { id: "pretendard", name: "Pretendard", family: "\"Pretendard\"" },
  { id: "bookk", name: "부크크 명조", family: "\"Bookk Myungjo\"" },
  { id: "griun", name: "그리운 묘은또박", family: "\"Griun Myoeunddobak\"" },
  { id: "kyobo", name: "교보 손글씨", family: "\"Kyobo Handwriting\"" }
];

const defaultSettings = {
  theme: "sage",
  font: "pretendard",
  calendarMode: "week",
  weekStart: "monday",
  completePosition: "stay"
};

const state = {
  db: null,
  settings: loadSettings(),
  selectedDate: startOfDay(new Date()),
  todos: [],
  openTodoMenuId: null,
  draggedId: null,
  pointerDrag: null,
  calendarSwipe: null,
  suppressDateClick: false,
  editingTodo: null,
  memoSaveTimer: null
};

const els = {
  body: document.body,
  banner: document.getElementById("banner"),
  bannerMenuButton: document.getElementById("bannerMenuButton"),
  bannerMenu: document.getElementById("bannerMenu"),
  useThemeBanner: document.getElementById("useThemeBanner"),
  chooseBannerPhoto: document.getElementById("chooseBannerPhoto"),
  bannerFileInput: document.getElementById("bannerFileInput"),
  todayJumpButton: document.getElementById("todayJumpButton"),
  bannerDateShort: document.getElementById("bannerDateShort"),
  todoCountText: document.getElementById("todoCountText"),
  doneCountText: document.getElementById("doneCountText"),
  selectedDateText: document.getElementById("selectedDateText"),
  calendarModeButton: document.getElementById("calendarModeButton"),
  weekdayRow: document.getElementById("weekdayRow"),
  dateGrid: document.getElementById("dateGrid"),
  previousPeriod: document.getElementById("previousPeriod"),
  nextPeriod: document.getElementById("nextPeriod"),
  todoForm: document.getElementById("todoForm"),
  todoInput: document.getElementById("todoInput"),
  todoList: document.getElementById("todoList"),
  memoText: document.getElementById("memoText"),
  clearMemoButton: document.getElementById("clearMemoButton"),
  confirmDialog: document.getElementById("confirmDialog"),
  cancelMemoClear: document.getElementById("cancelMemoClear"),
  confirmMemoClear: document.getElementById("confirmMemoClear"),
  editTodoDialog: document.getElementById("editTodoDialog"),
  editTodoInput: document.getElementById("editTodoInput"),
  cancelTodoEdit: document.getElementById("cancelTodoEdit"),
  confirmTodoEdit: document.getElementById("confirmTodoEdit"),
  themeGrid: document.getElementById("themeGrid"),
  fontList: document.getElementById("fontList"),
  todoMenuTemplate: document.getElementById("todoMenuTemplate")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  state.db = await openDb();
  applyTheme();
  applyFont();
  renderThemeOptions();
  renderFontOptions();
  bindEvents();
  await loadBanner();
  await loadTodosForSelectedDate();
  await loadMemo();
  renderAll();
  registerServiceWorker();
}

function bindEvents() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });

  els.bannerMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    els.bannerMenu.hidden = !els.bannerMenu.hidden;
  });

  els.useThemeBanner.addEventListener("click", async () => {
    await deleteRecord("assets", "banner");
    els.banner.style.backgroundImage = "";
    els.banner.classList.remove("has-photo");
    els.bannerMenu.hidden = true;
  });

  els.chooseBannerPhoto.addEventListener("click", () => {
    els.bannerMenu.hidden = true;
    els.bannerFileInput.click();
  });

  els.bannerFileInput.addEventListener("change", handleBannerFile);
  els.todayJumpButton.addEventListener("click", jumpToToday);
  els.calendarModeButton.addEventListener("click", toggleCalendarMode);
  els.previousPeriod.addEventListener("click", () => movePeriod(-1));
  els.nextPeriod.addEventListener("click", () => movePeriod(1));
  [els.weekdayRow, els.dateGrid].forEach((element) => {
    element.addEventListener("pointerdown", startCalendarSwipe);
    element.addEventListener("pointermove", moveCalendarSwipe);
    element.addEventListener("pointerup", finishCalendarSwipe);
    element.addEventListener("pointercancel", cancelCalendarSwipe);
  });
  els.dateGrid.addEventListener("click", (event) => {
    if (state.suppressDateClick) {
      event.preventDefault();
      event.stopPropagation();
      state.suppressDateClick = false;
    }
  }, true);
  els.todoForm.addEventListener("submit", addTodo);
  els.todoInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.isComposing) {
      event.preventDefault();
      els.todoForm.requestSubmit();
    }
  });
  els.clearMemoButton.addEventListener("click", () => {
    els.confirmDialog.hidden = false;
  });
  els.cancelMemoClear.addEventListener("click", () => {
    els.confirmDialog.hidden = true;
  });
  els.confirmMemoClear.addEventListener("click", clearMemo);
  els.memoText.addEventListener("input", scheduleMemoSave);
  els.memoText.addEventListener("blur", flushMemoSave);
  window.addEventListener("beforeunload", flushMemoSave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushMemoSave();
    }
  });
  els.cancelTodoEdit.addEventListener("click", closeEditTodoDialog);
  els.confirmTodoEdit.addEventListener("click", saveEditedTodo);
  els.editTodoInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      saveEditedTodo();
    }
    if (event.key === "Escape") {
      closeEditTodoDialog();
    }
  });

  document.querySelectorAll("[data-week-start]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.settings.weekStart = button.dataset.weekStart;
      saveSettings();
      renderCalendar();
      renderSettingsButtons();
    });
  });

  document.querySelectorAll("[data-complete-position]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.settings.completePosition = button.dataset.completePosition;
      saveSettings();
      await loadTodosForSelectedDate();
      renderTodoList();
      renderSettingsButtons();
    });
  });

  document.addEventListener("click", () => {
    closeTodoMenus();
    els.bannerMenu.hidden = true;
  });
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });
}

function renderAll() {
  renderCalendar();
  renderTodoList();
  renderSettingsButtons();
}

function renderCalendar() {
  els.selectedDateText.textContent = formatKoreanDate(state.selectedDate);
  els.bannerDateShort.textContent = formatBannerDate(new Date());
  els.calendarModeButton.textContent = state.settings.calendarMode;
  els.dateGrid.className = `date-grid ${state.settings.calendarMode}-grid`;
  renderWeekdays();
  renderDates();
  renderTodoStats();
}

async function jumpToToday() {
  state.selectedDate = startOfDay(new Date());
  await loadTodosForSelectedDate();
  renderCalendar();
  renderTodoList();
}

function renderWeekdays() {
  const days = state.settings.weekStart === "sunday"
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : ["월", "화", "수", "목", "금", "토", "일"];
  els.weekdayRow.innerHTML = days.map((day) => `<span>${day}</span>`).join("");
}

function renderDates() {
  const dates = state.settings.calendarMode === "week"
    ? getWeekDates(state.selectedDate)
    : getMonthDates(state.selectedDate);
  const todayKey = toDateKey(new Date());
  const selectedKey = toDateKey(state.selectedDate);
  els.dateGrid.innerHTML = "";

  dates.forEach((date) => {
    if (!date) {
      const empty = document.createElement("span");
      empty.className = "date-cell empty";
      els.dateGrid.appendChild(empty);
      return;
    }
    const key = toDateKey(date);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "date-cell";
    button.textContent = date.getDate();
    button.classList.toggle("today", key === todayKey);
    button.classList.toggle("selected", key === selectedKey);
    button.addEventListener("click", async () => {
      state.selectedDate = startOfDay(date);
      await loadTodosForSelectedDate();
      renderCalendar();
      renderTodoList();
    });
    els.dateGrid.appendChild(button);
  });
}

function getWeekDates(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function getMonthDates(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const leading = daysFromWeekStart(first);
  const dates = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= last.getDate(); day += 1) {
    dates.push(new Date(year, month, day));
  }
  return dates;
}

function toggleCalendarMode() {
  state.settings.calendarMode = state.settings.calendarMode === "week" ? "month" : "week";
  saveSettings();
  renderCalendar();
}

function movePeriod(direction) {
  const next = new Date(state.selectedDate);
  if (state.settings.calendarMode === "week") {
    next.setDate(next.getDate() + direction * 7);
  } else {
    next.setMonth(next.getMonth() + direction);
  }
  state.selectedDate = startOfDay(next);
  loadTodosForSelectedDate().then(() => {
    renderCalendar();
    renderTodoList();
  });
}

function startCalendarSwipe(event) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  state.calendarSwipe = {
    id: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    startedAt: performance.now(),
    swiping: false
  };
}

function moveCalendarSwipe(event) {
  const swipe = state.calendarSwipe;
  if (!swipe || swipe.id !== event.pointerId) return;
  swipe.lastX = event.clientX;
  swipe.lastY = event.clientY;
  const dx = swipe.lastX - swipe.startX;
  const dy = swipe.lastY - swipe.startY;
  if (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.4) {
    swipe.swiping = true;
  }
}

function finishCalendarSwipe(event) {
  const swipe = state.calendarSwipe;
  if (!swipe || swipe.id !== event.pointerId) return;
  const dx = event.clientX - swipe.startX;
  const dy = event.clientY - swipe.startY;
  const elapsed = Math.max(performance.now() - swipe.startedAt, 1);
  const speed = Math.abs(dx) / elapsed;
  const isSwipe = swipe.swiping && Math.abs(dx) >= 58 && Math.abs(dx) > Math.abs(dy) * 1.6 && speed >= 0.22;
  state.calendarSwipe = null;
  if (!isSwipe) return;

  state.suppressDateClick = true;
  window.setTimeout(() => {
    state.suppressDateClick = false;
  }, 0);
  movePeriod(dx < 0 ? 1 : -1);
}

function cancelCalendarSwipe(event) {
  if (state.calendarSwipe?.id === event.pointerId) {
    state.calendarSwipe = null;
  }
}

async function loadTodosForSelectedDate() {
  const dateKey = toDateKey(state.selectedDate);
  const all = await getAllFromIndex("todos", "date", dateKey);
  state.todos = sortTodos(all);
}

function sortTodos(todos) {
  const ordered = [...todos].sort((a, b) => a.order - b.order);
  if (state.settings.completePosition !== "bottom") {
    return ordered;
  }
  return ordered.sort((a, b) => {
    const aDone = a.done ? 1 : 0;
    const bDone = b.done ? 1 : 0;
    return aDone - bDone || a.order - b.order;
  });
}

async function addTodo(event) {
  event.preventDefault();
  const text = els.todoInput.value.trim();
  if (!text) {
    els.todoInput.focus();
    return;
  }

  const dateKey = toDateKey(state.selectedDate);
  const maxOrder = state.todos.reduce((max, todo) => Math.max(max, todo.order), 0);
  const todo = {
    id: crypto.randomUUID(),
    date: dateKey,
    text,
    done: false,
    cancelled: false,
    order: maxOrder + 1,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await putRecord("todos", todo);
  els.todoInput.value = "";
  await loadTodosForSelectedDate();
  renderTodoList();
  requestAnimationFrame(() => els.todoInput.focus());
}

function renderTodoList() {
  closeTodoMenus();
  els.todoList.innerHTML = "";
  renderTodoStats();
  if (state.todos.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-list";
    empty.textContent = " ";
    els.todoList.appendChild(empty);
    return;
  }

  state.todos.forEach((todo) => {
    const item = document.createElement("article");
    item.className = "todo-item";
    item.classList.toggle("done", todo.done);
    item.classList.toggle("cancelled", todo.cancelled);
    item.draggable = true;
    item.dataset.id = todo.id;

    const check = document.createElement("button");
    check.className = "check-button";
    check.type = "button";
    check.setAttribute("aria-label", "완료");
    check.addEventListener("click", () => toggleTodoDone(todo));

    const text = document.createElement("div");
    text.className = "todo-text";
    text.textContent = todo.text;

    const drag = document.createElement("button");
    drag.className = "drag-button";
    drag.type = "button";
    drag.textContent = "≡";
    drag.setAttribute("aria-label", "순서 변경");
    drag.addEventListener("pointerdown", (event) => startPointerReorder(event, item));

    const menu = document.createElement("button");
    menu.className = "menu-dot-button";
    menu.type = "button";
    menu.textContent = "⋯";
    menu.setAttribute("aria-label", "메뉴");
    menu.addEventListener("click", (event) => {
      event.stopPropagation();
      openTodoMenu(item, todo);
    });

    item.addEventListener("dragstart", handleDragStart);
    item.addEventListener("dragover", handleDragOver);
    item.addEventListener("drop", handleDrop);
    item.addEventListener("dragend", handleDragEnd);

    item.append(check, text, drag, menu);
    els.todoList.appendChild(item);
  });
}

async function toggleTodoDone(todo) {
  todo.done = !todo.done;
  todo.cancelled = false;
  todo.updatedAt = Date.now();
  await putRecord("todos", todo);
  await loadTodosForSelectedDate();
  renderTodoList();
}

function renderTodoStats() {
  const total = state.todos.length;
  const done = state.todos.filter((todo) => todo.done).length;
  els.todoCountText.textContent = `${total}개`;
  els.doneCountText.textContent = `완료 ${done}`;
}

function openTodoMenu(item, todo) {
  closeTodoMenus();
  const menu = els.todoMenuTemplate.content.firstElementChild.cloneNode(true);
  const releaseButton = document.createElement("button");
  releaseButton.type = "button";
  releaseButton.dataset.action = "release";
  releaseButton.textContent = "풀기";
  releaseButton.hidden = !todo.done && !todo.cancelled;
  menu.appendChild(releaseButton);
  menu.addEventListener("click", async (event) => {
    event.stopPropagation();
    const action = event.target.dataset.action;
    if (!action) return;
    if (action === "edit") {
      openEditTodoDialog(todo);
      return;
    }
    if (action === "delete") {
      await deleteRecord("todos", todo.id);
    }
    if (action === "cancel") {
      todo.cancelled = true;
      todo.done = false;
      todo.updatedAt = Date.now();
      await putRecord("todos", todo);
    }
    if (action === "release") {
      todo.cancelled = false;
      todo.done = false;
      todo.updatedAt = Date.now();
      await putRecord("todos", todo);
    }
    await loadTodosForSelectedDate();
    renderTodoList();
  });
  item.appendChild(menu);
}

function openEditTodoDialog(todo) {
  state.editingTodo = { ...todo };
  els.editTodoInput.value = todo.text;
  els.editTodoDialog.hidden = false;
  requestAnimationFrame(() => {
    els.editTodoInput.focus();
    const end = els.editTodoInput.value.length;
    els.editTodoInput.setSelectionRange(end, end);
  });
}

function closeEditTodoDialog() {
  state.editingTodo = null;
  els.editTodoDialog.hidden = true;
}

async function saveEditedTodo() {
  if (!state.editingTodo) return;
  const text = els.editTodoInput.value.trim();
  if (!text) {
    els.editTodoInput.focus();
    return;
  }
  const todo = { ...state.editingTodo, text, updatedAt: Date.now() };
  await putRecord("todos", todo);
  closeEditTodoDialog();
  await loadTodosForSelectedDate();
  renderTodoList();
}

function closeTodoMenus() {
  document.querySelectorAll(".todo-menu").forEach((menu) => menu.remove());
}

function handleDragStart(event) {
  state.draggedId = event.currentTarget.dataset.id;
  event.currentTarget.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

async function handleDrop(event) {
  event.preventDefault();
  const targetId = event.currentTarget.dataset.id;
  if (!state.draggedId || state.draggedId === targetId) return;
  const current = state.todos.map((todo) => todo.id);
  const from = current.indexOf(state.draggedId);
  const to = current.indexOf(targetId);
  current.splice(to, 0, current.splice(from, 1)[0]);
  await persistTodoOrder(current);
  await loadTodosForSelectedDate();
  renderTodoList();
}

function handleDragEnd(event) {
  event.currentTarget.classList.remove("dragging");
  state.draggedId = null;
}

function startPointerReorder(event, item) {
  if (event.button !== 0) return;
  event.preventDefault();
  closeTodoMenus();
  state.pointerDrag = { item, id: item.dataset.id };
  item.classList.add("dragging");
  item.setPointerCapture?.(event.pointerId);
  document.addEventListener("pointermove", movePointerReorder);
  document.addEventListener("pointerup", finishPointerReorder, { once: true });
  document.addEventListener("pointercancel", cancelPointerReorder, { once: true });
}

function movePointerReorder(event) {
  const dragState = state.pointerDrag;
  if (!dragState) return;
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".todo-item");
  if (!target || target === dragState.item || !els.todoList.contains(target)) return;
  const rect = target.getBoundingClientRect();
  const after = event.clientY > rect.top + rect.height / 2;
  els.todoList.insertBefore(dragState.item, after ? target.nextSibling : target);
}

async function finishPointerReorder() {
  const dragState = state.pointerDrag;
  if (!dragState) return;
  dragState.item.classList.remove("dragging");
  const ids = [...els.todoList.querySelectorAll(".todo-item")].map((item) => item.dataset.id);
  state.pointerDrag = null;
  document.removeEventListener("pointermove", movePointerReorder);
  await persistTodoOrder(ids);
  await loadTodosForSelectedDate();
  renderTodoList();
}

function cancelPointerReorder() {
  const dragState = state.pointerDrag;
  if (dragState) {
    dragState.item.classList.remove("dragging");
  }
  state.pointerDrag = null;
  document.removeEventListener("pointermove", movePointerReorder);
  renderTodoList();
}

async function persistTodoOrder(ids) {
  const byId = new Map(state.todos.map((todo) => [todo.id, todo]));
  await Promise.all(ids.map((id, index) => {
    const todo = byId.get(id);
    todo.order = index + 1;
    todo.updatedAt = Date.now();
    return putRecord("todos", todo);
  }));
}

async function loadMemo() {
  const memo = await getRecord("memo", "main");
  els.memoText.value = memo?.text || "";
}

function scheduleMemoSave() {
  window.clearTimeout(state.memoSaveTimer);
  state.memoSaveTimer = window.setTimeout(() => {
    putRecord("memo", { id: "main", text: els.memoText.value, updatedAt: Date.now() });
  }, 350);
}

function flushMemoSave() {
  window.clearTimeout(state.memoSaveTimer);
  if (state.db) {
    putRecord("memo", { id: "main", text: els.memoText.value, updatedAt: Date.now() });
  }
}

async function clearMemo() {
  els.memoText.value = "";
  await putRecord("memo", { id: "main", text: "", updatedAt: Date.now() });
  els.confirmDialog.hidden = true;
}

async function handleBannerFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const dataUrl = await readFileAsDataUrl(file);
  await putRecord("assets", { id: "banner", dataUrl, name: file.name, updatedAt: Date.now() });
  applyBannerImage(dataUrl);
  event.target.value = "";
}

async function loadBanner() {
  const banner = await getRecord("assets", "banner");
  if (banner?.dataUrl) {
    applyBannerImage(banner.dataUrl);
  }
}

function applyBannerImage(dataUrl) {
  els.banner.style.backgroundImage = `url("${dataUrl}")`;
  els.banner.classList.add("has-photo");
}

function renderThemeOptions() {
  els.themeGrid.innerHTML = "";
  themes.forEach((theme) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-option";
    button.title = theme.name;
    button.style.setProperty("--swatch", `linear-gradient(135deg, ${theme.primary}, ${theme.strong})`);
    button.addEventListener("click", () => {
      state.settings.theme = theme.id;
      saveSettings();
      applyTheme();
      renderSettingsButtons();
    });
    els.themeGrid.appendChild(button);
  });
}

function renderFontOptions() {
  els.fontList.innerHTML = "";
  fontOptions.forEach((font) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "font-option";
    button.textContent = font.name;
    button.style.fontFamily = `${font.family}, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    button.addEventListener("click", () => {
      state.settings.font = font.id;
      saveSettings();
      applyFont();
      renderSettingsButtons();
    });
    els.fontList.appendChild(button);
  });
}

function renderSettingsButtons() {
  document.querySelectorAll(".theme-option").forEach((button, index) => {
    button.classList.toggle("active", themes[index].id === state.settings.theme);
  });
  document.querySelectorAll(".font-option").forEach((button, index) => {
    button.classList.toggle("active", fontOptions[index].id === state.settings.font);
  });
  document.querySelectorAll("[data-week-start]").forEach((button) => {
    button.classList.toggle("active", button.dataset.weekStart === state.settings.weekStart);
  });
  document.querySelectorAll("[data-complete-position]").forEach((button) => {
    button.classList.toggle("active", button.dataset.completePosition === state.settings.completePosition);
  });
}

function applyTheme() {
  const theme = themes.find((item) => item.id === state.settings.theme) || themes[0];
  document.body.classList.toggle("theme-dark", theme.id === "dark");
  document.documentElement.style.setProperty("--bg", theme.bg);
  document.documentElement.style.setProperty("--surface", theme.id === "dark" ? "#1d2422" : "#f6f7f6");
  document.documentElement.style.setProperty("--surface-strong", theme.surface);
  document.documentElement.style.setProperty("--text", theme.text);
  document.documentElement.style.setProperty("--muted", theme.muted);
  document.documentElement.style.setProperty("--primary", theme.primary);
  document.documentElement.style.setProperty("--primary-strong", theme.strong);
  document.querySelector('meta[name="theme-color"]').setAttribute("content", theme.primary);
}

function applyFont() {
  const font = fontOptions.find((item) => item.id === state.settings.font) || fontOptions[0];
  document.documentElement.style.setProperty("--app-font", font.family);
}

function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("todos")) {
        const store = db.createObjectStore("todos", { keyPath: "id" });
        store.createIndex("date", "date", { unique: false });
      }
      if (!db.objectStoreNames.contains("memo")) {
        db.createObjectStore("memo", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("assets")) {
        db.createObjectStore("assets", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transaction(storeName, mode = "readonly") {
  return state.db.transaction(storeName, mode).objectStore(storeName);
}

function putRecord(storeName, record) {
  return requestToPromise(transaction(storeName, "readwrite").put(record));
}

function getRecord(storeName, key) {
  return requestToPromise(transaction(storeName).get(key));
}

function deleteRecord(storeName, key) {
  return requestToPromise(transaction(storeName, "readwrite").delete(key));
}

function getAllFromIndex(storeName, indexName, key) {
  return requestToPromise(transaction(storeName).index(indexName).getAll(key));
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date) {
  const day = date.getDay();
  const offset = state.settings.weekStart === "sunday" ? day : (day + 6) % 7;
  return addDays(startOfDay(date), -offset);
}

function daysFromWeekStart(date) {
  const day = date.getDay();
  return state.settings.weekStart === "sunday" ? day : (day + 6) % 7;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatKoreanDate(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatBannerDate(date) {
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekdays[date.getDay()]}요일`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
