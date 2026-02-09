require('dotenv').config();

const express = require('express');
const { neon } = require('@neondatabase/serverless');

const app = express();
const PORT = process.env.PORT || 4242;

app.use(express.json());


// ============================================
// ROUTES FOR THEMES
// ============================================

// GET - Fetch all themes
app.get('/themes', async (_, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const response = await sql`SELECT * FROM "Themes" ORDER BY id`;
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Fetch a single theme by ID
app.get('/themes/:id', async (req, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = req.params;
    const response = await sql`SELECT * FROM "Themes" WHERE id = ${id}`;
    
    if (response.length === 0) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    res.json(response[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* // POST - Create a new theme (sin usar en front)
app.post('/themes', async (req, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Field "name" is required' });
    }

    const response = await sql`
      INSERT INTO "Themes" (name)
      VALUES (${name})
      RETURNING *
    `;

    res.status(201).json({
      message: 'Theme created successfully',
      data: response[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}); */

// PUT - Update a theme
app.put('/themes/:id', async (req, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Field "name" is required' });
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
      message: 'Theme updated successfully',
      data: response[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* // DELETE - Remove a theme
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
      message: 'Theme deleted successfully',
      data: response[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}); */

// ============================================
// ROUTES FOR SKILLS
// ============================================

/* // GET - Fetch all skills
app.get('/skills', async (_, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const response = await sql`SELECT * FROM "Skills" ORDER BY theme_id, id`;
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Fetch a single skill by ID
app.get('/skills/:id', async (req, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = req.params;
    const response = await sql`SELECT * FROM "Skills" WHERE id = ${id}`;
    
    if (response.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    res.json(response[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}); */

// POST - Create a new skill
app.post('/skills', async (req, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { skill, level, theme_id } = req.body;

    // Validations
    if (!skill || level === undefined || !theme_id) {
      return res.status(400).json({ 
        error: 'Fields "skill", "level", and "theme_id" are required' 
      });
    }

    if (level < 0 || level > 100) {
      return res.status(400).json({ 
        error: 'Level must be between 0 and 100' 
      });
    }

    const response = await sql`
      INSERT INTO "Skills" (skill, level, theme_id)
      VALUES (${skill}, ${level}, ${theme_id})
      RETURNING *
    `;

    res.status(201).json({
      message: 'Skill created successfully',
      data: response[0]
    });
  } catch (error) {
    console.error('Error creating skill:', error);
    res.status(500).json({ error: error.message });
  }
});

/* // PUT - Update a skill
app.put('/skills/:id', async (req, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = req.params;
    const { skill, level, theme_id } = req.body;

    // Validations
    if (!skill && level === undefined && !theme_id) {
      return res.status(400).json({ 
        error: 'You must provide at least "skill", "level", or "theme_id"' 
      });
    }

    if (level !== undefined && (level < 0 || level > 100)) {
      return res.status(400).json({ 
        error: 'Level must be between 0 and 100' 
      });
    }

    // Build the update query dynamically
    let updateQuery;
    if (skill && level !== undefined && theme_id) {
      updateQuery = await sql`
        UPDATE "Skills" 
        SET skill = ${skill}, level = ${level}, theme_id = ${theme_id}
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (skill && level !== undefined) {
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
    } else if (level !== undefined) {
      updateQuery = await sql`
        UPDATE "Skills" 
        SET level = ${level}
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (theme_id) {
      updateQuery = await sql`
        UPDATE "Skills" 
        SET theme_id = ${theme_id}
        WHERE id = ${id}
        RETURNING *
      `;
    }

    if (updateQuery.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({
      message: 'Skill updated successfully',
      data: updateQuery[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}); */

// DELETE - Remove a skill
/* app.delete('/skills/:id', async (req, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = req.params;

    const response = await sql`
      DELETE FROM "Skills" 
      WHERE id = ${id}
      RETURNING *
    `;

    if (response.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({
      message: 'Skill deleted successfully',
      data: response[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}); */

// ============================================
// ROOT ENDPOINT
// ============================================

app.get('/', (_, res) => {
  res.json({ 
    message: 'Skills and Themes API ✅',
    endpoints: {
      themes: {
        getAll: 'GET /themes',
        getOne: 'GET /themes/:id',
        create: 'POST /themes',
        update: 'PUT /themes/:id',
        delete: 'DELETE /themes/:id'
      },
      skills: {
        getAll: 'GET /skills',
        getOne: 'GET /skills/:id',
        create: 'POST /skills',
        update: 'PUT /skills/:id',
        delete: 'DELETE /skills/:id'
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`Listening to http://localhost:${PORT}`);
});