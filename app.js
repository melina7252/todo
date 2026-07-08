const DB_NAME = "private-todo-memo";
const DB_VERSION = 1;
const SETTINGS_KEY = "todoMemoSettings";

const themes = [
  { id: "bold-blue", name: "Blue", bg: "#ffffff", surface: "#ffffff", surfaceSoft: "#ffffff", text: "#1f2933", muted: "#747d88", primary: "#5B7FA6", strong: "#426487" },
  { id: "bold-green", name: "Green", bg: "#ffffff", surface: "#ffffff", surfaceSoft: "#ffffff", text: "#1f2933", muted: "#747d88", primary: "#6F9277", strong: "#55765F" },
  { id: "bold-rose", name: "Rose", bg: "#ffffff", surface: "#ffffff", surfaceSoft: "#ffffff", text: "#1f2933", muted: "#747d88", primary: "#C9878C", strong: "#A86A70" },
  { id: "bold-violet", name: "Violet", bg: "#ffffff", surface: "#ffffff", surfaceSoft: "#ffffff", text: "#1f2933", muted: "#747d88", primary: "#82749D", strong: "#6A5D83" },
  { id: "bold-slate", name: "Slate", bg: "#ffffff", surface: "#ffffff", surfaceSoft: "#ffffff", text: "#1f2933", muted: "#747d88", primary: "#6B7888", strong: "#536171" },
  { id: "cute-pink", name: "Pink", bg: "#ffffff", surface: "#ffffff", surfaceSoft: "#ffffff", text: "#1f2933", muted: "#747d88", primary: "#F0C7D0", strong: "#B8737E", soft: true },
  { id: "cute-peach", name: "Peach", bg: "#ffffff", surface: "#ffffff", surfaceSoft: "#ffffff", text: "#1f2933", muted: "#747d88", primary: "#F1D0B5", strong: "#B9835D", soft: true },
  { id: "cute-mint", name: "Mint", bg: "#ffffff", surface: "#ffffff", surfaceSoft: "#ffffff", text: "#1f2933", muted: "#747d88", primary: "#C8E4D4", strong: "#719B80", soft: true },
  { id: "cute-sky", name: "Sky", bg: "#ffffff", surface: "#ffffff", surfaceSoft: "#ffffff", text: "#1f2933", muted: "#747d88", primary: "#C7DCEB", strong: "#6F94AD", soft: true },
  { id: "cute-lavender", name: "Lavender", bg: "#ffffff", surface: "#ffffff", surfaceSoft: "#ffffff", text: "#1f2933", muted: "#747d88", primary: "#D8CBE7", strong: "#8B78A4", soft: true },
  { id: "dark-black", name: "Black", bg: "#000000", surface: "#141414", text: "#f2f4f6", muted: "#a6adb5", primary: "#7F9DBF", strong: "#B5C7DC", dark: true },
  { id: "dark-slate", name: "Slate", bg: "#151B23", surface: "#202936", text: "#f2f4f6", muted: "#a6adb5", primary: "#8F9DB5", strong: "#C2CAD8", dark: true },
  { id: "dark-navy", name: "Navy", bg: "#101927", surface: "#182538", text: "#f2f4f6", muted: "#a6adb5", primary: "#7DAAC4", strong: "#B7D4E4", dark: true },
  { id: "dark-forest", name: "Forest", bg: "#10221C", surface: "#1B3028", text: "#f2f4f6", muted: "#a6b5ad", primary: "#86B49B", strong: "#C1D9CB", dark: true },
  { id: "dark-plum", name: "Plum", bg: "#1D1726", surface: "#2B2336", text: "#f2f4f6", muted: "#afa6ba", primary: "#A995BD", strong: "#D4C8E0", dark: true }
];

const fontOptions = [
  { id: "pretendard", name: "Pretendard", family: "\"Pretendard\"" },
  { id: "bareun", name: "바른바탕체", family: "\"Bareun Batang\"" },
  { id: "griun", name: "그리운 묘은또박", family: "\"Griun Myoeunddobak\"" },
  { id: "kcc", name: "KCC 임권택체", family: "\"KCC Imkwontaek\"" }
];

