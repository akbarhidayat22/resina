// ==========================================
// 1. Inisialisasi Data dari RESINA 
// ==========================================
let weight = 342;
let bat = 88;

// Data Lingkungan & Cuaca
let isRaining = false;
let currentTemp = 22.5;

// Data Koordinat Geofencing
let ORIGIN_LAT = -5.2280;
let ORIGIN_LON = 119.8520;
let currLat = ORIGIN_LAT;
let currLon = ORIGIN_LON;

let isStolen = false;
let isRelocating = false; 
let activeMarker; 

// ==========================================
// 2. Inisialisasi Peta (Leaflet.js)
// ==========================================
var map = L.map('main-map').setView([ORIGIN_LAT, ORIGIN_LON], 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const trees = [
    { id: 'PN-01', lat: -5.2285, lon: 119.8510 },
    { id: 'PN-02', lat: -5.2290, lon: 119.8530 },
    { id: 'PN-03', lat: -5.2300, lon: 119.8500 },
    { id: 'PN-042 (Alat Kita)', lat: ORIGIN_LAT, lon: ORIGIN_LON, current: true },
    { id: 'PN-05', lat: -5.2270, lon: 119.8540 },
];

trees.forEach(tree => {
    const color = tree.current ? 'red' : 'blue';
    const marker = L.circleMarker([tree.lat, tree.lon], {
        color: color, fillColor: color, fillOpacity: 0.8, radius: 8
    }).addTo(map);
    
    marker.bindPopup(`<strong>${tree.id}</strong>`);
    if(tree.current) activeMarker = marker; 
});

// ==========================================
// 3. Logika Pembaruan Sensor & GPS
// ==========================================
function updateDashboard() {
    // Fluktuasi Suhu Alami
    if (!isRaining) {
        currentTemp = 22.5 + (Math.sin(Date.now() / 10000) * 1.5);
    }
    document.getElementById('temp-val').innerText = `${currentTemp.toFixed(1)} °C`;

    if (isRelocating) {
        return; 
    }

    if (!isStolen) {
        // Mode Normal: update berat produksi
        weight = Math.min(500, weight + (Math.random() * 0.5));
        document.getElementById('weight').innerHTML = `${weight.toFixed(1)} <span class="unit text-bold">gram</span>`;
        document.getElementById('weight-meter').style.width = `${(weight / 500) * 100}%`;
        
    } else {
        // Mode Pencurian
        currLat -= 0.00002; 
        currLon += 0.00003; 
        activeMarker.setLatLng([currLat, currLon]); 
        
        let distance = map.distance([ORIGIN_LAT, ORIGIN_LON], [currLat, currLon]);
        map.panTo([currLat, currLon]);

        document.getElementById('tree-info').innerHTML = `
            <p class="text-danger">🚨 PERINGATAN: INDIKASI PENCURIAN! 🚨</p>
            <p><strong>Status Alat:</strong> BERGERAK DI LUAR GEOFENCE!</p>
            <p><strong>Jarak dari Pohon:</strong> <span class="text-danger">${distance.toFixed(1)} meter</span></p>
            <p><strong>Koordinat Pelacakan:</strong> ${currLat.toFixed(5)}, ${currLon.toFixed(5)}</p>
        `;
    }
}

// ==========================================
// 4. LOGIKA KECERDASAN CUACA (SMART TAP)
// ==========================================
function toggleRain() {
    isRaining = !isRaining;
    const rainEl = document.getElementById('rain-val');
    const autoEl = document.getElementById('auto-status');

    if (isRaining) {
        currentTemp -= 3.0;
        rainEl.innerText = "🌧️ Hujan Turun";
        rainEl.style.color = "var(--blue)";
        
        autoEl.innerText = "Ditunda (Cuaca Buruk)";
        autoEl.style.color = "var(--red)";
        
        addLog("SENSOR_HUJAN:", "Air terdeteksi! Jadwal otomatis ditangguhkan untuk mencegah pelunturan asam salisilat.", "var(--amber)");
    } else {
        rainEl.innerText = "☀️ Cerah";
        rainEl.style.color = "var(--text-main)";
        
        autoEl.innerText = "Menunggu Waktu Optimal";
        autoEl.style.color = "var(--green)";
        
        addLog("SENSOR_HUJAN:", "Hujan reda. Melanjutkan pemantauan jadwal penyadapan optimal.", "var(--green)");
    }
}

function triggerAutoTap() {
    if (isStolen || isRelocating) {
        alert("Sistem terkunci atau sedang dalam pemeliharaan!");
        return;
    }
    
    if (isRaining) {
        addLog("SMART_SISTEM:", "Gagal memulai penyadapan otomatis: Cuaca hujan. Sistem akan menunggu hingga hujan reda.", "var(--red)");
        alert("Sistem Cerdas Mencegah Penyadapan: Sedang Hujan! Asam salisilat akan luntur.");
        return;
    }

    addLog("SMART_SISTEM:", "Waktu 07:00 tiba (Turgor optimal, Cuaca Cerah). Memulai sekuens penyadapan otomatis (Auto-Tap)...", "var(--green)");
    
    document.getElementById('auto-status').innerText = "Sedang Menyadap...";
    document.getElementById('auto-status').style.color = "var(--blue)";

    setTimeout(() => {
        sendCommand('TEST_SCRAPER');
    }, 1500);

    setTimeout(() => {
        sendCommand('TEST_OSCILLATION');
    }, 4500);

    setTimeout(() => {
        sendCommand('TEST_NOZZLE');
        document.getElementById('auto-status').innerText = "Siklus Selesai (Standby)";
        document.getElementById('auto-status').style.color = "var(--green)";
    }, 8000);
}

// ==========================================
// 5. Logika Keamanan & Relokasi (Geofencing)
// ==========================================
function simulateTheft() {
    if (isRelocating) return;
    isStolen = true;
    const statusChip = document.getElementById('global-status');
    statusChip.innerText = "🚨 ALARM: PERPINDAHAN ILEGAL";
    statusChip.className = "status-chip status-theft"; 
    document.getElementById('operation-mode').innerText = "MODE: TERKUNCI (LOCKED)";
    document.getElementById('operation-mode').style.color = "var(--red)";
    addLog("PELANGGARAN_GEOFENCE:", "Alat bergerak menjauhi titik jangkar! Mengunci aktuator...", "red");
}

function resetAlarm() {
    isStolen = false;
    isRelocating = false;
    
    currLat = ORIGIN_LAT;
    currLon = ORIGIN_LON;
    activeMarker.setLatLng([ORIGIN_LAT, ORIGIN_LON]); 
    map.setView([ORIGIN_LAT, ORIGIN_LON], 16);
    
    const statusChip = document.getElementById('global-status');
    statusChip.innerText = "STATUS: ONLINE";
    statusChip.className = "status-chip online";
    statusChip.style = "";
    document.getElementById('operation-mode').innerText = "MODE: OTOMATIS";
    document.getElementById('operation-mode').style.color = "var(--blue)";

    document.getElementById('tree-info').innerHTML = `
        <p><strong>Lokasi:</strong> Hutan Pinus Malino, Sulsel</p>
        <p><strong>Diameter Pohon:</strong> Ø 45 cm</p>
        <p><strong>Terakhir Disadap:</strong> Baru saja</p>
        <p><strong>Dosis Stimulan:</strong> Asam Salisilat 5 ml</p>
    `;
    addLog("SISTEM_PULIH:", "Sistem di-reset ke mode normal.", "var(--green)");
}

function enableRelocation() {
    isRelocating = true;
    isStolen = false; 
    const statusChip = document.getElementById('global-status');
    statusChip.innerText = "STATUS: MODE RELOKASI";
    statusChip.className = "status-chip"; 
    statusChip.style.background = "var(--amber)";
    statusChip.style.color = "white";
    document.getElementById('operation-mode').innerText = "MODE: STANDBY";
    addLog("MODE_RELOKASI:", "Geofencing dinonaktifkan sementara. Aman untuk dipindahkan.", "var(--amber)");
}

// ==========================================
// 6. Logika Tombol Panel Kontrol Manual
// ==========================================
function sendCommand(command) {
    if(isStolen && command !== 'EMERGENCY_STOP') return;
    if(isRelocating && command !== 'EMERGENCY_STOP') return;
    
    addLog("TRANSMISI_LORA:", `Mengirim sinyal [${command}]...`, "var(--blue)");
    
    setTimeout(() => {
        if(command === 'EMERGENCY_STOP') {
            document.getElementById('global-status').innerText = "STATUS: TERHENTI (E-STOP)";
            document.getElementById('global-status').style.background = "var(--red)";
            document.getElementById('global-status').style.color = "white";
            addLog("SISTEM_DARURAT:", "Semua aktuator dihentikan paksa.", "red");
        } 
        else if (command === 'CALIBRATE_SCALE') {
            weight = 0; 
            document.getElementById('weight').innerHTML = `0.0 <span class="unit text-bold">gram</span>`;
            document.getElementById('weight-meter').style.width = `0%`;
            addLog("KALIBRASI:", "Sensor Load Cell di-reset ke 0 gram.", "var(--green)");
        }
        else if (command === 'TEST_NOZZLE') addLog("AKSI_FISIK:", "Menyemprotkan 5ml stimulan asam salisilat.", "var(--green)");
        else if (command === 'TEST_SCRAPER') addLog("AKSI_FISIK:", "Menjalankan 1 Siklus Pembersihan Kulit Kayu.", "var(--green)");
        else if (command === 'TEST_OSCILLATION') addLog("AKSI_FISIK:", "Menjalankan 1 Siklus Penyadapan Osilasi.", "var(--green)");
    }, 1500); 
}

function addLog(title, msg, titleColor = "var(--blue)") {
    const logBox = document.getElementById('system-logs');
    const now = new Date().toLocaleTimeString('id-ID');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${now}]</span> <span class="encrypted" style="color: ${titleColor};">${title}</span> ${msg}`;
    logBox.prepend(entry);
}

setInterval(updateDashboard, 1000);