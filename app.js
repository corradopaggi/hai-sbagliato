// ===== IndexedDB =====
let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('HaiSbagliatoDB', 1);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('events')) {
        const store = d.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
        store.createIndex('created_at', 'created_at', { unique: false });
        store.createIndex('mood', 'mood', { unique: false });
      }
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror = e => reject(e.target.error);
  });
}

function addEvent(mood) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('events', 'readwrite');
    tx.objectStore('events').add({ mood, created_at: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = e => reject(e.target.error);
  });
}

function getAllEvents() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('events', 'readonly');
    const req = tx.objectStore('events').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });
}

// ===== Stats =====
function computeStats(events) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const monthStr = now.toISOString().slice(0, 7);

  let today = 0, week = 0, month = 0;
  const moodCount = {};

  events.forEach(ev => {
    const d = ev.created_at;
    if (d.slice(0, 10) === todayStr) today++;
    if (new Date(d) >= startOfWeek) week++;
    if (d.slice(0, 7) === monthStr) month++;
    moodCount[ev.mood] = (moodCount[ev.mood] || 0) + 1;
  });

  const moods = Object.entries(moodCount)
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => b.count - a.count);

  return { today, week, month, total: events.length, moods };
}

// ===== Navigation =====
function navigate(page) {
  closeSidebar();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');

  // Update sidebar active state
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.toggle('active', item.dataset.nav === page);
  });

  if (page === 'dashboard') loadDashboard();
}

// ===== Sidebar =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('show');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

// ===== Mood Selection =====
const moodEmojis = {
  'ansia': '😰',
  'delusione': '😔',
  'frustrazione': '😤',
  'imbarazzo': '😅',
  'indifferenza': '😐',
  'noia': '🥱',
  'panico': '😱',
  'rabbia': '😡',
  'rassegnazione': '🤦',
  'tranquillità': '😌',
  'tristezza': '😢',
  'altro': '🤷'
};

