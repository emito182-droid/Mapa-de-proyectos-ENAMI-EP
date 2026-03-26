// 1. Detección de Datos (Prioriza Nube)
let projects = (typeof DATA_CENTRAL !== 'undefined') ? DATA_CENTRAL : (JSON.parse(localStorage.getItem('enami_db_final')) || []);
let map, marker, mapDash, markersDash = [];
const mineralsList = ["ORO", "PLATA", "COBRE", "TITANO FERROSO", "CALIZA", "MOLIBDENO"];
const MASTER_KEY = "1234";

// FUNCIÓN PARA GITHUB: Genera el archivo completo
function copyForGitHub() {
    const code = `const DATA_CENTRAL = ${JSON.stringify(projects, null, 4)};`;
    navigator.clipboard.writeText(code).then(() => {
        alert("¡CÓDIGO COPIADO!\n1. Ve a tu repositorio de GitHub.\n2. Abre 'proyectos.js'.\n3. Borra TODO y pega lo que acabas de copiar.\n4. Guarda los cambios en GitHub.");
    });
}

function initMaps() {
    map = L.map('map').setView([-1.83, -78.18], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    map.on('click', (e) => updateEditorCoords(e.latlng.lat, e.latlng.lng));

    mapDash = L.map('mapDashboard').setView([-1.83, -78.18], 6.5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapDash);
    renderMarkers();
}

function renderMarkers() {
    markersDash.forEach(m => mapDash.removeLayer(m));
    markersDash = [];
    projects.forEach(proj => {
        if (proj.concesiones.length > 0) {
            const pr = proj.concesiones[0];
            let m = L.marker([pr.lat, pr.lng]).addTo(mapDash);
            m.bindTooltip(proj.nombreMaestro, { permanent: true, direction: 'top', offset: [0, -10], className: 'font-bold uppercase' }).openTooltip();
            m.on('click', () => showProjectDetails(proj));
            markersDash.push(m);
        }
    });
}

function showProjectDetails(proj) {
    const content = document.getElementById('panelContent');
    content.innerHTML = `
        <div class="mb-6 border-b pb-4 flex justify-between items-center">
            <h2 class="text-xl font-black text-[#002855] uppercase leading-tight">${proj.nombreMaestro}</h2>
            <button onclick="editProject(${proj.id})" class="bg-yellow-500 text-white p-2 rounded">✎</button>
        </div>
        <div class="space-y-6">`;
    proj.concesiones.forEach(c => {
        content.innerHTML += `
            <div class="bg-white border rounded-lg p-4 shadow-sm border-l-4 border-[#002855] text-left">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-sm font-bold uppercase">${c.nombre}</h3>
                    <button onclick="generatePDF('${proj.id}', '${c.codigo}')" class="text-[9px] bg-slate-900 text-white px-2 py-1 rounded">PDF</button>
                </div>
                <div class="text-[10px] text-slate-600 space-y-1">
                    <p><b>CÓDIGO:</b> ${c.codigo}</p>
                    <p><b>SUPERFICIE:</b> ${c.superficie} HA</p>
                    <p><b>UBICACIÓN:</b> ${c.provincia}, ${c.canton}</p>
                    <p><b>MINERALES:</b> ${c.minerales.join(', ')}</p>
                </div>
            </div>`;
    });
}

function editProject(id) {
    const proj = projects.find(p => p.id == id);
    if (!proj) return;
    checkAccess('editor');
    document.getElementById('nombre_proyecto').value = proj.nombreMaestro;
    const container = document.getElementById('concesiones-container');
    container.innerHTML = ''; 
    proj.concesiones.forEach(c => {
        addConcesionForm();
        const lb = container.lastElementChild;
        lb.querySelector('.c-nombre').value = c.nombre;
        lb.querySelector('.c-codigo').value = c.codigo;
        lb.querySelector('.c-prov').value = c.provincia;
        lb.querySelector('.c-cant').value = c.canton;
        lb.querySelector('.c-parr').value = c.parroquia;
        lb.querySelector('.c-tipo').value = c.tipo;
        lb.querySelector('.c-sup').value = c.superficie; // Mantiene formato texto
        lb.querySelector('.c-reg').value = c.regimen;
        lb.querySelector('.c-per').value = c.periodo;
        lb.querySelector('.c-lat').value = c.lat;
        lb.querySelector('.c-lng').value = c.lng;
        lb.querySelectorAll('.c-min').forEach(ch => { if (c.minerales.includes(ch.value)) ch.checked = true; });
    });
    projects = projects.filter(p => p.id != id);
}

function addConcesionForm() {
    const container = document.getElementById('concesiones-container');
    const div = document.createElement('div');
    div.className = "concesion-box animate-fade-in border-l-4 border-[#002855]";
    div.innerHTML = `
        <button type="button" onclick="this.parentElement.remove()" class="absolute top-2 right-2 text-red-500 font-bold">×</button>
        <div class="grid grid-cols-2 gap-4 mb-4">
            <input type="text" class="c-nombre border-b p-2 text-xs font-bold uppercase" placeholder="CONCESIÓN" required>
            <input type="text" class="c-codigo border-b p-2 text-xs" placeholder="CÓDIGO">
        </div>
        <div class="grid grid-cols-3 gap-2 mb-4">
            <input type="text" class="c-prov border p-2 text-[9px] uppercase" placeholder="PROVINCIA">
            <input type="text" class="c-cant border p-2 text-[9px] uppercase" placeholder="CANTÓN">
            <input type="text" class="c-parr border p-2 text-[9px] uppercase" placeholder="PARROQUIA">
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
            <select class="c-tipo border p-1 text-[10px]"><option value="METÁLICA">METÁLICA</option><option value="NO METÁLICA">NO METÁLICA</option></select>
            <input type="text" class="c-sup border p-1 text-[10px]" placeholder="HECTÁREAS (Eje: 1.200,50)">
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4 text-[10px]">
            <select class="c-reg border p-1"><option value="GRAN MINERÍA">GRAN MINERÍA</option><option value="RÉGIMEN GENERAL">RÉGIMEN GENERAL</option><option value="PEQUEÑA MINERÍA">PEQUEÑA MINERÍA</option></select>
            <select class="c-per border p-1"><option value="EXPLORACIÓN INICIAL">EXPLORACIÓN INICIAL</option><option value="EXPLORACIÓN AVANZADA">EXPLORACIÓN AVANZADA</option><option value="EXPLORACIÓN-EXPLOTACIÓN">EXPLORACIÓN-EXPLOTACIÓN</option></select>
        </div>
        <div class="mb-4 flex flex-wrap gap-2">${mineralsList.map(m => `<label class="text-[9px] flex items-center gap-1 bg-slate-50 p-1"><input type="checkbox" class="c-min" value="${m}"> ${m}</label>`).join('')}</div>
        <div class="grid grid-cols-2 gap-2"><input type="number" step="any" class="c-lat border p-2 text-[10px]" placeholder="LAT"><input type="number" step="any" class="c-lng border p-2 text-[10px]" placeholder="LNG"></div>`;
    container.appendChild(div);
}

document.getElementById('mainForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const concesiones = Array.from(document.querySelectorAll('.concesion-box')).map(box => ({
        nombre: box.querySelector('.c-nombre').value,
        codigo: box.querySelector('.c-codigo').value,
        provincia: box.querySelector('.c-prov').value,
        canton: box.querySelector('.c-cant').value,
        parroquia: box.querySelector('.c-parr').value,
        tipo: box.querySelector('.c-tipo').value,
        superficie: box.querySelector('.c-sup').value, // Guarda como texto exacto
        regimen: box.querySelector('.c-reg').value,
        periodo: box.querySelector('.c-per').value,
        minerales: Array.from(box.querySelectorAll('.c-min:checked')).map(i => i.value),
        lat: parseFloat(box.querySelector('.c-lat').value),
        lng: parseFloat(box.querySelector('.c-lng').value)
    }));
    projects.push({ id: Date.now(), nombreMaestro: document.getElementById('nombre_proyecto').value, concesiones });
    localStorage.setItem('enami_db_final', JSON.stringify(projects));
    alert("Datos Guardados Localmente.\nNo olvides presionar el botón verde para actualizar GitHub.");
    location.reload();
});