const defaultSettings = {
  theme: "bold-blue",
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
  reorderPress: null,
  calendarSwipe: null,
  scrollTouchY: 0,
  suppressDateClick: false,
  editingTodo: null,
  memoSaveTimer: null
};

const els = {
  body: document.body,
  screen: document.querySelector(".screen"),
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
  exportBackupButton: document.getElementById("exportBackupButton"),
  importBackupButton: document.getElementById("importBackupButton"),
  backupFileInput: document.getElementById("backupFileInput"),
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

  els.screen.addEventListener("touchstart", handleScrollBoundaryStart, { passive: true });
  els.screen.addEventListener("touchmove", handleScrollBoundaryMove, { passive: false });

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
  els.exportBackupButton.addEventListener("click", exportTodoMemoBackup);
  els.importBackupButton.addEventListener("click", () => els.backupFileInput.click());
  els.backupFileInput.addEventListener("change", importTodoMemoBackup);
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

function handleScrollBoundaryStart(event) {
  if (event.touches.length !== 1) return;
  state.scrollTouchY = event.touches[0].clientY;
}

function handleScrollBoundaryMove(event) {
  if (event.touches.length !== 1) return;
  const currentY = event.touches[0].clientY;
  const deltaY = currentY - state.scrollTouchY;
  state.scrollTouchY = currentY;
  const scroller = getBoundaryScroller(event.target);
  const maxScroll = scroller.scrollHeight - scroller.clientHeight;

  if (maxScroll <= 0) {
    event.preventDefault();
    return;
  }

  if ((scroller.scrollTop <= 0 && deltaY > 0) || (scroller.scrollTop >= maxScroll - 1 && deltaY < 0)) {
    event.preventDefault();
  }
}

function getBoundaryScroller(target) {
  let node = target;
  while (node && node !== els.screen) {
    if (node instanceof HTMLElement) {
      const style = window.getComputedStyle(node);
      const canScroll = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight;
      if (canScroll) return node;
    }
    node = node.parentElement;
  }
  return els.screen;
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
    item.draggable = false;
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
    drag.addEventListener("pointerdown", (event) => startPointerReorder(event, item, drag));

    const menu = document.createElement("button");
    menu.className = "menu-dot-button";
    menu.type = "button";
    menu.textContent = "⋯";
    menu.setAttribute("aria-label", "메뉴");
    menu.addEventListener("click", (event) => {
      event.stopPropagation();
      openTodoMenu(item, todo);
    });

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

function startPointerReorder(event, item, handle) {
  if (event.button !== 0) return;
  closeTodoMenus();
  cancelPointerReorder({ rerender: false });
  state.reorderPress = {
    item,
    handle,
    id: item.dataset.id,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    timer: window.setTimeout(() => activatePointerReorder(), 360)
  };
  document.addEventListener("pointermove", movePointerReorder, { passive: false });
  document.addEventListener("pointerup", finishPointerReorder, { once: true });
  document.addEventListener("pointercancel", cancelPointerReorder, { once: true });
}

function movePointerReorder(event) {
  const pressState = state.reorderPress;
  if (pressState) {
    if (pressState.pointerId !== event.pointerId) return;
    const dx = event.clientX - pressState.startX;
    const dy = event.clientY - pressState.startY;
    if (Math.hypot(dx, dy) > 10) {
      cancelPointerReorder({ rerender: false });
    }
    return;
  }

  const dragState = state.pointerDrag;
  if (!dragState) return;
  if (dragState.pointerId !== event.pointerId) return;
  event.preventDefault();
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".todo-item");
  if (!target || target === dragState.item || !els.todoList.contains(target)) return;
  const rect = target.getBoundingClientRect();
  const after = event.clientY > rect.top + rect.height / 2;
  els.todoList.insertBefore(dragState.item, after ? target.nextSibling : target);
}

function activatePointerReorder() {
  const pressState = state.reorderPress;
  if (!pressState) return;
  window.clearTimeout(pressState.timer);
  state.reorderPress = null;
  state.pointerDrag = {
    item: pressState.item,
    handle: pressState.handle,
    id: pressState.id,
    pointerId: pressState.pointerId
  };
  pressState.item.classList.add("dragging", "reorder-ready");
}

async function finishPointerReorder() {
  if (state.reorderPress) {
    clearReorderPress();
    removePointerReorderListeners();
    return;
  }

  const dragState = state.pointerDrag;
  if (!dragState) {
    removePointerReorderListeners();
    return;
  }
  dragState.item.classList.remove("dragging", "reorder-ready");
  const ids = [...els.todoList.querySelectorAll(".todo-item")].map((item) => item.dataset.id);
  state.pointerDrag = null;
  removePointerReorderListeners();
  await persistTodoOrder(ids);
  await loadTodosForSelectedDate();
  renderTodoList();
}

function cancelPointerReorder(options = {}) {
  const shouldRender = options.rerender !== false;
  clearReorderPress();
  const dragState = state.pointerDrag;
  if (dragState) {
    dragState.item.classList.remove("dragging", "reorder-ready");
  }
  state.pointerDrag = null;
  removePointerReorderListeners();
  if (shouldRender && state.db) {
    renderTodoList();
  }
}

function clearReorderPress() {
  if (!state.reorderPress) return;
  window.clearTimeout(state.reorderPress.timer);
  state.reorderPress = null;
}

function removePointerReorderListeners() {
  document.removeEventListener("pointermove", movePointerReorder);
  document.removeEventListener("pointerup", finishPointerReorder);
  document.removeEventListener("pointercancel", cancelPointerReorder);
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
    return putRecord("memo", { id: "main", text: els.memoText.value, updatedAt: Date.now() });
  }
  return Promise.resolve();
}

