// 1. Prioridad de datos: GitHub (DATA_CENTRAL) o LocalStorage
let projects = (typeof DATA_CENTRAL !== 'undefined') ? DATA_CENTRAL : (JSON.parse(localStorage.getItem('enami_db_final')) || []);
let map, marker, mapDash, markersDash = [];
const mineralsList = ["ORO", "PLATA", "COBRE", "TITANO FERROSO", "CALIZA", "MOLIBDENO"];
const MASTER_KEY = "1234";

// 2. FUNCIÓN PARA CARGAR DATOS AL FORMULARIO (EDICIÓN)
function editProject(id) {
    const proj = projects.find(p => p.id == id);
    if (!proj) return;

    // Abrir el editor
    checkAccess('editor');

    // Llenar datos maestros
    document.getElementById('nombre_proyecto').value = proj.nombreMaestro;
    const container = document.getElementById('concesiones-container');
    container.innerHTML = ''; // Limpiar formularios previos

    // Reconstruir cada concesión
    proj.concesiones.forEach(c => {
        addConcesionForm();
        const lastBox = container.lastElementChild;
        
        lastBox.querySelector('.c-nombre').value = c.nombre;
        lastBox.querySelector('.c-codigo').value = c.codigo;
        lastBox.querySelector('.c-prov').value = c.provincia;
        lastBox.querySelector('.c-cant').value = c.canton;
        lastBox.querySelector('.c-parr').value = c.parroquia;
        lastBox.querySelector('.c-tipo').value = c.tipo;
        lastBox.querySelector('.c-sup').value = c.superficie;
        lastBox.querySelector('.c-reg').value = c.regimen;
        lastBox.querySelector('.c-per').value = c.periodo;
        lastBox.querySelector('.c-lat').value = c.lat;
        lastBox.querySelector('.c-lng').value = c.lng;

        // Marcar minerales
        const checks = lastBox.querySelectorAll('.c-min');
        checks.forEach(check => {
            if (c.minerales.includes(check.value)) check.checked = true;
        });
    });

    // Eliminar el proyecto viejo de la lista local para que al guardar se "actualice"
    projects = projects.filter(p => p.id != id);
}

// 3. ACTUALIZACIÓN DEL PANEL LATERAL (Añadido botón de edición)
function showProjectDetails(proj) {
    const content = document.getElementById('panelContent');
    content.className = "text-left animate-in fade-in duration-500";
    
    let html = `
        <div class="mb-6 border-b pb-4 flex justify-between items-center">
            <div>
                <h2 class="text-xl font-black text-[#002855] uppercase leading-tight">${proj.nombreMaestro}</h2>
                <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Proyecto Maestro</p>
            </div>
            <button onclick="editProject(${proj.id})" class="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 transition shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            </button>
        </div>
        <div class="space-y-6">`;

    proj.concesiones.forEach(c => {
        html += `
            <div class="bg-white border rounded-lg p-4 shadow-sm border-l-4 border-[#002855]">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-sm font-bold uppercase text-slate-800">${c.nombre}</h3>
                    <button onclick="generatePDF('${proj.id}', '${c.codigo}')" class="text-[9px] bg-slate-900 text-white px-2 py-1 rounded font-bold uppercase">PDF</button>
                </div>
                <div class="text-[10px] space-y-2 text-slate-600">
                    <p><b>UBICACIÓN:</b> ${c.provincia}, ${c.canton}</p>
                    <p><b>SUPERFICIE:</b> ${c.superficie} HA</p>
                    <p><b>MINERALES:</b> ${c.minerales.join(', ')}</p>
                </div>
            </div>`;
    });
    content.innerHTML = html;
}

// 4. FUNCIONES DE MAPA E INICIALIZACIÓN (Sin cambios)
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
            const principal = proj.concesiones[0];
            let m = L.marker([principal.lat, principal.lng]).addTo(mapDash);
            m.bindTooltip(proj.nombreMaestro, { permanent: true, direction: 'top', offset: [0, -10], className: 'font-bold uppercase' }).openTooltip();
            m.on('click', () => showProjectDetails(proj));
            markersDash.push(m);
        }
    });
}

// ... Mantener funciones: generatePDF, updateEditorCoords, addConcesionForm, mainForm submit, showSection, validatePass, checkAccess, export/import ...

