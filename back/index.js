require('dotenv').config();

const express = require('express');
const { neon } = require('@neondatabase/serverless');

const app = express();
const PORT = process.env.PORT || 4242;

app.use(express.json());

// ============================================
// ROUTES FOR THEMES
// ============================================

// GET (get all themes)
app.get('/themes', async (_, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const response = await sql`SELECT * FROM "Themes" ORDER BY id`;
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// PUT (Update a theme)
app.put('/themes/:id', async (req, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'You have to enter a name' });
    }

    const response = await sql`
      UPDATE "Themes" 
      SET name = ${name}
      WHERE id = ${id}
      RETURNING *
    `;

    if (response.length === 0) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    res.json({
      message: 'The theme has been succesfully updated',
      data: response[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE (delete a theme)
app.delete('/themes/:id', async (req, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = req.params;

    const response = await sql`
      DELETE FROM "Themes" 
      WHERE id = ${id}
      RETURNING *
    `;

    if (response.length === 0) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    res.json({
      message: 'Theme has been successfully deleted',
      data: response[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROUTES FOR SKILLS
// ============================================

// GET (get all the skills)
app.get('/skills', async (_, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const response = await sql`SELECT * FROM "Skills" ORDER BY id`;
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT (update a skill)
app.put('/skills/:id', async (req, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = req.params;
    const { skill, level } = req.body;

    if (!skill && level === undefined) {
      return res.status(400).json({ 
        error: 'You have to add a skill name and a level' 
      });
    }

    if (level !== undefined && (level < 0 || level > 100)) {
      return res.status(400).json({ 
        error: 'Level must be between 0 and 100' 
      });
    }

    let updateQuery;
    if (skill && level !== undefined) {
      updateQuery = await sql`
        UPDATE "Skills" 
        SET skill = ${skill}, level = ${level}
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (skill) {
      updateQuery = await sql`
        UPDATE "Skills" 
        SET skill = ${skill}
        WHERE id = ${id}
        RETURNING *
      `;
    } else {
      updateQuery = await sql`
        UPDATE "Skills" 
        SET level = ${level}
        WHERE id = ${id}
        RETURNING *
      `;
    }

    if (updateQuery.length === 0) {
      return res.status(404).json({ error: 'Skill no encontrado' });
    }

    res.json({
      message: 'Skill actualizado exitosamente',
      data: updateQuery[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE (delete a skill)
app.delete('/skills/:id', async (req, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = req.params;

    const response = await sql`
      DELETE FROM "Skills" 
      WHERE id = ${id}
      RETURNING *
    `;

    if (response.length === 0) {
      return res.status(404).json({ error: 'Skill no encontrado' });
    }

    res.json({
      message: 'Skill eliminado exitosamente',
      data: response[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Root
// ============================================

app.get('/', (_, res) => {
  res.json({ 
    message: 'API de Skills y Themes ✅',
    endpoints: {
      themes: {
        getAll: 'GET /themes',
        getOne: 'GET /themes/:id',
        update: 'PUT /themes/:id',
        delete: 'DELETE /themes/:id'
      },
      skills: {
        getAll: 'GET /skills',
        getOne: 'GET /skills/:id',
        update: 'PUT /skills/:id',
        delete: 'DELETE /skills/:id'
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`Listening to http://localhost:${PORT}`);
});