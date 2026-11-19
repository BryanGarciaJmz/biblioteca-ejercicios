// Biblioteca de ejercicios - servidor Node.js + Express + PostgreSQL
const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/ejercicios";
const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("render.com")
    ? { rejectUnauthorized: false }
    : false,
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Base de datos: crea la tabla y datos de ejemplo si no existen
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

  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS total FROM ejercicios",
  );
  if (rows[0].total === 0) {
    const ejemplos = [
      [
        "Press de banca",
        "Pecho",
        "Intermedio",
        "Ejercicio básico de empuje horizontal. Retrae escápulas, baja la barra controlada a la parte baja del pecho y empuja sin despegar los glúteos.",
        "https://www.youtube.com/watch?v=4Y2ZdHCOXok",
      ],
      [
        "Sentadilla con barra",
        "Pierna",
        "Intermedio",
        "Rey del tren inferior. Pies a la anchura de hombros, pecho arriba, rodillas en línea con las puntas y profundidad controlada.",
        "https://www.youtube.com/watch?v=I7eR8d0cNQQ",
      ],
      [
        "Peso muerto",
        "Espalda",
        "Avanzado",
        "Bisagra de cadera con barra desde el suelo. Espalda neutra, barra pegada a las piernas y empuja el piso con los pies.",
        "https://www.youtube.com/watch?v=heqIRjWWiLE",
      ],
      [
        "Dominadas",
        "Espalda",
        "Intermedio",
        "Tracción vertical con el peso corporal. Rango completo, escápulas abajo y evita convertirla en un curl de bíceps.",
        "https://www.youtube.com/watch?v=02HC33YMzew",
      ],
      [
        "Press militar",
        "Hombro",
        "Intermedio",
        "Empuje vertical de pie con barra. Glúteos y abdomen firmes, la barra sube en línea recta sobre la cabeza.",
        "https://www.youtube.com/watch?v=JtHjdO1TmPw",
      ],
      [
        "Press inclinado con mancuernas",
        "Pecho",
        "Intermedio",
        "Banco a 30–45°. Baja las mancuernas a los costados del pecho alto y empuja sin chocarlas arriba.",
        "https://www.youtube.com/watch?v=IP4oeKh1Sd4&pp=ygUjaG93IHRvIGluY2xpbmUgZHVtYmJlbGwgYmVuY2ggcHJlc3M%3D",
      ],
      [
        "Lagartijas",
        "Pecho",
        "Principiante",
        "Manos un poco más abiertas que los hombros, cuerpo en línea recta y pecho cerca del suelo en cada repetición.",
        "https://www.youtube.com/watch?v=LYGQ1OVGAjI&pp=ygUOaG93IHRvIHB1c2ggdXA%3D",
      ],
      [
        "Aperturas en polea",
        "Pecho",
        "Intermedio",
        "Codos ligeramente flexionados. Junta las manos al frente del pecho, como si abrazaras un árbol, y regresa lento.",
        "https://www.youtube.com/watch?v=JUDTGZh4rhg&pp=ygUVaG93IHRvIEhpZ2ggY2FibGUgZmx5",
      ],
      [
        "Remo con barra",
        "Espalda",
        "Intermedio",
        "Torso inclinado unos 45° con la espalda neutra. Jala la barra hacia el ombligo juntando las escápulas.",
        "https://www.youtube.com/watch?v=FWJR5Ve8bnQ&pp=ygUVaG93IHRvIHJvdyB3aXRoIGEgYmFy",
      ],
      [
        "Jalón al pecho",
        "Espalda",
        "Principiante",
        "Pecho arriba. Baja la barra hacia la clavícula llevando los codos hacia abajo y atrás, sin balancearte.",
        "https://www.youtube.com/watch?v=O94yEoGXtBY&t=243s&pp=ygUPaG93IHRvIHB1bGxkb3du",
      ],
      [
        "Remo con mancuerna a una mano",
        "Espalda",
        "Principiante",
        "Apoya rodilla y mano en el banco. Jala la mancuerna hacia la cadera con el codo pegado al cuerpo.",
        "https://www.youtube.com/watch?v=gfUg6qWohTk&pp=ygUSaG93IHRvIGR1bWJlbGwgcm93",
      ],
      [
        "Peso muerto rumano",
        "Pierna",
        "Intermedio",
        "Rodillas semiflexionadas. Lleva la cadera hacia atrás bajando la barra pegada a las piernas hasta sentir el estiramiento en los femorales.",
        "https://www.youtube.com/watch?v=_oyxCn2iSjU&pp=ygUYaG93IHRvIHJvbWFuaWFuIGRlYWRsaWZ0",
      ],
      [
        "Sentadilla búlgara",
        "Pierna",
        "Intermedio",
        "Pie trasero sobre un banco. Baja vertical hasta que la rodilla trasera casi toque el suelo, con el torso firme.",
        "https://www.youtube.com/watch?v=hiLF_pF3EJM&pp=ygUcaG93IHRvIGJ1bGdhcmlhbiBzcGxpdCBzcXVhdA%3D%3D",
      ],
      [
        "Prensa de pierna",
        "Pierna",
        "Principiante",
        "Pies a la anchura de la cadera en la plataforma. Baja controlado sin despegar la espalda baja del respaldo.",
        "https://www.youtube.com/watch?v=IZxyjW7MPJQ&pp=ygUQaG93IHRvIGxlZyBwcmVzcw%3D%3D",
      ],
      [
        "Elevaciones laterales",
        "Hombro",
        "Principiante",
        "Sube las mancuernas a los lados hasta la altura de los hombros, con los codos ligeramente flexionados y sin impulso.",
        "https://www.youtube.com/watch?v=XPPfnSEATJA&pp=ygUcaG93IHRvIGR1bWJlbGwgbGF0ZXJhbCByYWlzZQ%3D%3D",
      ],
      [
        "Press Arnold",
        "Hombro",
        "Intermedio",
        "Empieza con las palmas hacia ti y gíralas mientras empujas hacia arriba hasta que miren al frente.",
        "https://www.youtube.com/watch?v=3ml7BH7mNwQ&pp=ygUTaG93IHRvIGFybm9sZCBwcmVzcw%3D%3D",
      ],
      [
        "Face pull",
        "Hombro",
        "Principiante",
        "Polea a la altura de la cara. Jala la cuerda hacia los ojos separando las manos y con los codos altos.",
        "https://www.youtube.com/watch?v=0Po47vvj9g4&pp=ygUQaG93IHRvIGZhY2UgcHVsbA%3D%3D",
      ],
      [
        "Curl de bíceps con barra",
        "Brazo",
        "Principiante",
        "Codos pegados al torso. Sube la barra sin balancear el cuerpo y baja en 2–3 segundos.",
        "https://www.youtube.com/watch?v=kwG2ipFRgfo&pp=ygUTaG93IHRvIGJhcmJlbGwgY3VybA%3D%3D",
      ],
      [
        "Curl martillo",
        "Brazo",
        "Principiante",
        "Agarre neutro, con las palmas mirándose. Trabaja el bíceps y el antebrazo, sin mover los codos.",
        "https://www.youtube.com/watch?v=BRVDS6HVR9Q&pp=ygUSaG93IHRvIGhhbW1lciBjdXJs",
      ],
      [
        "Extensión de tríceps en polea",
        "Brazo",
        "Principiante",
        "Codos fijos a los costados. Extiende por completo hacia abajo y aprieta el tríceps al final.",
        "https://www.youtube.com/watch?v=ns-RGsbzqok&pp=ygUYaG93IHRvIHRyaWNlcHMgZXh0ZW5zaW9u",
      ],
      [
        "Plancha",
        "Core",
        "Principiante",
        "Antebrazos en el suelo y cuerpo recto de cabeza a talones. Aprieta abdomen y glúteos sin hundir la cadera.",
        "https://www.youtube.com/watch?v=A2b2EmIg0dA&pp=ygUMaG93IHRvIHBsYW5r",
      ],
      [
        "Elevación de piernas colgado",
        "Core",
        "Avanzado",
        "Colgado de una barra, sube las piernas controlando el movimiento. No te balancees.",
        "https://www.youtube.com/watch?v=_jLskVdzS4o&pp=ygUZaG93IHRvIGhhbmdpbmcgbGVnIHJhaXNlcw%3D%3D",
      ],
      [
        "Rueda abdominal",
        "Core",
        "Intermedio",
        "De rodillas, rueda hacia el frente con el abdomen firme y la espalda neutra, y regresa sin arquear la zona lumbar.",
        "https://www.youtube.com/watch?v=_BHKT60P6bc&pp=ygUaaG93IHRvIHVzZSBhYmRvbWluYWwgd2hlZWw%3D",
      ],
    ];
    for (const e of ejemplos) {
      await pool.query(
        `INSERT INTO ejercicios (nombre, grupo_muscular, nivel, descripcion, video_url)
         VALUES ($1, $2, $3, $4, $5)`,
        e,
      );
    }
    console.log("Datos de ejemplo insertados.");
  }
}

