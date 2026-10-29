const DEFAULT_DAILY_TARGET = 100;
const AVERAGE_USE = 135;
const STORAGE_KEY = "aquaTrackEntries";
const TARGET_STORAGE_KEY = "aquaTrackDailyTarget";

const waterForm = document.getElementById("water-form");
const activityInput = document.getElementById("activity");
const litresInput = document.getElementById("litres");
const targetForm = document.getElementById("target-form");
const targetInput = document.getElementById("target-input");
const targetStatus = document.getElementById("target-status");

const totalWaterElement = document.getElementById("total-water");
const waterRemainingElement = document.getElementById("water-remaining");
const waterSavedElement = document.getElementById("water-saved");
const targetDisplayElement = document.getElementById("target-display");
const progressFill = document.getElementById("progress-fill");
const breakdownList = document.getElementById("breakdown-list");
const emptyBreakdown = document.getElementById("empty-breakdown");
const historyList = document.getElementById("history-list");
const weeklyChart = document.getElementById("weekly-chart");
const todayDateElement = document.getElementById("today-date");
const tipTitle = document.getElementById("tip-title");
const tipMessage = document.getElementById("tip-message");
const clearDataButton = document.getElementById("clear-data");

const activityIcons = {
  Bathing: "🚿",
  Drinking: "🥤",
  Laundry: "🧺",
  Dishwashing: "🍽️",
  Cleaning: "🧽",
  Gardening: "🌿",
  Other: "💧"
};

