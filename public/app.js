const monthLabel = document.querySelector('#month-label');
const monthNameLabel = document.querySelector('#month-name');
const yearLabel = document.querySelector('#year-label');
const currentDateLabel = document.querySelector('#current-date');
const calendarGrid = document.querySelector('#calendar-grid');
const previousMonthButton = document.querySelector('#previous-month');
const nextMonthButton = document.querySelector('#next-month');
const todayButton = document.querySelector('#today-button');

if (monthLabel && monthNameLabel && yearLabel && currentDateLabel && calendarGrid && previousMonthButton && nextMonthButton && todayButton) {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long' });
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  let displayedYear;
  let displayedMonth;
  const savedMoodByDate = new Map();
  const moodIconPaths = {
    happy: '/mood-happy.svg',
    sad: '/mood-sad.svg',
    peaceful: '/mood-peaceful.svg',
    angry: '/mood-angry.svg',
    stressed: '/mood-stressed.svg'
  };
  const entriesCacheKey = 'dayPlannerSavedEntries';

  function readEntriesCache() {
    try {
      const entries = JSON.parse(window.localStorage.getItem(entriesCacheKey) || '[]');
      return Array.isArray(entries) ? entries : [];
    } catch {
      return [];
    }
  }

  function writeEntriesCache(entries) {
    window.localStorage.setItem(entriesCacheKey, JSON.stringify(entries));
  }

  function updateSavedMoods(entries) {
    savedMoodByDate.clear();
    for (const entry of entries) {
      if (typeof entry.date === 'string') {
        savedMoodByDate.set(entry.date, entry.mood);
      }
    }
  }

  async function loadCompletedDates() {
    const cachedEntries = readEntriesCache();
    updateSavedMoods(cachedEntries);
    renderCalendar();

    try {
      const response = await fetch('/api/resume-items');
      if (!response.ok) return;
      const entries = await response.json();
      writeEntriesCache(entries);
      updateSavedMoods(entries);
      renderCalendar();
    } catch {
      // The calendar remains usable when saved entries cannot be loaded.
    }
  }

  function updateCurrentDate() {
    const now = new Date();
    currentDateLabel.textContent = `Today is ${dateFormatter.format(now)}.`;

    if (displayedYear === undefined) {
      displayedYear = now.getFullYear();
      displayedMonth = now.getMonth();
    }

    renderCalendar(now);
  }

  function renderCalendar(now = new Date()) {
    const firstWeekday = new Date(displayedYear, displayedMonth, 1).getDay();
    const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();
    const monthDate = new Date(displayedYear, displayedMonth, 1);
    const todayIso = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');
    monthNameLabel.textContent = monthFormatter.format(monthDate);
    yearLabel.textContent = String(displayedYear);

    const fragment = document.createDocumentFragment();
    const weekdayRow = document.createElement('div');
    weekdayRow.className = 'calendar-row weekday-row';
    weekdayRow.setAttribute('role', 'row');

    for (const weekday of weekdays) {
      const cell = document.createElement('span');
      cell.className = 'weekday';
      cell.setAttribute('role', 'columnheader');
      cell.setAttribute('aria-label', weekday);
      cell.textContent = weekday.slice(0, 1);
      weekdayRow.append(cell);
    }
    fragment.append(weekdayRow);

    const cells = [];
    for (let index = 0; index < firstWeekday; index += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);

    for (let index = 0; index < cells.length; index += 7) {
      const weekRow = document.createElement('div');
      weekRow.className = 'calendar-row';
      weekRow.setAttribute('role', 'row');

      for (const day of cells.slice(index, index + 7)) {
        const cell = document.createElement('span');
        cell.className = day === null ? 'calendar-cell empty-day' : 'calendar-cell';
        cell.setAttribute('role', 'gridcell');

        if (day === null) {
          cell.setAttribute('aria-hidden', 'true');
        } else {
          const date = new Date(displayedYear, displayedMonth, day);
          const isoDate = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
          ].join('-');
          if (isoDate > todayIso) {
            const unavailableDate = document.createElement('span');
            unavailableDate.className = 'calendar-day is-future';
            unavailableDate.textContent = String(day);
            unavailableDate.setAttribute('aria-disabled', 'true');
            unavailableDate.setAttribute(
              'aria-label',
              `${dateFormatter.format(date)}, future date unavailable`
            );
            cell.append(unavailableDate);
            weekRow.append(cell);
            continue;
          }

          const link = document.createElement('a');
          link.className = 'calendar-day';
          link.href = `/logpage.html?date=${isoDate}`;
          link.textContent = String(day);
          link.setAttribute('aria-label', dateFormatter.format(date));
          link.addEventListener('click', () => {
            window.sessionStorage.setItem('selectedCalendarDate', isoDate);
          });
          if (window.sessionStorage.getItem('selectedCalendarDate') === isoDate) {
            link.classList.add('is-selected');
          }

          if (savedMoodByDate.has(isoDate)) {
            const mood = savedMoodByDate.get(isoDate);
            link.classList.add('is-complete');
            link.setAttribute(
              'aria-label',
              `${dateFormatter.format(date)}, log completed${mood ? `, mood ${mood}` : ''}`
            );
            const completeIcon = document.createElement('img');
            completeIcon.className = 'calendar-complete-icon';
            completeIcon.src = moodIconPaths[mood] || '/calendar-complete.svg';
            completeIcon.alt = '';
            completeIcon.setAttribute('aria-hidden', 'true');
            link.append(completeIcon);
          }

          if (
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate()
          ) {
            link.classList.add('is-today');
            link.setAttribute('aria-current', 'date');
          }

          cell.append(link);
        }

        weekRow.append(cell);
      }

      fragment.append(weekRow);
    }

    calendarGrid.replaceChildren(fragment);
  }

  previousMonthButton.addEventListener('click', () => {
    displayedMonth -= 1;
    if (displayedMonth < 0) {
      displayedMonth = 11;
      displayedYear -= 1;
    }
    renderCalendar();
  });

  nextMonthButton.addEventListener('click', () => {
    displayedMonth += 1;
    if (displayedMonth > 11) {
      displayedMonth = 0;
      displayedYear += 1;
    }
    renderCalendar();
  });

  todayButton.addEventListener('click', () => {
    const now = new Date();
    displayedYear = now.getFullYear();
    displayedMonth = now.getMonth();
    updateCurrentDate();
  });

  updateCurrentDate();
  loadCompletedDates();
  window.addEventListener('daily-entry-saved', (event) => {
    if (typeof event.detail?.date === 'string') {
      savedMoodByDate.set(event.detail.date, event.detail.mood);
      renderCalendar();
    }
  });
  window.setInterval(updateCurrentDate, 60_000);
}