const encouragements = [
  "Sbagliare è umano, perseverare è diabolico... ma tu stai tracciando! 💪",
  "Ogni errore è un passo verso la versione migliore di te 🚀",
  "Almeno sei onesto con te stesso, e questo vale tantissimo ✨",
  "Gli errori sono le lezioni che non sapevi di aver bisogno 📚",
  "Anche i migliori sbagliano. La differenza? Tu ne sei consapevole 🧠",
  "Domani è un nuovo giorno, pieno di nuovi errori da fare! 😄",
  "Ricorda: chi non sbaglia mai, non sta facendo nulla di nuovo 🌟",
  "Bravo che lo ammetti! Il primo passo è la consapevolezza 👏",
  "Non è cadere il problema, è non rialzarsi. E tu sei qui! 💪",
  "Errore registrato. Lezione appresa. Si va avanti! ⚡",
  "Nessuno è perfetto, ma tu sei coraggioso ad ammetterlo 🦁",
  "Ogni maestro una volta era un disastro. Continua così! 🎯",
  "L'importante non è non sbagliare, ma sbagliare sempre meglio 📈",
  "Hai sbagliato? Bene. Vuol dire che ci stai provando! 🔥",
  "Questo errore ti ha reso più forte di prima 💎",
  "Respira. Sorridi. Riprova. Ce la farai! 😊",
  "Anche Einstein ha sbagliato. Sei in buona compagnia! 🧪",
  "Un errore in più, un'esperienza in più. Non male! 🎓",
  "La perfezione è noiosa. Gli errori rendono la vita interessante! 🎨",
  "Stai costruendo il tuo personaggio. Ogni errore aggiunge profondità! 📖",
  "Fallire è il primo passo per riuscire in qualcosa 🏆",
  "Gli errori sono prove che ci stai provando davvero 🎪",
  "Oggi hai sbagliato, domani saprai come non farlo 🔮",
  "Ogni grande successo è costruito su una montagna di errori ⛰️",
  "Non sei i tuoi errori. Sei quello che impari da essi 🌱",
  "Il coraggio non è non sbagliare, è ammettere di averlo fatto 🛡️",
  "Hai appena sbloccato un nuovo livello di esperienza! 🎮",
  "Errore = opportunità travestita da problema 🎭",
  "Stai collezionando saggezza, un errore alla volta 🧩",
  "Chi non rischia non sbaglia, ma nemmeno vive! 🌈",
  "Questo errore sarà una bella storia da raccontare un giorno 📝",
  "Sei più vicino alla soluzione di quanto pensi 🔑",
  "Anche Roma non è stata costruita in un giorno... e hanno sbagliato parecchio! 🏛️",
  "L'errore di oggi è la lezione di domani 📅",
  "Stai facendo pratica per diventare inarrestabile 🏃",
  "Ogni errore è un mattone nella costruzione del tuo successo 🧱",
  "Non mollare! I diamanti si formano sotto pressione 💠",
  "Hai il coraggio di sbagliare e questo ti rende speciale ⭐",
  "L'unico vero errore è smettere di provarci 🎯",
  "Stai imparando alla velocità della luce, anche se non sembra! ⚡",
  "Gli errori sono il GPS della vita: ti ricalcolano il percorso 🗺️",
  "Meglio sbagliare facendo che non fare nulla per paura 🦅",
  "Questo errore ha appena migliorato il tuo curriculum vitae interiore 📋",
  "Sei un guerriero. I guerrieri cadono e si rialzano 🗡️",
  "La vita è un laboratorio. Gli errori sono esperimenti! 🔬",
  "Hai sbagliato con stile, e questo conta qualcosa 😎",
  "Pensa a quanti errori hai già superato. Questo è solo un altro! 🏅",
  "Il fallimento è il condimento che dà sapore al successo 🍳",
  "Stai scrivendo la tua storia. Ogni errore è un capitolo importante 📕",
  "Non esiste crescita senza errori. Stai crescendo! 🌳",
  "Ogni volta che sbagli, il tuo cervello crea nuove connessioni 🧬",
  "Sei come il vino: migliori con ogni errore che passa 🍷",
  "L'errore è la madre dell'invenzione... o era la necessità? Vabbè, entrambe! 😂",
  "Hai sbagliato? Complimenti, sei un essere umano! 🎉",
  "Thomas Edison ha fallito 10.000 volte. Tu sei sulla buona strada! 💡",
  "Gli errori sono le cicatrici dell'anima: ti rendono unico 🌟",
  "Oggi errore, domani aneddoto divertente 😄",
  "Stai accumulando punti esperienza nella vita reale 🎮",
  "L'errore è solo un feedback, non un verdetto 📊",
  "Sei più resiliente di quanto credi 🌊",
  "Questo errore non ti definisce, la tua reazione sì 🪞",
  "Hai sbagliato? Perfetto, ora sai cosa NON fare 🚫",
  "La strada per il successo è lastricata di errori ben gestiti 🛤️",
  "Stai diventando un esperto in problem solving! 🧩",
  "Ogni errore è un investimento nel tuo futuro 💰",
  "Non preoccuparti, anche Google ha avuto i suoi bug 🐛",
  "Sei coraggioso: preferisci sbagliare che restare fermo 🏄",
  "L'errore di oggi è il consiglio che darai a qualcuno domani 🗣️",
  "Stai facendo ricerca sul campo. Si chiama esperienza! 🔍",
  "Niente panico! Anche i piloti hanno il simulatore per sbagliare 🛩️",
  "Hai sbagliato con consapevolezza, e questo fa tutta la differenza 🎓",
  "Il mondo appartiene a chi ha il coraggio di sbagliare 🌍",
  "Errore fatto, lezione presa, si riparte più forti 🔄",
  "Stai allenando il muscolo della resilienza 💪",
  "Chi sbaglia impara, chi impara migliora, chi migliora vince 🏆",
  "Questo errore è solo una virgola nella tua storia, non un punto 📝",
  "Sei come una fenice: risorgi sempre dalle ceneri dei tuoi errori 🔥",
  "L'importante è che tu sia qui, a tracciare e migliorare 📱",
  "Ogni errore è un seme piantato per il successo futuro 🌻",
  "Non sei solo: tutti sbagliano, pochi hanno il coraggio di ammetterlo 🤝",
  "Stai costruendo anticorpi contro gli errori futuri 🛡️",
  "Questo errore ti ha dato una storia in più da raccontare 🎬",
  "Sei un ricercatore della vita: ogni errore è un dato utile 📈",
  "La perfezione è sopravvalutata. L'autenticità no! 💯",
  "Hai sbagliato? Benvenuto nel club dei coraggiosi 🎖️",
  "Ogni errore è una porta che si apre verso qualcosa di nuovo 🚪",
  "Stai facendo progressi, anche se non li vedi ancora 🔭",
  "L'errore è il maestro più severo ma anche il più efficace 👨‍🏫",
  "Non contare gli errori, conta le volte che ti sei rialzato 📊",
  "Sei più forte dei tuoi errori, e lo stai dimostrando 🏋️",
  "Questo errore è già nel passato. Il futuro è tutto tuo! ⏰",
  "Stai collezionando badge di esperienza nella vita 🏅",
  "L'errore è temporaneo, la lezione è permanente 💫",
  "Hai il superpotere dell'autoconsapevolezza. Usalo bene! 🦸",
  "Ogni errore ti avvicina alla versione 2.0 di te stesso 🔄",
  "Non è un fallimento, è un prototipo della soluzione 🛠️",
  "Stai scrivendo il manuale di istruzioni della tua vita 📘",
  "Ricorda: anche i navigatori sbagliano strada, poi ricalcolano 🧭",
  "Sei fantastico anche quando sbagli. Anzi, soprattutto quando sbagli! 🌈"
];

