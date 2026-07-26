const { useState, useEffect, useMemo, useRef } = React;

const SUPABASE_URL = 'https://haikpurfsxhowbzuwgpr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UnZUvk8USS5IfenBNcACdA_NMiNUWbw';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_CATEGORIES = [
  { key: 'medicine', label: 'Medicine', hue: 350 },
  { key: 'tech', label: 'Tech Essentials', hue: 30 },
  { key: 'travel', label: 'Travel Essentials', hue: 60 },
  { key: 'personal', label: 'Personal Essentials', hue: 200 },
  { key: 'work', label: 'Work Essentials', hue: 280 },
  { key: 'money', label: 'Money', hue: 120 },
  { key: 'clothes', label: 'Clothes', hue: 170 },
];
const HUE_CYCLE = [350, 30, 60, 200, 280, 120, 170];
const NEUTRAL_SOFT = 'oklch(93% 0.012 80)';

const WEATHER_CODE_LABELS = {
  0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Foggy', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
};

const DEFAULT_ITEM_NAMES = {
  medicine: [
    'Omeprazol', 'Liquid paracetamol / ibuprofen', 'Electrolytes', 'Dioralyte', 'Immodium',
    'Sudocream', 'Plasters', 'Rennies / Gavisgon', 'Anti-histamines', 'Pre & Pro biotics',
    'Mosquito repellent', 'Hydrocortisone 1% cream for itchy bites/rashes', 'Anti septic cream',
    'Tampons / Pads', 'Pepto-bismol', 'Buscopan', 'Thermometer', 'Antiseptic wipes', 'Tweezers',
    'Scissors', 'Anti fungal cream - Canesten', 'Cold & Flu tablets', 'Nasal spray',
    'Sterile saline eye wash', 'Small torch', 'Motion sickness tablets', 'Small instant cold pack',
    'Stain remover pen',
  ],
  tech: [
    'Laptop & charger', 'Phone & Charger', 'Kindle & Charger', 'Ipad & Charger',
    'Headphones & Charger', 'Canon & Charger', 'Speaker & Charger', 'Extension lead x3',
    '3/4 Adapters', 'Cable Organiser', 'Ring light', 'Tri-pod',
  ],
  travel: [
    'Passport', 'Travel Insurance documents', 'Driving License', 'Visa Document', 'Air tags',
    'Packing cubes', 'Lock for luggage',
  ],
  personal: [
    'Face masks', 'Makeup remover', 'Cotton pads', 'Serum', 'Moisturiser', 'Face SPF',
    'Body moisturiser', 'Inky list body exfoliator', 'Makeup', 'Hair tools', 'Hair care',
    'Perfume', 'Fan',
  ],
  work: [
    'Nail lamp', 'Nail drill', 'BIAB', 'Nail files', 'Nail Brushes', 'Lint free wipes', 'Dust brush',
  ],
  money: [
    'Debit card', 'Credit card', 'Backup bank card kept separately',
    'Small amount of Indonesian Rupiah', 'Emergency cash in GBP/USD',
  ],
  clothes: [
    'Sports bras', 'Havianas', 'Trainers', 'Gym clothes', 'Basic tops', 'Shorts',
    'Linen co ords', "PJ's", 'Light jacket', 'Evening fits', 'Skirts',
  ],
};

const DEFAULT_ITEMS = Object.entries(DEFAULT_ITEM_NAMES).flatMap(([category, names]) =>
  names.map((name, i) => ({ id: `${category}-${i + 1}`, name, note: '', category, checked: false }))
);

const DEFAULT_VILLAS = [
  { id: 'villa-1', label: 'Villa Month 1', url: '', dates: '' },
  { id: 'villa-2', label: 'Villa Month 2', url: '', dates: '' },
  { id: 'villa-3', label: 'Villa Month 3', url: '', dates: '' },
];

async function seedIfEmpty() {
  const { count, error } = await sb.from('categories').select('*', { count: 'exact', head: true });
  if (error) { console.error(error); return; }
  if (count === 0) {
    await sb.from('categories').insert(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, position: i })));
    await sb.from('items').insert(DEFAULT_ITEMS.map((it, i) => ({ ...it, position: i })));
  }
}

