// Interfaz de la Biblioteca de Ejercicios: consume la API REST con fetch
const API = "/api/ejercicios";

const $ = (sel) => document.querySelector(sel);
const lista = $("#lista");
const dlgDetalle = $("#dlgDetalle");
const dlgForm = $("#dlgForm");

let grupoActual = "";
let textoBusqueda = "";
let ejercicioAbierto = null;

// Utilidades
function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

// Obtiene el ID de un video de YouTube a partir de cualquier formato de enlace
function idYouTube(url) {
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

function miniatura(ej) {
  if (ej.imagen_url) return ej.imagen_url;
  const id = idYouTube(ej.video_url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

function aviso(mensaje) {
  const el = $("#aviso");
  el.textContent = mensaje;
  el.classList.add("visible");
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => el.classList.remove("visible"), 2600);
}

async function pedir(url, opciones = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error || "Ocurrió un error.");
  return datos;
}

// Consultar todos
async function cargar() {
  const params = new URLSearchParams();
  if (textoBusqueda) params.set("q", textoBusqueda);
  if (grupoActual) params.set("grupo", grupoActual);

  try {
    const ejercicios = await pedir(`${API}?${params}`);
    pintar(ejercicios);
  } catch (err) {
    lista.innerHTML = `<p class="vacio">${escapar(err.message)}</p>`;
  }
}

function pintar(ejercicios) {
  $("#contador").textContent =
    ejercicios.length === 1 ? "1 ejercicio" : `${ejercicios.length} ejercicios`;

  if (!ejercicios.length) {
    lista.innerHTML = `<p class="vacio">No hay ejercicios que coincidan. ¡Agrega uno nuevo!</p>`;
    return;
  }

  lista.innerHTML = ejercicios
    .map((ej) => {
      const img = miniatura(ej);
      return `
      <button class="tarjeta" data-id="${ej.id}" aria-label="Ver ${escapar(ej.nombre)}">
        <div class="miniatura">
          ${img ? `<img src="${escapar(img)}" alt="" loading="lazy" onerror="this.remove()" />` : ""}
          <span class="play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
          </span>
        </div>
        <div class="tarjeta-cuerpo">
          <h3>${escapar(ej.nombre)}</h3>
          <div class="etiquetas">
            <span class="etiqueta grupo">${escapar(ej.grupo_muscular)}</span>
            <span class="etiqueta">${escapar(ej.nivel)}</span>
          </div>
        </div>
      </button>`;
    })
    .join("");
}

// Consultar uno
async function verDetalle(id) {
  try {
    const ej = await pedir(`${API}/${id}`);
    ejercicioAbierto = ej;
    $("#detTitulo").textContent = ej.nombre;
    $("#detDescripcion").textContent = ej.descripcion || "Sin descripción.";
    $("#detEtiquetas").innerHTML = `
      <div class="etiquetas">
        <span class="etiqueta grupo">${escapar(ej.grupo_muscular)}</span>
        <span class="etiqueta">${escapar(ej.nivel)}</span>
      </div>`;

    const idVideo = idYouTube(ej.video_url);
    $("#detMedia").innerHTML = idVideo
      ? `<iframe src="https://www.youtube-nocookie.com/embed/${idVideo}" title="${escapar(ej.nombre)}"
           allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>`
      : `<div class="media-enlace"><a href="${escapar(ej.video_url)}" target="_blank" rel="noopener">Ver video ↗</a></div>`;

    dlgDetalle.showModal();
  } catch (err) {
    aviso(err.message);
  }
}

// Agregar / editar
function abrirFormulario(ej = null) {
  $("#formTitulo").textContent = ej ? "Editar ejercicio" : "Nuevo ejercicio";
  $("#fId").value = ej?.id ?? "";
  $("#fNombre").value = ej?.nombre ?? "";
  $("#fGrupo").value = ej?.grupo_muscular ?? "Pecho";
  $("#fNivel").value = ej?.nivel ?? "Principiante";
  $("#fVideo").value = ej?.video_url ?? "";
  $("#fImagen").value = ej?.imagen_url ?? "";
  $("#fDescripcion").value = ej?.descripcion ?? "";
  $("#formError").textContent = "";
  dlgForm.showModal();
  $("#fNombre").focus();
}

$("#formEjercicio").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = $("#fId").value;
  const datos = {
    nombre: $("#fNombre").value,
    grupo_muscular: $("#fGrupo").value,
    nivel: $("#fNivel").value,
    video_url: $("#fVideo").value,
    imagen_url: $("#fImagen").value,
    descripcion: $("#fDescripcion").value,
  };

  try {
    await pedir(id ? `${API}/${id}` : API, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(datos),
    });
    dlgForm.close();
    aviso(id ? "Ejercicio actualizado" : "Ejercicio agregado");
    cargar();
  } catch (err) {
    $("#formError").textContent = err.message;
  }
});

// Eliminar
async function eliminar(ej) {
  if (!confirm(`¿Eliminar "${ej.nombre}"?`)) return;
  try {
    await pedir(`${API}/${ej.id}`, { method: "DELETE" });
    dlgDetalle.close();
    aviso("Ejercicio eliminado");
    cargar();
  } catch (err) {
    aviso(err.message);
  }
}

// Eventos
lista.addEventListener("click", (e) => {
  const tarjeta = e.target.closest(".tarjeta");
  if (tarjeta) verDetalle(tarjeta.dataset.id);
});

$("#btnNuevo").addEventListener("click", () => abrirFormulario());
$("#detEditar").addEventListener("click", () => {
  dlgDetalle.close();
  abrirFormulario(ejercicioAbierto);
});
$("#detEliminar").addEventListener("click", () => eliminar(ejercicioAbierto));

// Detiene el video al cerrar el detalle
dlgDetalle.addEventListener("close", () => ($("#detMedia").innerHTML = ""));

document
  .querySelectorAll("[data-cerrar]")
  .forEach((btn) =>
    btn.addEventListener("click", () => btn.closest("dialog").close()),
  );
// Cerrar al dar clic fuera del cuadro
[dlgDetalle, dlgForm].forEach((dlg) =>
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  }),
);

$("#filtros").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  document
    .querySelectorAll(".chip")
    .forEach((c) => c.classList.remove("activo"));
  chip.classList.add("activo");
  grupoActual = chip.dataset.grupo;
  cargar();
});

let espera;
$("#buscar").addEventListener("input", (e) => {
  clearTimeout(espera);
  espera = setTimeout(() => {
    textoBusqueda = e.target.value.trim();
    cargar();
  }, 300);
});

cargar();