function getRandomEncouragement() {
  return encouragements[Math.floor(Math.random() * encouragements.length)];
}

async function selectMood(mood) {
  try {
    await addEvent(mood);
    document.getElementById('confirm-text').innerHTML =
      `${moodEmojis[mood]} ${mood.charAt(0).toUpperCase() + mood.slice(1)} - registrato alle ${new Date().toLocaleTimeString('it-IT')}`;
    document.getElementById('encourage-text').textContent = getRandomEncouragement();
    navigate('confirm');
  } catch (err) {
    alert('Errore nel salvataggio!');
  }
}

// ===== Dashboard =====
const moodColors = {
  'ansia': '#e6b800',
  'delusione': '#607d8b',
  'frustrazione': '#FF9900',
  'imbarazzo': '#e91e63',
  'indifferenza': '#a8a8a8',
  'noia': '#9b59b6',
  'panico': '#ff5722',
  'rabbia': '#D13212',
  'rassegnazione': '#795548',
  'tranquillità': '#067D62',
  'tristezza': '#457b9d',
  'altro': '#95a5a6'
};

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function drawWeekChart(events) {
  const canvas = document.getElementById('weekChart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 200 * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width, H = 200;

  const days = getLast7Days();
  const counts = days.map(day => events.filter(e => e.created_at.slice(0, 10) === day).length);
  const maxVal = Math.max(...counts, 1);

  const pad = { top: 20, right: 20, bottom: 35, left: 40 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const barW = chartW / days.length * 0.6;
  const gap = chartW / days.length;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = '#e9ecef';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
  }

  // Bars
  counts.forEach((count, i) => {
    const x = pad.left + gap * i + (gap - barW) / 2;
    const barH = (count / maxVal) * chartH;
    const y = pad.top + chartH - barH;

    ctx.fillStyle = count > 0 ? '#FF9900' : '#e9ecef';
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH || 2, [4, 4, 0, 0]);
    ctx.fill();

    // Count on top
    if (count > 0) {
      ctx.fillStyle = '#0F1111';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(count, x + barW / 2, y - 5);
    }

    // Day label
    const dayLabel = days[i].slice(8, 10) + '/' + days[i].slice(5, 7);
    ctx.fillStyle = '#565959';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dayLabel, x + barW / 2, H - 10);
  });
}