async function seedVillasIfEmpty() {
  const { count, error } = await sb.from('villas').select('*', { count: 'exact', head: true });
  if (error) { console.error(error); return; }
  if (count === 0) {
    await sb.from('villas').insert(DEFAULT_VILLAS.map((v, i) => ({ ...v, position: i })));
  }
}

async function fetchCategories() {
  const { data, error } = await sb.from('categories').select('*').order('position', { ascending: true });
  if (error) { console.error(error); return null; }
  return data.map(r => ({ key: r.key, label: r.label, hue: r.hue }));
}

async function fetchItems() {
  const { data, error } = await sb.from('items').select('*').order('position', { ascending: true });
  if (error) { console.error(error); return null; }
  return data.map(r => ({ id: r.id, name: r.name, note: r.note || '', category: r.category, checked: r.checked }));
}

async function fetchSavings() {
  const { data, error } = await sb.from('settings').select('savings').eq('id', 1).single();
  if (error) { console.error(error); return null; }
  return Number(data.savings);
}

async function fetchVillas() {
  const { data, error } = await sb.from('villas').select('*').order('position', { ascending: true });
  if (error) { console.error(error); return null; }
  return data.map(r => ({ id: r.id, label: r.label, url: r.url || '', dates: r.dates || '' }));
}