function getEntries() {
  const savedEntries = localStorage.getItem(STORAGE_KEY);

  try {
    const entries = savedEntries ? JSON.parse(savedEntries) : [];
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function getDailyTarget() {
  const savedTarget = Number(localStorage.getItem(TARGET_STORAGE_KEY));

  if (Number.isFinite(savedTarget) && savedTarget > 0 && savedTarget <= 1000) {
    return savedTarget;
  }

  return DEFAULT_DAILY_TARGET;
}

function saveDailyTarget(target) {
  localStorage.setItem(TARGET_STORAGE_KEY, String(target));
}

function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateDaysAgo(daysAgo) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function getTodayEntries(entries) {
  const today = getLocalDate();
  return entries.filter((entry) => entry.date === today);
}

function formatLitres(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : number.toFixed(1);
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function setTodayDate() {
  todayDateElement.textContent = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function updateDashboard(entries, target) {
  const totalWater = entries.reduce(
    (total, entry) => total + Number(entry.litres),
    0
  );

  const waterRemaining = Math.max(0, target - totalWater);
  const waterSaved = entries.length
    ? Math.max(0, AVERAGE_USE - totalWater)
    : 0;

  totalWaterElement.textContent = formatLitres(totalWater);
  waterRemainingElement.textContent = formatLitres(waterRemaining);
  waterSavedElement.textContent = formatLitres(waterSaved);
  targetDisplayElement.textContent = formatLitres(target);

  const progressPercentage = Math.min((totalWater / target) * 100, 100);

  progressFill.style.width = `${progressPercentage}%`;
  progressFill.style.background =
    totalWater > target
      ? "#d85b5b"
      : "linear-gradient(90deg, #1687a7, #76d3e4)";
}

function createBreakdown(entries) {
  return entries.reduce((totals, entry) => {
    const activity = entry.activity;
    totals[activity] = (totals[activity] || 0) + Number(entry.litres);
    return totals;
  }, {});
}

function updateBreakdown(entries) {
  breakdownList.replaceChildren();

  if (entries.length === 0) {
    emptyBreakdown.style.display = "flex";
    return;
  }

  emptyBreakdown.style.display = "none";

  const activityTotals = createBreakdown(entries);
  const highestAmount = Math.max(...Object.values(activityTotals));

  Object.entries(activityTotals)
    .sort((first, second) => second[1] - first[1])
    .forEach(([activity, litres]) => {
      const item = createElement("div", "breakdown-item");
      const activityName = createElement(
        "p",
        "",
        `${activityIcons[activity] || "💧"} ${activity}`
      );
      const activityLitres = createElement(
        "span",
        "",
        `${formatLitres(litres)} L`
      );
      const barBackground = createElement("div", "bar-bg");
      const barFill = createElement("div", "bar-fill");

      barFill.style.width = `${(litres / highestAmount) * 100}%`;

      barBackground.appendChild(barFill);
      item.append(activityName, activityLitres, barBackground);
      breakdownList.appendChild(item);
    });
}

function updateHistory(entries) {
  historyList.replaceChildren();

  if (entries.length === 0) {
    historyList.appendChild(
      createElement("p", "empty-history", "No water-usage entries yet.")
    );
    return;
  }

  [...entries].reverse().forEach((entry) => {
    const time = new Date(entry.createdAt).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });

    const historyEntry = createElement("div", "history-entry");
    const leftSide = createElement("div", "entry-left");
    const icon = createElement(
      "div",
      "entry-icon",
      activityIcons[entry.activity] || "💧"
    );

    const entryDetails = document.createElement("div");
    const name = createElement("p", "entry-name", entry.activity);
    const entryTime = createElement("p", "entry-time", `Added at ${time}`);

    const actions = createElement("div", "entry-actions");
    const litres = createElement(
      "p",
      "entry-litres",
      `${formatLitres(entry.litres)} L`
    );

    const deleteButton = createElement("button", "delete-entry", "Delete");

    deleteButton.type = "button";
    deleteButton.dataset.entryId = String(entry.id);
    deleteButton.setAttribute(
      "aria-label",
      `Delete ${entry.activity} entry`
    );

    entryDetails.append(name, entryTime);
    leftSide.append(icon, entryDetails);
    actions.append(litres, deleteButton);
    historyEntry.append(leftSide, actions);
    historyList.appendChild(historyEntry);
  });
}

function updateWeeklyChart(entries, target) {
  const sevenDays = [];

  for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
    const date = getDateDaysAgo(daysAgo);

    sevenDays.push({
      dateKey: getLocalDate(date),
      label: date.toLocaleDateString("en-IN", { weekday: "short" })
    });
  }

  const totalsByDate = entries.reduce((totals, entry) => {
    totals[entry.date] = (totals[entry.date] || 0) + Number(entry.litres);
    return totals;
  }, {});

  const dailyTotals = sevenDays.map(
    (day) => totalsByDate[day.dateKey] || 0
  );

  const chartMaximum = Math.max(target, ...dailyTotals, 1);
  const chartHeight = 170;
  const limitLineHeight = Math.min(
    (target / chartMaximum) * chartHeight,
    chartHeight
  );

  weeklyChart.replaceChildren();
  weeklyChart.style.setProperty("--limit-line", `${limitLineHeight}px`);
  weeklyChart.dataset.limitLabel = `Limit: ${formatLitres(target)} L`;

  sevenDays.forEach((day, index) => {
    const total = dailyTotals[index];

    const barHeight = total
      ? Math.max((total / chartMaximum) * chartHeight, 5)
      : 0;

    const column = createElement("div", "chart-column");
    const value = createElement(
      "p",
      "chart-value",
      total ? `${formatLitres(total)} L` : "–"
    );

    const track = createElement("div", "chart-bar-track");
    const bar = createElement("div", "chart-bar");
    const label = createElement("p", "chart-label", day.label);

    bar.style.height = `${barHeight}px`;
    bar.title = `${day.label}: ${formatLitres(total)} L`;

    if (total > target) {
      bar.classList.add("over-limit");
    }

    track.appendChild(bar);
    column.append(value, track, label);
    weeklyChart.appendChild(column);
  });
}

function updateTip(entries, target) {
  if (entries.length === 0) {
    tipTitle.textContent = "Start tracking today";
    tipMessage.textContent =
      "Add your first activity to receive personalised water-saving advice.";
    return;
  }

  const totalWater = entries.reduce(
    (total, entry) => total + Number(entry.litres),
    0
  );

  const activityTotals = createBreakdown(entries);

  const highestActivity = Object.keys(activityTotals).reduce(
    (highest, activity) =>
      activityTotals[activity] > activityTotals[highest]
        ? activity
        : highest
  );

  if (totalWater > target) {
    tipTitle.textContent = "You are above your daily target";
    tipMessage.textContent =
      "Try to reduce water use tomorrow. A shorter bath and full-load laundry can save a significant amount of water.";
    return;
  }

  const tips = {
    Bathing:
      "Bathing is your highest-use activity. Use a bucket or keep showers short to avoid unnecessary water use.",
    Laundry:
      "Laundry is using the most water today. Run the washing machine only with a full load whenever possible.",
    Dishwashing:
      "Dishwashing is your highest-use activity. Wash dishes in a filled basin instead of under a continuously running tap.",
    Cleaning:
      "Cleaning uses the most water today. Use a bucket and reusable cloth instead of keeping a hose or tap running.",
    Gardening:
      "Gardening is your highest-use activity. Water plants early in the morning and reuse safe leftover household water.",
    Drinking:
      "Keep drinking water use thoughtful: fill only the amount you need and safely store any extra water for later.",
    Other:
      "Review your largest water activity and look for one small habit you can change tomorrow."
  };

  tipTitle.textContent = `Focus on ${highestActivity.toLowerCase()}`;
  tipMessage.textContent = tips[highestActivity];
}

function renderTracker() {
  const entries = getEntries();
  const target = getDailyTarget();
  const todayEntries = getTodayEntries(entries);

  targetInput.value = formatLitres(target);

  updateDashboard(todayEntries, target);
  updateBreakdown(todayEntries);
  updateHistory(todayEntries);
  updateWeeklyChart(entries, target);
  updateTip(todayEntries, target);
}

waterForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const activity = activityInput.value;
  const litres = Number(litresInput.value);

  if (!activity || !Number.isFinite(litres) || litres <= 0 || litres > 1000) {
    alert(
      "Please select an activity and enter water use between 1 and 1000 litres."
    );
    return;
  }

  const entries = getEntries();

  entries.push({
    id: Date.now(),
    activity,
    litres,
    date: getLocalDate(),
    createdAt: new Date().toISOString()
  });

  saveEntries(entries);
  waterForm.reset();
  renderTracker();
});

targetForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const target = Number(targetInput.value);

  if (!Number.isFinite(target) || target <= 0 || target > 1000) {
    targetStatus.textContent =
      "Enter a daily limit between 1 and 1000 litres.";
    return;
  }

  saveDailyTarget(target);
  targetStatus.textContent = `Daily limit saved: ${formatLitres(target)} L.`;
  renderTracker();
});

historyList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".delete-entry");

  if (!deleteButton) {
    return;
  }

  const shouldDelete = confirm("Delete this water-usage entry?");

  if (!shouldDelete) {
    return;
  }

  const entryId = deleteButton.dataset.entryId;

  const remainingEntries = getEntries().filter(
    (entry) => String(entry.id) !== entryId
  );

  saveEntries(remainingEntries);
  renderTracker();
});

clearDataButton.addEventListener("click", () => {
  const shouldClear = confirm(
    "Are you sure you want to remove all saved water-usage entries?"
  );

  if (shouldClear) {
    localStorage.removeItem(STORAGE_KEY);
    renderTracker();
  }
});

setTodayDate();
renderTracker();