function drawPieChart(moods, total) {
  const canvas = document.getElementById('pieChart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.scale(dpr, dpr);

  const cx = size / 2, cy = size / 2, radius = size / 2 - 10;
  let startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, size, size);

  if (moods.length === 0) {
    ctx.fillStyle = '#e9ecef';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#565959';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nessun dato', cx, cy);
    return;
  }

  moods.forEach(m => {
    const sliceAngle = (m.count / total) * Math.PI * 2;
    ctx.fillStyle = moodColors[m.mood] || '#ccc';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();

    // White border between slices
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    startAngle += sliceAngle;
  });

  // Inner circle for donut effect
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Total in center
  ctx.fillStyle = '#0F1111';
  ctx.font = `bold ${Math.round(radius * 0.28)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy - 8);
  ctx.font = `${Math.round(radius * 0.13)}px sans-serif`;
  ctx.fillStyle = '#565959';
  ctx.fillText('totale', cx, cy + 12);
}

function renderPieLegend(moods, total) {
  const legend = document.getElementById('pie-legend');
  if (moods.length === 0) {
    legend.innerHTML = '<p class="no-data">Vai a sbagliare!</p>';
    return;
  }
  legend.innerHTML = moods.map(m => {
    const pct = Math.round((m.count / total) * 100);
    return `
      <div class="pie-legend-item">
        <span class="pie-legend-color" style="background: ${moodColors[m.mood] || '#ccc'}"></span>
        <span class="pie-legend-label">${moodEmojis[m.mood] || ''} ${m.mood}</span>
        <span class="pie-legend-value">${m.count} (${pct}%)</span>
      </div>
    `;
  }).join('');
}

async function loadDashboard() {
  try {
    const events = await getAllEvents();
    const stats = computeStats(events);

    document.getElementById('stat-today').textContent = stats.today;
    document.getElementById('stat-week').textContent = stats.week;
    document.getElementById('stat-month').textContent = stats.month;
    document.getElementById('stat-total').textContent = stats.total;

    drawWeekChart(events);
    drawPieChart(stats.moods, stats.total);
    renderPieLegend(stats.moods, stats.total);
  } catch (err) {
    console.error('Errore caricamento stats:', err);
  }
}

// ===== Settings =====
function deleteLastEntry() {
  if (!confirm('Vuoi cancellare l\'ultimo errore registrato?')) return;
  const tx = db.transaction('events', 'readwrite');
  const store = tx.objectStore('events');
  const req = store.openCursor(null, 'prev');
  req.onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      cursor.delete();
      alert('Ultimo errore cancellato!');
    } else {
      alert('Nessun errore da cancellare.');
    }
  };
}

function clearAllData() {
  if (!confirm('Sei sicuro? Tutti i dati verranno cancellati permanentemente!')) return;
  if (!confirm('Davvero sicuro? Non si può tornare indietro!')) return;
  const tx = db.transaction('events', 'readwrite');
  tx.objectStore('events').clear();
  tx.oncomplete = () => alert('Tutti i dati sono stati cancellati.');
}

// ===== Share Encouragement =====
async function shareEncouragement() {
  const text = document.getElementById('encourage-text').textContent;
  if (navigator.share) {
    try {
      await navigator.share({ text: `Hai sbagliato! 🔴\n\n${text}` });
    } catch (err) {
      if (err.name !== 'AbortError') alert('Errore nella condivisione.');
    }
  } else {
    await navigator.clipboard.writeText(text);
    alert('Messaggio copiato negli appunti!');
  }
}

// ===== Backup & Restore =====
async function getBackupData() {
  const events = await getAllEvents();
  if (events.length === 0) { alert('Nessun dato da esportare.'); return null; }
  const json = JSON.stringify({ version: 1, exported: new Date().toISOString(), events }, null, 2);
  const csv = 'data,ora,umore\n' + events.map(e => {
    const d = new Date(e.created_at);
    return `${d.toLocaleDateString('it-IT')},${d.toLocaleTimeString('it-IT')},${e.mood}`;
  }).join('\n');
  const filename = `hai-sbagliato-backup-${new Date().toISOString().slice(0,10)}`;
  return { json, csv, filename };
}

async function exportBackup() {
  const backup = await getBackupData();
  if (!backup) return;
  const blob = new Blob([backup.json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backup.filename + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function shareBackup() {
  const backup = await getBackupData();
  if (!backup) return;
  const blob = new Blob([backup.csv], { type: 'text/csv' });
  const file = new File([blob], backup.filename + '.csv', { type: 'text/csv' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Hai sbagliato! Backup' });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  // Fallback: download CSV
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backup.filename + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.events || !Array.isArray(data.events)) {
        alert('File non valido.');
        return;
      }
      if (!confirm(`Importare ${data.events.length} eventi? I dati attuali verranno sostituiti.`)) return;

      // Clear existing
      await new Promise((resolve, reject) => {
        const tx = db.transaction('events', 'readwrite');
        tx.objectStore('events').clear();
        tx.oncomplete = () => resolve();
        tx.onerror = e => reject(e.target.error);
      });

      // Import
      await new Promise((resolve, reject) => {
        const tx = db.transaction('events', 'readwrite');
        const store = tx.objectStore('events');
        data.events.forEach(ev => {
          store.add({ mood: ev.mood, created_at: ev.created_at });
        });
        tx.oncomplete = () => resolve();
        tx.onerror = e => reject(e.target.error);
      });

      alert(`${data.events.length} eventi importati con successo!`);
    } catch (err) {
      alert('Errore nella lettura del file.');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ===== Updates =====
async function checkForUpdates() {
  const status = document.getElementById('update-status');
  status.textContent = 'Controllo in corso...';
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.update();
      if (reg.waiting) {
        status.textContent = '✅ Nuova versione trovata! Riavvia l\'app per aggiornare.';
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        setTimeout(() => location.reload(), 1500);
      } else {
        status.textContent = '✅ L\'app è aggiornata all\'ultima versione.';
      }
    } else {
      status.textContent = 'Service worker non trovato.';
    }
  } catch (err) {
    status.textContent = '❌ Errore nel controllo aggiornamenti.';
  }
}

// ===== Service Worker =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

// ===== Init =====
openDB();

// Sempre partire dalla home all'avvio
navigate('home');