// Validación
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
  if (!GRUPOS.includes(datos.grupo_muscular))
    return { error: "Grupo muscular no válido." };
  if (!NIVELES.includes(datos.nivel)) return { error: "Nivel no válido." };
  if (!/^https?:\/\//i.test(datos.video_url))
    return { error: "El enlace del video debe empezar con http:// o https://" };
  if (datos.imagen_url && !/^https?:\/\//i.test(datos.imagen_url))
    return {
      error: "El enlace de la imagen debe empezar con http:// o https://",
    };
  return { datos };
}

// API REST
// Consultar todos (con búsqueda y filtro opcionales)
app.get("/api/ejercicios", async (req, res) => {
  try {
    const condiciones = [];
    const valores = [];
    if (req.query.q) {
      valores.push(`%${req.query.q}%`);
      condiciones.push(
        `(nombre ILIKE $${valores.length} OR descripcion ILIKE $${valores.length})`,
      );
    }
    if (req.query.grupo) {
      valores.push(req.query.grupo);
      condiciones.push(`grupo_muscular = $${valores.length}`);
    }
    const where = condiciones.length
      ? "WHERE " + condiciones.join(" AND ")
      : "";
    const { rows } = await pool.query(
      `SELECT * FROM ejercicios ${where} ORDER BY id`,
      valores,
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar los ejercicios." });
  }
});

// Consultar uno
app.get("/api/ejercicios/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM ejercicios WHERE id = $1",
      [req.params.id],
    );
    if (!rows.length)
      return res.status(404).json({ error: "Ejercicio no encontrado." });
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
      [
        datos.nombre,
        datos.grupo_muscular,
        datos.nivel,
        datos.descripcion,
        datos.video_url,
        datos.imagen_url,
      ],
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
      [
        datos.nombre,
        datos.grupo_muscular,
        datos.nivel,
        datos.descripcion,
        datos.video_url,
        datos.imagen_url,
        req.params.id,
      ],
    );
    if (!rows.length)
      return res.status(404).json({ error: "Ejercicio no encontrado." });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: "No se pudo actualizar." });
  }
});

// Eliminar
app.delete("/api/ejercicios/:id", async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM ejercicios WHERE id = $1",
      [req.params.id],
    );
    if (!rowCount)
      return res.status(404).json({ error: "Ejercicio no encontrado." });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: "No se pudo eliminar." });
  }
});

inicializarBD()
  .then(() =>
    app.listen(PORT, () =>
      console.log(`Servidor escuchando en el puerto ${PORT}`),
    ),
  )
  .catch((err) => {
    console.error("No se pudo conectar a la base de datos:", err.message);
    process.exit(1);
  });
