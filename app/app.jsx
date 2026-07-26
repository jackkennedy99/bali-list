const { useState, useEffect, useMemo, useRef } = React;

const DEFAULT_CATEGORIES = [
  { key: 'groceries', label: 'Groceries', hue: 350 },
  { key: 'home', label: 'Home', hue: 30 },
  { key: 'other', label: 'Other', hue: 60 },
];
const HUE_CYCLE = [350, 30, 60, 200, 280, 120];
const NEUTRAL_SOFT = 'oklch(93% 0.012 80)';

const STORAGE_KEY = 'bali-list-items-v1';
const CATEGORY_STORAGE_KEY = 'bali-list-categories-v1';
const SAVINGS_STORAGE_KEY = 'bali-list-savings-v1';

const WEATHER_CODE_LABELS = {
  0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Foggy', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return fallback;
}

function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

const DEFAULT_ITEMS = [
  { id: 'seed1', name: 'Coconut milk', note: '2 cans', category: 'groceries', checked: false },
  { id: 'seed2', name: 'Fresh flowers', note: '', category: 'home', checked: false },
  { id: 'seed3', name: 'Sunscreen', note: 'reef safe', category: 'other', checked: true },
];

function computeCountdown() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(now.getFullYear(), 9, 20);
  if (today > target) target.setFullYear(target.getFullYear() + 1);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((target - today) / msPerDay);
  const text = daysLeft <= 0 ? "We're in Bali! 🌴" : daysLeft === 1 ? '1 day to go' : `${daysLeft} days to go`;
  return { number: daysLeft > 0 ? daysLeft : 0, text };
}