async function clearMemo() {
  els.memoText.value = "";
  await putRecord("memo", { id: "main", text: "", updatedAt: Date.now() });
  els.confirmDialog.hidden = true;
}

async function exportTodoMemoBackup() {
  await flushMemoSave();
  const todos = await getAllRecords("todos");
  const memo = await getRecord("memo", "main");
  const backup = {
    type: "todo-memo-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    todos,
    memo: {
      text: memo?.text || "",
      updatedAt: memo?.updatedAt || Date.now()
    }
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `todo-memo-backup-${toDateKey(new Date())}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importTodoMemoBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const backup = JSON.parse(await file.text());
    const todos = normalizeBackupTodos(backup.todos);
    const memoText = typeof backup.memo?.text === "string" ? backup.memo.text : "";
    const confirmed = window.confirm("백업 파일의 투두와 메모로 현재 내용을 바꿀까요?");
    if (!confirmed) return;

    await clearStore("todos");
    await Promise.all(todos.map((todo) => putRecord("todos", todo)));
    await putRecord("memo", { id: "main", text: memoText, updatedAt: Date.now() });
    await loadTodosForSelectedDate();
    await loadMemo();
    renderAll();
  } catch {
    window.alert("백업 파일을 불러오지 못했어요.");
  } finally {
    event.target.value = "";
  }
}

function normalizeBackupTodos(todos) {
  if (!Array.isArray(todos)) {
    throw new Error("Invalid backup");
  }
  return todos
    .map((todo, index) => ({
      id: typeof todo.id === "string" && todo.id ? todo.id : crypto.randomUUID(),
      date: typeof todo.date === "string" ? todo.date : "",
      text: typeof todo.text === "string" ? todo.text.trim() : "",
      done: Boolean(todo.done),
      cancelled: Boolean(todo.cancelled),
      order: Number.isFinite(Number(todo.order)) ? Number(todo.order) : index + 1,
      createdAt: Number.isFinite(Number(todo.createdAt)) ? Number(todo.createdAt) : Date.now(),
      updatedAt: Number.isFinite(Number(todo.updatedAt)) ? Number(todo.updatedAt) : Date.now()
    }))
    .filter((todo) => /^\d{4}-\d{2}-\d{2}$/.test(todo.date) && todo.text);
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
    button.style.setProperty("--swatch", theme.dark
      ? `linear-gradient(135deg, ${theme.bg}, ${theme.surface} 52%, ${theme.primary})`
      : `linear-gradient(135deg, ${theme.primary}, ${theme.strong})`);
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
  const isDark = Boolean(theme.dark);
  const isSoft = Boolean(theme.soft);
  document.body.classList.toggle("theme-dark", isDark);
  document.documentElement.style.setProperty("--bg", theme.bg);
  document.documentElement.style.setProperty("--surface", theme.surfaceSoft || (isDark ? theme.surface : "#f6f7f6"));
  document.documentElement.style.setProperty("--surface-strong", theme.surface);
  document.documentElement.style.setProperty("--text", theme.text);
  document.documentElement.style.setProperty("--muted", theme.muted);
  document.documentElement.style.setProperty("--line", isDark ? "rgba(244, 244, 244, 0.13)" : "rgba(32, 33, 36, 0.11)");
  document.documentElement.style.setProperty("--primary", theme.primary);
  document.documentElement.style.setProperty("--primary-strong", theme.strong);
  document.documentElement.style.setProperty("--primary-soft", isDark ? `color-mix(in srgb, ${theme.primary} 20%, transparent)` : `color-mix(in srgb, ${theme.primary} 18%, transparent)`);
  document.documentElement.style.setProperty("--control-fill", isDark
    ? `color-mix(in srgb, ${theme.primary} 24%, ${theme.surface})`
    : isSoft ? `color-mix(in srgb, ${theme.primary} 44%, white)` : theme.strong);
  document.documentElement.style.setProperty("--control-text", isDark ? theme.strong : isSoft ? theme.strong : "#fff");
  document.documentElement.style.setProperty("--control-border", isDark
    ? `color-mix(in srgb, ${theme.primary} 46%, ${theme.surface})`
    : isSoft ? `color-mix(in srgb, ${theme.primary} 68%, white)` : theme.strong);
  document.documentElement.style.setProperty("--shadow", isDark ? "0 18px 44px rgba(0, 0, 0, 0.34)" : "0 12px 32px rgba(30, 41, 35, 0.1)");
  document.documentElement.style.setProperty("--small-shadow", isDark ? "0 8px 24px rgba(0, 0, 0, 0.2)" : "0 4px 14px rgba(30, 41, 35, 0.06)");
  document.querySelector('meta[name="theme-color"]').setAttribute("content", isDark ? theme.bg : theme.primary);
}

function applyFont() {
  const font = fontOptions.find((item) => item.id === state.settings.font) || fontOptions[0];
  document.documentElement.style.setProperty("--app-font", font.family);
}

function loadSettings() {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"));
  } catch {
    return { ...defaultSettings };
  }
}

function normalizeSettings(settings) {
  const next = { ...defaultSettings, ...settings };
  if (next.font === "bookk") next.font = "bareun";
  if (next.font === "kyobo") next.font = "kcc";
  const themeMap = {
    sage: "bold-green",
    coral: "bold-rose",
    sky: "bold-blue",
    olive: "bold-green",
    rose: "cute-pink",
    indigo: "bold-violet",
    strawberry: "cute-pink",
    plum: "dark-plum",
    amber: "cute-peach",
    dark: "dark-slate",
    "deep-blue": "bold-blue",
    "deep-green": "bold-green",
    "deep-coral": "bold-rose",
    "deep-slate": "bold-slate",
    "deep-taupe": "bold-slate",
    "soft-mint": "cute-mint",
    "soft-pink": "cute-pink",
    "soft-sand": "cute-peach",
    "soft-gray": "bold-slate",
    "soft-leaf": "cute-mint",
    "dark-charcoal": "dark-slate",
    "dark-brown": "dark-forest"
  };
  if (themeMap[next.theme]) {
    next.theme = themeMap[next.theme];
  }
  if (!themes.some((theme) => theme.id === next.theme)) {
    next.theme = defaultSettings.theme;
  }
  return next;
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

function getAllRecords(storeName) {
  return requestToPromise(transaction(storeName).getAll());
}

function deleteRecord(storeName, key) {
  return requestToPromise(transaction(storeName, "readwrite").delete(key));
}

function clearStore(storeName) {
  return requestToPromise(transaction(storeName, "readwrite").clear());
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