async function generatePDF(pId, cod) {
    const { jsPDF } = window.jspdf;
    const pr = projects.find(p => p.id == pId);
    const c = pr.concesiones.find(con => con.codigo == cod);
    const doc = new jsPDF();
    doc.setFillColor(0, 40, 85); doc.rect(0, 0, 210, 40, 'F'); doc.setTextColor(255, 255, 255); doc.text('ENAMI EP', 14, 25);
    doc.autoTable({ startY: 50, body: [['PROYECTO', pr.nombreMaestro],['CONCESIÓN', c.nombre],['UBICACIÓN', c.provincia],['SUPERFICIE', c.superficie + ' HA']], theme: 'striped' });
    doc.save(`Ficha_${c.nombre}.pdf`);
}

function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`${id}-section`).classList.remove('hidden');
    setTimeout(() => { if(id === 'dashboard') { mapDash.invalidateSize(); renderMarkers(); } if(id === 'editor') map.invalidateSize(); }, 450); 
}

function validatePass() { if (document.getElementById('adminPass').value === MASTER_KEY) { sessionStorage.setItem('enami_auth', 'true'); showSection('editor'); } else alert("Clave inválida"); }
function checkAccess(t) { if (t === 'editor' && !sessionStorage.getItem('enami_auth')) showSection('login'); else showSection(t); }
function updateEditorCoords(lat, lng) { if (marker) marker.setLatLng([lat, lng]); else marker = L.marker([lat, lng]).addTo(map); const lI = document.querySelectorAll('.c-lat'); const nI = document.querySelectorAll('.c-lng'); if (lI.length > 0) { lI[lI.length - 1].value = lat.toFixed(6); nI[nI.length - 1].value = lng.toFixed(6); } }

window.onload = () => { initMaps(); addConcesionForm(); };