function formatBaliTime(date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Makassar',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

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
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [activeFilter, setActiveFilter] = useState('all');
  const [newItemText, setNewItemText] = useState('');
  const [newItemNote, setNewItemNote] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(DEFAULT_CATEGORIES[0].key);
  const [managingCategories, setManagingCategories] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [savings, setSavings] = useState(3000);
  const [editingSavings, setEditingSavings] = useState(false);
  const [savingsDraft, setSavingsDraft] = useState('');
  const [weather, setWeather] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState('loading');
  const [villas, setVillas] = useState(DEFAULT_VILLAS);
  const [baliTime, setBaliTime] = useState(() => formatBaliTime(new Date()));

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

  useEffect(() => {
    const id = setInterval(() => setBaliTime(formatBaliTime(new Date())), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await seedIfEmpty();
      await seedVillasIfEmpty();
      const [cats, its, sav, vils] = await Promise.all([fetchCategories(), fetchItems(), fetchSavings(), fetchVillas()]);
      if (cancelled) return;
      if (cats && cats.length) {
        setCategories(cats);
        setNewItemCategory(cats[0].key);
      }
      if (its) setItems(its);
      if (sav != null) setSavings(sav);
      if (vils) setVillas(vils);
      setLoading(false);
    }
    init();

    const channel = sb
      .channel('bali-list-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        fetchItems().then(its => its && setItems(its));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories().then(cats => cats && setCategories(cats));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        fetchSavings().then(sav => sav != null && setSavings(sav));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'villas' }, () => {
        fetchVillas().then(vils => vils && setVillas(vils));
      })
      .subscribe();

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, []);

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
    setItems(prev => [...prev, item]);
    setNewItemText('');
    setNewItemNote('');
    sb.from('items').insert({ ...item, position: items.length }).then(({ error }) => { if (error) console.error(error); });
  }

  function toggleItem(id) {
    const target = items.find(it => it.id === id);
    if (!target) return;
    const nextChecked = !target.checked;
    setItems(prev => prev.map(it => it.id === id ? { ...it, checked: nextChecked } : it));
    sb.from('items').update({ checked: nextChecked }).eq('id', id).then(({ error }) => { if (error) console.error(error); });
  }

  function deleteItem(id) {
    setItems(prev => prev.filter(it => it.id !== id));
    sb.from('items').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); });
  }

  function addCategory() {
    const label = newCategoryLabel.trim();
    if (!label) return;
    const key = 'cat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const usedHues = categories.map(c => c.hue);
    const hue = HUE_CYCLE.find(h => !usedHues.includes(h)) ?? HUE_CYCLE[categories.length % HUE_CYCLE.length];
    const newCat = { key, label, hue };
    setCategories(prev => [...prev, newCat]);
    setNewCategoryLabel('');
    sb.from('categories').insert({ ...newCat, position: categories.length }).then(({ error }) => { if (error) console.error(error); });
  }

  function renameCategory(key, label) {
    setCategories(prev => prev.map(c => c.key === key ? { ...c, label } : c));
    sb.from('categories').update({ label }).eq('key', key).then(({ error }) => { if (error) console.error(error); });
  }

  async function deleteCategory(key) {
    if (categories.length <= 1) return;
    const next = categories.filter(c => c.key !== key);
    const fallbackKey = next[0].key;
    setCategories(next);
    setItems(prev => prev.map(it => it.category === key ? { ...it, category: fallbackKey } : it));
    if (newItemCategory === key) setNewItemCategory(fallbackKey);
    if (activeFilter === key) setActiveFilter('all');

    const { error: updErr } = await sb.from('items').update({ category: fallbackKey }).eq('category', key);
    if (updErr) { console.error(updErr); return; }
    const { error: delErr } = await sb.from('categories').delete().eq('key', key);
    if (delErr) console.error(delErr);
  }

  function startEditSavings() {
    setSavingsDraft(String(savings));
    setEditingSavings(true);
  }

  function saveSavings() {
    const val = parseFloat(savingsDraft);
    const next = isNaN(val) ? savings : Math.max(0, val);
    setSavings(next);
    setEditingSavings(false);
    sb.from('settings').update({ savings: next }).eq('id', 1).then(({ error }) => { if (error) console.error(error); });
  }

  function updateVillaField(id, field, value) {
    setVillas(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  }

  function commitVillaField(id, field, value) {
    sb.from('villas').update({ [field]: value }).eq('id', id).then(({ error }) => { if (error) console.error(error); });
  }

  function addVilla() {
    const id = 'villa-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const villa = { id, label: `Villa Month ${villas.length + 1}`, url: '', dates: '' };
    setVillas(prev => [...prev, villa]);
    sb.from('villas').insert({ ...villa, position: villas.length }).then(({ error }) => { if (error) console.error(error); });
  }

  function deleteVilla(id) {
    setVillas(prev => prev.filter(v => v.id !== id));
    sb.from('villas').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); });
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

  if (loading) {
    return (
      <div className="page">
        <div className="page-inner">
          <div className="empty-state">
            <div className="empty-caption">Loading your list…</div>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="weather-time">{baliTime}</div>
            {weatherStatus === 'ok' && <div className="weather-status">{WEATHER_CODE_LABELS[weather.weathercode] || 'Weather update'}</div>}
            {weatherStatus === 'loading' && <div className="weather-status pending">Fetching weather…</div>}
            {weatherStatus === 'error' && <div className="weather-status pending">Weather unavailable</div>}
          </div>
          {weatherStatus === 'ok' && <div className="weather-temp">{Math.round(weather.temperature)}°C</div>}
        </div>

        <div className="villas-section">
          <div className="section-title" style={{ color: 'oklch(55% 0.02 60)' }}>Villas</div>
          <div className="villas-list">
            {villas.map(v => (
              <div className="villa-card" key={v.id}>
                <div className="villa-card-header">
                  <input
                    className="villa-label-input"
                    value={v.label}
                    onChange={e => updateVillaField(v.id, 'label', e.target.value)}
                    onBlur={e => commitVillaField(v.id, 'label', e.target.value)}
                  />
                  <button
                    className="villa-delete"
                    aria-label="Delete villa"
                    onClick={() => deleteVilla(v.id)}
                  >
                    &#10005;
                  </button>
                </div>
                <input
                  className="villa-url-input"
                  placeholder="Villa link (URL)…"
                  value={v.url}
                  onChange={e => updateVillaField(v.id, 'url', e.target.value)}
                  onBlur={e => commitVillaField(v.id, 'url', e.target.value)}
                />
                <input
                  className="villa-dates-input"
                  placeholder="Dates (e.g. 12 Aug – 10 Sep)"
                  value={v.dates}
                  onChange={e => updateVillaField(v.id, 'dates', e.target.value)}
                  onBlur={e => commitVillaField(v.id, 'dates', e.target.value)}
                />
                {v.url && (
                  <a className="villa-link" href={v.url} target="_blank" rel="noopener noreferrer">
                    Open link ↗
                  </a>
                )}
              </div>
            ))}
          </div>
          <button className="villa-add-btn" onClick={addVilla}>+ Add villa month</button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
