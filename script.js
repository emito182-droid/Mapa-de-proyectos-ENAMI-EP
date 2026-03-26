// Si existe DATA_CENTRAL (el archivo de GitHub), úsalo. Si no, usa el local.
let projects = (typeof DATA_CENTRAL !== 'undefined') ? DATA_CENTRAL : (JSON.parse(localStorage.getItem('enami_db_final')) || []);
let map, marker, mapDash, markersDash = [];
const mineralsList = ["ORO", "PLATA", "COBRE", "TITANO FERROSO", "CALIZA", "MOLIBDENO"];
const MASTER_KEY = "1234"; 

// 1. INICIALIZACIÓN DE MAPAS
function initMaps() {
    // Mapa Editor
    map = L.map('map').setView([-1.83, -78.18], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
    map.on('click', (e) => {
        updateEditorCoords(e.latlng.lat, e.latlng.lng);
    });

    // Mapa Dashboard
    mapDash = L.map('mapDashboard').setView([-1.83, -78.18], 6.5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapDash);
    
    renderMarkers();
}

// 2. RENDERIZADO DE MARCADORES (SOLO PROYECTOS)
function renderMarkers() {
    // Limpiar marcadores previos
    markersDash.forEach(m => mapDash.removeLayer(m));
    markersDash = [];

    projects.forEach(proj => {
        if (proj.concesiones && proj.concesiones.length > 0) {
            // Se posiciona en la primera concesión registrada
            const principal = proj.concesiones[0];
            let m = L.marker([principal.lat, principal.lng]).addTo(mapDash);
            
            // Etiqueta permanente con el nombre del PROYECTO
            m.bindTooltip(proj.nombreMaestro, {
                permanent: true, 
                direction: 'top',
                offset: [0, -10],
                className: 'font-bold uppercase'
            }).openTooltip();
            
            // Al hacer clic, despliega todas las concesiones en el panel lateral
            m.on('click', () => showProjectDetails(proj));
            markersDash.push(m);
        }
    });
}

// 3. PANEL LATERAL DE DETALLES
function showProjectDetails(proj) {
    const content = document.getElementById('panelContent');
    content.className = "text-left animate-in fade-in duration-500";
    
    let html = `
        <div class="mb-6 border-b pb-4">
            <h2 class="text-xl font-black text-[#002855] uppercase leading-tight">${proj.nombreMaestro}</h2>
            <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 text-center bg-slate-100 py-1 rounded">Expediente de Proyecto</p>
        </div>
        <div class="space-y-6">`;

    proj.concesiones.forEach(c => {
        html += `
            <div class="bg-white border rounded-lg p-4 shadow-sm border-l-4 border-[#002855]">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-sm font-bold uppercase text-slate-800">${c.nombre}</h3>
                    <button onclick="generatePDF('${proj.id}', '${c.codigo}')" class="text-[9px] bg-[#002855] text-white px-2 py-1 rounded font-bold uppercase hover:bg-blue-800">PDF</button>
                </div>
                <div class="text-[10px] space-y-2 text-slate-600">
                    <p><b>CÓDIGO:</b> ${c.codigo || 'S/N'}</p>
                    <p><b>UBICACIÓN:</b> ${c.provincia}, ${c.canton}, ${c.parroquia}</p>
                    <p><b>SUPERFICIE:</b> ${c.superficie} HA</p>
                    <p><b>RÉGIMEN:</b> ${c.regimen}</p>
                    <p><b>PERIODO:</b> ${c.periodo}</p>
                    <p><b>MINERALES:</b> ${c.minerales.join(', ')}</p>
                </div>
            </div>`;
    });
    
    content.innerHTML = html;
}

// 4. GENERACIÓN DE PDF
async function generatePDF(projId, cod) {
    const { jsPDF } = window.jspdf;
    const proj = projects.find(p => p.id == projId);
    const c = proj.concesiones.find(con => con.codigo == cod);
    const doc = new jsPDF();
    
    // Encabezado Corporativo
    doc.setFillColor(0, 40, 85);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('ENAMI EP - FICHA TÉCNICA MINERA', 14, 25);
    
    doc.autoTable({
        startY: 50,
        head: [['Atributo', 'Descripción Técnica']],
        body: [
            ['PROYECTO MAESTRO', proj.nombreMaestro],
            ['CONCESIÓN', c.nombre],
            ['CÓDIGO CATASTRAL', c.codigo],
            ['PROVINCIA', c.provincia],
            ['CANTÓN', c.canton],
            ['PARROQUIA', c.parroquia],
            ['TIPO DE MINERÍA', c.tipo],
            ['SUPERFICIE', c.superficie + ' Hectáreas'],
            ['RÉGIMEN', c.regimen],
            ['PERIODO', c.periodo],
            ['MINERALES', c.minerales.join(', ')],
            ['COORDENADAS (LAT/LNG)', `${c.lat}, ${c.lng}`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 40, 85] }
    });
    
    doc.save(`Ficha_${c.nombre}_ENAMI.pdf`);
}

// 5. NAVEGACIÓN Y ACCESO (CON CORRECCIÓN DE MAPA)
function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`${id}-section`).classList.remove('hidden');
    
    // El retraso permite que el CSS aplique el tamaño antes de recalcular el mapa
    setTimeout(() => {
        if(id === 'dashboard') {
            mapDash.invalidateSize(true);
            renderMarkers();
        }
        if(id === 'editor') {
            map.invalidateSize(true);
        }
    }, 450); 
}

function validatePass() {
    if (document.getElementById('adminPass').value === MASTER_KEY) { 
        sessionStorage.setItem('enami_auth', 'true'); 
        showSection('editor'); 
    } else alert("Clave inválida");
}

function checkAccess(target) {
    if (target === 'editor' && !sessionStorage.getItem('enami_auth')) showSection('login');
    else showSection(target);
}

// 6. FORMULARIO Y COORDENADAS
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
    
    projects.push({ 
        id: Date.now(), 
        nombreMaestro: document.getElementById('nombre_proyecto').value, 
        concesiones 
    });
    
    localStorage.setItem('enami_db_final', JSON.stringify(projects));
    alert("Expediente guardado correctamente.");
    location.reload();
});

// Inicialización
window.onload = () => {
    initMaps();
    addConcesionForm();
};