// Biblioteca de ejercicios - servidor Node.js + Express + PostgreSQL
const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// Render entrega la conexión en DATABASE_URL.
// La URL externa de Render (con ".render.com") necesita SSL; la interna no.
const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ejercicios";
const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("render.com") ? { rejectUnauthorized: false } : false,
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- Base de datos: crea la tabla y datos de ejemplo si no existen ----------
async function inicializarBD() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ejercicios (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      grupo_muscular VARCHAR(50) NOT NULL,
      nivel VARCHAR(20) NOT NULL DEFAULT 'Principiante',
      descripcion TEXT,
      video_url TEXT NOT NULL,
      imagen_url TEXT,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS total FROM ejercicios");
  if (rows[0].total === 0) {
    const ejemplos = [
      ["Press de banca", "Pecho", "Intermedio",
        "Ejercicio básico de empuje horizontal. Retrae escápulas, baja la barra controlada a la parte baja del pecho y empuja sin despegar los glúteos.",
        "https://www.youtube.com/watch?v=4Y2ZdHCOXok"],
      ["Sentadilla con barra", "Pierna", "Intermedio",
        "Rey del tren inferior. Pies a la anchura de hombros, pecho arriba, rodillas en línea con las puntas y profundidad controlada.",
        "https://www.youtube.com/watch?v=I7eR8d0cNQQ"],
      ["Peso muerto", "Espalda", "Avanzado",
        "Bisagra de cadera con barra desde el suelo. Espalda neutra, barra pegada a las piernas y empuja el piso con los pies.",
        "https://www.youtube.com/watch?v=heqIRjWWiLE"],
      ["Dominadas", "Espalda", "Intermedio",
        "Tracción vertical con el peso corporal. Rango completo, escápulas abajo y evita convertirla en un curl de bíceps.",
        "https://www.youtube.com/watch?v=02HC33YMzew"],
      ["Press militar", "Hombro", "Intermedio",
        "Empuje vertical de pie con barra. Glúteos y abdomen firmes, la barra sube en línea recta sobre la cabeza.",
        "https://www.youtube.com/watch?v=JtHjdO1TmPw"],
    ];
    for (const e of ejemplos) {
      await pool.query(
        `INSERT INTO ejercicios (nombre, grupo_muscular, nivel, descripcion, video_url)
         VALUES ($1, $2, $3, $4, $5)`,
        e
      );
    }
    console.log("Datos de ejemplo insertados.");
  }
}

// ---------- Validación ----------
const GRUPOS = ["Pecho", "Espalda", "Pierna", "Hombro", "Brazo", "Core"];
const NIVELES = ["Principiante", "Intermedio", "Avanzado"];

function validar(body) {
  const datos = {
    nombre: (body.nombre || "").trim(),
    grupo_muscular: body.grupo_muscular,
    nivel: body.nivel,
    descripcion: (body.descripcion || "").trim(),
    video_url: (body.video_url || "").trim(),
    imagen_url: (body.imagen_url || "").trim() || null,
  };
  if (!datos.nombre) return { error: "El nombre es obligatorio." };
  if (!GRUPOS.includes(datos.grupo_muscular)) return { error: "Grupo muscular no válido." };
  if (!NIVELES.includes(datos.nivel)) return { error: "Nivel no válido." };
  if (!/^https?:\/\//i.test(datos.video_url)) return { error: "El enlace del video debe empezar con http:// o https://" };
  if (datos.imagen_url && !/^https?:\/\//i.test(datos.imagen_url))
    return { error: "El enlace de la imagen debe empezar con http:// o https://" };
  return { datos };
}

// ---------- API REST ----------
// Consultar todos (con búsqueda y filtro opcionales)
app.get("/api/ejercicios", async (req, res) => {
  try {
    const condiciones = [];
    const valores = [];
    if (req.query.q) {
      valores.push(`%${req.query.q}%`);
      condiciones.push(`(nombre ILIKE $${valores.length} OR descripcion ILIKE $${valores.length})`);
    }
    if (req.query.grupo) {
      valores.push(req.query.grupo);
      condiciones.push(`grupo_muscular = $${valores.length}`);
    }
    const where = condiciones.length ? "WHERE " + condiciones.join(" AND ") : "";
    const { rows } = await pool.query(`SELECT * FROM ejercicios ${where} ORDER BY id`, valores);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar los ejercicios." });
  }
});

// Consultar uno
app.get("/api/ejercicios/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM ejercicios WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Ejercicio no encontrado." });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: "ID no válido." });
  }
});

// Agregar
app.post("/api/ejercicios", async (req, res) => {
  const { datos, error } = validar(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const { rows } = await pool.query(
      `INSERT INTO ejercicios (nombre, grupo_muscular, nivel, descripcion, video_url, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [datos.nombre, datos.grupo_muscular, datos.nivel, datos.descripcion, datos.video_url, datos.imagen_url]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar el ejercicio." });
  }
});

// Editar
app.put("/api/ejercicios/:id", async (req, res) => {
  const { datos, error } = validar(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const { rows } = await pool.query(
      `UPDATE ejercicios
       SET nombre = $1, grupo_muscular = $2, nivel = $3, descripcion = $4, video_url = $5, imagen_url = $6
       WHERE id = $7 RETURNING *`,
      [datos.nombre, datos.grupo_muscular, datos.nivel, datos.descripcion, datos.video_url, datos.imagen_url, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Ejercicio no encontrado." });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: "No se pudo actualizar." });
  }
});

// Eliminar
app.delete("/api/ejercicios/:id", async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM ejercicios WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Ejercicio no encontrado." });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: "No se pudo eliminar." });
  }
});

inicializarBD()
  .then(() => app.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`)))
  .catch((err) => {
    console.error("No se pudo conectar a la base de datos:", err.message);
    process.exit(1);
  });