function formatGBP(amount) {
  return `£${Number(amount).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
}

function App() {
  const [items, setItems] = useState(() => loadJSON(STORAGE_KEY, DEFAULT_ITEMS));
  const [categories, setCategories] = useState(() => loadJSON(CATEGORY_STORAGE_KEY, DEFAULT_CATEGORIES));
  const [activeFilter, setActiveFilter] = useState('all');
  const [newItemText, setNewItemText] = useState('');
  const [newItemNote, setNewItemNote] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(() => (loadJSON(CATEGORY_STORAGE_KEY, DEFAULT_CATEGORIES)[0] || DEFAULT_CATEGORIES[0]).key);
  const [managingCategories, setManagingCategories] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [savings, setSavings] = useState(() => loadJSON(SAVINGS_STORAGE_KEY, 3000));
  const [editingSavings, setEditingSavings] = useState(false);
  const [savingsDraft, setSavingsDraft] = useState('');
  const [weather, setWeather] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState('loading');

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-8.829&longitude=115.084&current_weather=true&timezone=auto')
      .then(r => r.json())
      .then(data => {
        if (data && data.current_weather) {
          setWeather(data.current_weather);
          setWeatherStatus('ok');
        } else {
          setWeatherStatus('error');
        }
      })
      .catch(() => setWeatherStatus('error'));
  }, []);

  function persistItems(next) {
    setItems(next);
    saveJSON(STORAGE_KEY, next);
  }

  function persistCategories(next) {
    setCategories(next);
    saveJSON(CATEGORY_STORAGE_KEY, next);
  }

  function addItem() {
    const text = newItemText.trim();
    if (!text) return;
    const item = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      name: text,
      note: newItemNote.trim(),
      category: newItemCategory,
      checked: false,
    };
    persistItems([...items, item]);
    setNewItemText('');
    setNewItemNote('');
  }

  function toggleItem(id) {
    persistItems(items.map(it => it.id === id ? { ...it, checked: !it.checked } : it));
  }

  function deleteItem(id) {
    persistItems(items.filter(it => it.id !== id));
  }

  function addCategory() {
    const label = newCategoryLabel.trim();
    if (!label) return;
    const key = 'cat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const usedHues = categories.map(c => c.hue);
    const hue = HUE_CYCLE.find(h => !usedHues.includes(h)) ?? HUE_CYCLE[categories.length % HUE_CYCLE.length];
    persistCategories([...categories, { key, label, hue }]);
    setNewCategoryLabel('');
  }

  function renameCategory(key, label) {
    persistCategories(categories.map(c => c.key === key ? { ...c, label } : c));
  }

  function deleteCategory(key) {
    if (categories.length <= 1) return;
    const next = categories.filter(c => c.key !== key);
    const fallbackKey = next[0].key;
    const nextItems = items.map(it => it.category === key ? { ...it, category: fallbackKey } : it);
    persistCategories(next);
    persistItems(nextItems);
    if (newItemCategory === key) setNewItemCategory(fallbackKey);
    if (activeFilter === key) setActiveFilter('all');
  }

  function startEditSavings() {
    setSavingsDraft(String(savings));
    setEditingSavings(true);
  }

  function saveSavings() {
    const val = parseFloat(savingsDraft);
    const next = isNaN(val) ? savings : Math.max(0, val);
    setSavings(next);
    saveJSON(SAVINGS_STORAGE_KEY, next);
    setEditingSavings(false);
  }

  const countdown = useMemo(() => computeCountdown(), []);

  const filtered = activeFilter === 'all' ? items : items.filter(it => it.category === activeFilter);

  const groupedSections = categories
    .map(cat => {
      const catItems = filtered.filter(it => it.category === cat.key);
      if (catItems.length === 0) return null;
      const sorted = [...catItems].sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1));
      return { cat, items: sorted };
    })
    .filter(Boolean);

  const showEmpty = filtered.length === 0;

  return (
    <div className="page">
      <div className="page-inner">
        <div className="header">
          <div className="header-content">
            <div className="header-title">Bali List</div>
            <div className="header-subtitle">Things To Get</div>
          </div>
        </div>

        <div className="tabs-row">
          <div className="tabs-scroll">
            {[{ key: 'all', label: 'All', hue: null }, ...categories].map(cat => {
              const active = activeFilter === cat.key;
              const bg = active ? (cat.hue == null ? 'oklch(35% 0.03 30)' : `oklch(78% 0.09 ${cat.hue})`) : NEUTRAL_SOFT;
              const color = active ? 'white' : 'oklch(45% 0.02 60)';
              return (
                <button
                  key={cat.key}
                  className="pill"
                  style={{ background: bg, color }}
                  onClick={() => setActiveFilter(cat.key)}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
          <button
            className="edit-btn"
            aria-label="Edit categories"
            onClick={() => setManagingCategories(!managingCategories)}
          >
            &#9998;
          </button>
        </div>

        {managingCategories && (
          <div className="manager-panel">
            <div className="manager-heading">Edit categories</div>
            <div className="manager-rows">
              {categories.map(cat => (
                <div className="manager-row" key={cat.key}>
                  <span className="manager-dot" style={{ background: `oklch(78% 0.09 ${cat.hue})` }} />
                  <input
                    className="manager-input"
                    value={cat.label}
                    onChange={e => renameCategory(cat.key, e.target.value)}
                  />
                  {categories.length > 1 && (
                    <button
                      className="manager-delete"
                      aria-label="Delete category"
                      onClick={() => deleteCategory(cat.key)}
                    >
                      &#10005;
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="manager-new-row">
              <input
                className="manager-new-input"
                placeholder="New category…"
                value={newCategoryLabel}
                onChange={e => setNewCategoryLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCategory(); }}
              />
              <button className="manager-add-btn" onClick={addCategory}>Add</button>
            </div>
          </div>
        )}

        <div className="add-bar">
          <div className="add-bar-row">
            <input
              className="add-bar-name"
              placeholder="Add something…"
              value={newItemText}
              onChange={e => setNewItemText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addItem(); }}
            />
            <input
              className="add-bar-note"
              placeholder="qty/note"
              value={newItemNote}
              onChange={e => setNewItemNote(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addItem(); }}
            />
            <button className="add-bar-submit" aria-label="Add item" onClick={addItem}>+</button>
          </div>
          <div className="add-bar-chips">
            {categories.map(cat => {
              const active = newItemCategory === cat.key;
              const bg = active ? `oklch(78% 0.09 ${cat.hue})` : NEUTRAL_SOFT;
              const color = active ? 'white' : 'oklch(50% 0.02 60)';
              return (
                <button
                  key={cat.key}
                  className="chip"
                  style={{ background: bg, color }}
                  onClick={() => setNewItemCategory(cat.key)}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {groupedSections.map(({ cat, items: catItems }) => (
          <div className="section" key={cat.key}>
            <div className="section-title" style={{ color: `oklch(60% 0.07 ${cat.hue})` }}>
              {cat.label}
            </div>
            <div className="section-items">
              {catItems.map(item => {
                const checked = item.checked;
                const checkBorder = checked ? `oklch(78% 0.09 ${cat.hue})` : 'oklch(80% 0.02 60)';
                const checkBg = checked ? `oklch(78% 0.09 ${cat.hue})` : 'transparent';
                const textColor = checked ? 'var(--text-muted-2)' : 'var(--text-primary)';
                const cardBg = checked ? 'var(--card-checked)' : 'var(--card)';
                return (
                  <div className="item-card" style={{ background: cardBg }} key={item.id}>
                    <button
                      className="item-check"
                      aria-label="Toggle done"
                      style={{ borderColor: checkBorder, backgroundColor: checkBg }}
                      onClick={() => toggleItem(item.id)}
                    >
                      {checked && <span className="item-check-mark">&#10003;</span>}
                    </button>
                    <div className="item-body">
                      <div
                        className="item-name"
                        style={{ color: textColor, textDecoration: checked ? 'line-through' : 'none' }}
                      >
                        {item.name}
                      </div>
                      {item.note && <div className="item-note">{item.note}</div>}
                    </div>
                    <button className="item-delete" aria-label="Delete" onClick={() => deleteItem(item.id)}>
                      &#10005;
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {showEmpty && (
          <div className="empty-state">
            <div className="empty-title">All clear ✨</div>
            <div className="empty-caption">Add something above to get started.</div>
          </div>
        )}

        <div className="tile-row">
          <div className="tile tile-countdown">
            <div className="tile-label" style={{ color: 'oklch(50% 0.06 350)' }}>Countdown to Bali</div>
            <div className="tile-number" style={{ color: 'oklch(38% 0.06 350)' }}>{countdown.number}</div>
            <div className="tile-caption" style={{ color: 'oklch(45% 0.05 350)' }}>{countdown.text}</div>
          </div>

          <div className="tile tile-finance">
            <div className="tile-label" style={{ color: 'oklch(48% 0.05 90)' }}>Finance Tracker</div>
            {editingSavings ? (
              <input
                className="savings-input"
                value={savingsDraft}
                autoFocus
                inputMode="decimal"
                onChange={e => setSavingsDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveSavings(); }}
                onBlur={saveSavings}
              />
            ) : (
              <div className="tile-number savings-display" onClick={startEditSavings}>
                {formatGBP(savings)}
              </div>
            )}
            <div className="tile-caption" style={{ color: 'oklch(45% 0.04 90)' }}>saved so far &#9998;</div>
          </div>
        </div>

        <div className="weather-card">
          <div>
            <div className="weather-label">Uluwatu right now</div>
            {weatherStatus === 'ok' && <div className="weather-status">{WEATHER_CODE_LABELS[weather.weathercode] || 'Weather update'}</div>}
            {weatherStatus === 'loading' && <div className="weather-status pending">Fetching weather…</div>}
            {weatherStatus === 'error' && <div className="weather-status pending">Weather unavailable</div>}
          </div>
          {weatherStatus === 'ok' && <div className="weather-temp">{Math.round(weather.temperature)}°C</div>}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