function addConcesionForm() {
    const container = document.getElementById('concesiones-container');
    const div = document.createElement('div');
    div.className = "concesion-box animate-fade-in border-l-4 border-[#002855]";
    div.innerHTML = `
        <button type="button" onclick="this.parentElement.remove()" class="absolute top-2 right-2 text-red-500 font-bold">×</button>
        <div class="grid grid-cols-2 gap-4 mb-4">
            <input type="text" class="c-nombre border-b p-2 text-xs font-bold uppercase" placeholder="NOMBRE CONCESIÓN" required>
            <input type="text" class="c-codigo border-b p-2 text-xs" placeholder="CÓDIGO">
        </div>
        <div class="grid grid-cols-3 gap-2 mb-4">
            <input type="text" class="c-prov border p-2 text-[9px] uppercase" placeholder="PROVINCIA">
            <input type="text" class="c-cant border p-2 text-[9px] uppercase" placeholder="CANTÓN">
            <input type="text" class="c-parr border p-2 text-[9px] uppercase" placeholder="PARROQUIA">
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4 text-[10px]">
            <select class="c-tipo border p-1"><option value="METÁLICA">METÁLICA</option><option value="NO METÁLICA">NO METÁLICA</option></select>
            <input type="number" class="c-sup border p-1" placeholder="HECTÁREAS">
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4 text-[10px]">
            <select class="c-reg border p-1"><option value="GRAN MINERÍA">GRAN MINERÍA</option><option value="RÉGIMEN GENERAL">RÉGIMEN GENERAL</option><option value="PEQUEÑA MINERÍA">PEQUEÑA MINERÍA</option></select>
            <select class="c-per border p-1"><option value="EXPLORACIÓN INICIAL">EXPLORACIÓN INICIAL</option><option value="EXPLORACIÓN AVANZADA">EXPLORACIÓN AVANZADA</option><option value="EXPLORACIÓN-EXPLOTACIÓN">EXPLORACIÓN-EXPLOTACIÓN</option></select>
        </div>
        <div class="mb-4">
            <div class="flex flex-wrap gap-2">
                ${mineralsList.map(m => `<label class="text-[9px] flex items-center gap-1 bg-slate-100 p-1 rounded"><input type="checkbox" class="c-min" value="${m}"> ${m}</label>`).join('')}
            </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
            <input type="number" step="any" class="c-lat border p-2 text-[10px]" placeholder="LATITUD">
            <input type="number" step="any" class="c-lng border p-2 text-[10px]" placeholder="LONGITUD">
        </div>
    `;
    container.appendChild(div);
}

document.getElementById('mainForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const boxes = document.querySelectorAll('.concesion-box');
    const concesiones = Array.from(boxes).map(box => ({
        nombre: box.querySelector('.c-nombre').value,
        codigo: box.querySelector('.c-codigo').value,
        provincia: box.querySelector('.c-prov').value,
        canton: box.querySelector('.c-cant').value,
        parroquia: box.querySelector('.c-parr').value,
        tipo: box.querySelector('.c-tipo').value,
        superficie: box.querySelector('.c-sup').value,
        regimen: box.querySelector('.c-reg').value,
        periodo: box.querySelector('.c-per').value,
        minerales: Array.from(box.querySelectorAll('.c-min:checked')).map(i => i.value),
        lat: parseFloat(box.querySelector('.c-lat').value),
        lng: parseFloat(box.querySelector('.c-lng').value)
    }));
    projects.push({ id: Date.now(), nombreMaestro: document.getElementById('nombre_proyecto').value, concesiones });
    localStorage.setItem('enami_db_final', JSON.stringify(projects));
    alert("Datos Guardados localmente. Recuerde exportar y actualizar proyectos.js para GitHub.");
    location.reload();
});

function updateEditorCoords(lat, lng) {
    if (marker) marker.setLatLng([lat, lng]);
    else marker = L.marker([lat, lng]).addTo(map);
    const latInputs = document.querySelectorAll('.c-lat');
    const lngInputs = document.querySelectorAll('.c-lng');
    if (latInputs.length > 0) {
        latInputs[latInputs.length - 1].value = lat.toFixed(6);
        lngInputs[lngInputs.length - 1].value = lng.toFixed(6);
    }
}

function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`${id}-section`).classList.remove('hidden');
    setTimeout(() => {
        if(id === 'dashboard') { mapDash.invalidateSize(); renderMarkers(); }
        if(id === 'editor') { map.invalidateSize(); }
    }, 450); 
}

function validatePass() {
    if (document.getElementById('adminPass').value === MASTER_KEY) { sessionStorage.setItem('enami_auth', 'true'); showSection('editor'); }
    else alert("Clave inválida");
}

function checkAccess(target) {
    if (target === 'editor' && !sessionStorage.getItem('enami_auth')) showSection('login');
    else showSection(target);
}

function exportData() {
    const blob = new Blob([JSON.stringify(projects)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = "DB_ENAMI_ACTUALIZADA.json"; a.click();
}

window.onload = () => { initMaps(); addConcesionForm(); };