const logForm = document.querySelector('#log-form');
const entryDateField = document.querySelector('#entry-date');
const logField = document.querySelector('#log');
const notesField = document.querySelector('#notes');
const moodButtons = [...document.querySelectorAll('[data-mood]')];
const saveStatus = document.querySelector('#save-status');
const saveButton = logForm?.querySelector('button[type="submit"]');
const deleteButton = document.querySelector('#delete-entry');
const dateLabel = document.querySelector('#clock');

if (logForm && entryDateField && logField && notesField && saveStatus && saveButton && deleteButton && dateLabel) {
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  function toLocalIsoDate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  function isValidIsoDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === month - 1 &&
      parsedDate.getDate() === day;
  }

  const requestedDate = new URLSearchParams(window.location.search).get('date');
  const entryDate = requestedDate || toLocalIsoDate(new Date());
  const entryDateIsValid = isValidIsoDate(entryDate);
  const entryDateIsFuture = entryDateIsValid && entryDate > toLocalIsoDate(new Date());
  const selectedDateIsValid = entryDateIsValid && !entryDateIsFuture;
  entryDateField.value = selectedDateIsValid ? entryDate : '';

  if (selectedDateIsValid) {
    const [year, month, day] = entryDate.split('-').map(Number);
    dateLabel.textContent = dateFormatter.format(new Date(year, month - 1, day)).toUpperCase();
  } else if (entryDateIsFuture) {
    dateLabel.textContent = 'Future dates are unavailable.';
    saveStatus.textContent = 'Return to the calendar and choose today or an earlier date.';
    saveButton.disabled = true;
  } else {
    dateLabel.textContent = 'The selected date is invalid.';
    saveStatus.textContent = 'Return to the calendar and choose a valid date.';
    saveButton.disabled = true;
  }

  let selectedMood = null;
  let entryFormWasEdited = false;
  for (const button of moodButtons) {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      entryFormWasEdited = true;
      selectedMood = button.dataset.mood;
      for (const moodButton of moodButtons) {
        moodButton.setAttribute('aria-pressed', String(moodButton === button));
      }
    });
  }
  logField.addEventListener('input', () => {
    entryFormWasEdited = true;
  });
  notesField.addEventListener('input', () => {
    entryFormWasEdited = true;
  });

  let existingEntryId = null;
  const entriesCacheKey = 'dayPlannerSavedEntries';

  function readEntriesCache() {
    try {
      const entries = JSON.parse(window.localStorage.getItem(entriesCacheKey) || '[]');
      return Array.isArray(entries) ? entries : [];
    } catch {
      return [];
    }
  }

  function writeEntriesCache(entries) {
    window.localStorage.setItem(entriesCacheKey, JSON.stringify(entries));
  }

  function applySavedEntry(savedEntry) {
    if (!savedEntry) return;

    existingEntryId = savedEntry._id || existingEntryId;
    if (entryFormWasEdited) return;

    logField.value = savedEntry.log || '';
    notesField.value = savedEntry.notes || '';
    if (savedEntry.mood) {
      selectedMood = savedEntry.mood;
      for (const button of moodButtons) {
        button.setAttribute('aria-pressed', String(button.dataset.mood === selectedMood));
      }
    }
  }

  async function loadSavedEntry() {
    if (!selectedDateIsValid) return;

    applySavedEntry(readEntriesCache().find((entry) => entry.date === entryDate));

    try {
      const response = await fetch('/api/resume-items');
      if (!response.ok) return;

      const entries = await response.json();
      const savedEntry = entries.find((entry) => entry.date === entryDate);
      if (!entryFormWasEdited) writeEntriesCache(entries);
      applySavedEntry(savedEntry);
    } catch {
      // The cached entry remains available when the API is unavailable.
    }
  }

  logForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!selectedDateIsValid || !logForm.reportValidity() || saveButton.disabled) return;

    const payload = {
      date: entryDateField.value,
      log: logField.value.trim(),
      notes: notesField.value.trim()
    };
    if (selectedMood) payload.mood = selectedMood;

    saveButton.disabled = true;
    for (const button of moodButtons) button.disabled = true;
    saveStatus.textContent = 'Saving…';

    try {
      const url = existingEntryId
        ? `/api/daily_info?id=${encodeURIComponent(existingEntryId)}`
        : '/api/daily_info';
      const response = await fetch(url, {
        method: existingEntryId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || `Save failed (${response.status}).`);
      }

      existingEntryId = result._id || existingEntryId;
      const savedEntry = { ...payload, _id: existingEntryId };
      const entries = readEntriesCache();
      const entryIndex = entries.findIndex((entry) => entry.date === entryDate);
      if (entryIndex >= 0) entries[entryIndex] = savedEntry;
      else entries.push(savedEntry);
      writeEntriesCache(entries);
      saveStatus.textContent = 'Entry saved.';
      window.sessionStorage.setItem('selectedCalendarDate', entryDate);
      window.dispatchEvent(new CustomEvent('daily-entry-saved', {
        detail: { date: entryDate, mood: payload.mood }
      }));
    } catch (error) {
      saveStatus.textContent = error.message || 'Unable to save the entry. Please try again.';
    } finally {
      if (selectedDateIsValid) saveButton.disabled = false;
      for (const button of moodButtons) button.disabled = false;
    }
  });

  deleteButton.addEventListener('click', async () => {
    if (!existingEntryId) {
      saveStatus.textContent = 'No saved entry found for this date. Save the entry first.';
      return;
    }

    deleteButton.disabled = true;
    saveButton.disabled = true;
    saveStatus.textContent = 'Deleting…';

    try {
      const response = await fetch(
        `/api/daily_info?id=${encodeURIComponent(existingEntryId)}`,
        { method: 'DELETE' }
      );
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || `Delete failed (${response.status}).`);
      }

      writeEntriesCache(
        readEntriesCache().filter((entry) => entry._id !== existingEntryId)
      );
      window.location.href = '/';
    } catch (error) {
      saveStatus.textContent = error.message || 'Unable to delete the entry.';
      deleteButton.disabled = false;
      saveButton.disabled = false;
    }
  });

  loadSavedEntry();
}
