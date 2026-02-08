// ==============================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ==============================================

const API_URL = 'http://localhost:4242';

// Mapeo de IDs de temas a nombres de secciones
const THEME_MAPPING = {
    1: 'Frontend',
    2: 'Backend',
    3: 'SpokenLang',
    4: 'Frameworks'
};

// ==============================================
// FUNCIONES DE UTILIDAD
// ==============================================

/**
 * Crea un elemento de skill con su barra de progreso
 */
function createSkillElement(skill) {
    const li = document.createElement('li');
    li.className = 'skill';
    li.dataset.skillId = skill.id;

    const labelId = `${skill.skill.toLowerCase().replace(/\s+/g, '-')}-label`;

    li.innerHTML = `
        <label class="subject" id="${labelId}">${skill.skill}</label>
        <div class="progress-bar" 
             role="progressbar" 
             aria-valuenow="${skill.level}" 
             aria-valuemin="0" 
             aria-valuemax="100"
             aria-labelledby="${labelId}"
             aria-label="${skill.skill} proficiency: ${skill.level} percent"
             value="${skill.level}%">
            <span class="progress-line" style="max-width: ${skill.level}%"></span>
        </div>
    `;

    return li;
}

/**
 * Encuentra el contenedor de skills para un tema específico
 */
function getThemeContainer(themeName) {
    const containers = document.querySelectorAll('.col');
    
    for (const container of containers) {
        const header = container.querySelector('.theme h3');
        if (header && header.textContent.trim() === themeName) {
            return container.querySelector('.skills-container');
        }
    }
    
    return null;
}

// ==============================================
// FUNCIONES DE API
// ==============================================

/**
 * Obtiene todos los skills de la base de datos
 */
async function fetchSkills() {
    try {
        const response = await fetch(`${API_URL}/skills`);
        if (!response.ok) throw new Error('Failed to fetch skills');
        return await response.json();
    } catch (error) {
        console.error('Error fetching skills:', error);
        return [];
    }
}

/**
 * Obtiene todos los themes de la base de datos
 */
async function fetchThemes() {
    try {
        const response = await fetch(`${API_URL}/themes`);
        if (!response.ok) throw new Error('Failed to fetch themes');
        return await response.json();
    } catch (error) {
        console.error('Error fetching themes:', error);
        return [];
    }
}

/**
 * Crea un nuevo skill en la base de datos
 */
async function createSkill(skillData) {
    try {
        const response = await fetch(`${API_URL}/skills`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(skillData)
        });
        
        if (!response.ok) throw new Error('Failed to create skill');
        return await response.json();
    } catch (error) {
        console.error('Error creating skill:', error);
        throw error;
    }
}

/**
 * Crea un nuevo theme en la base de datos
 */
async function createTheme(themeName) {
    try {
        const response = await fetch(`${API_URL}/themes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: themeName })
        });
        
        if (!response.ok) throw new Error('Failed to create theme');
        return await response.json();
    } catch (error) {
        console.error('Error creating theme:', error);
        throw error;
    }
}

// ==============================================
// FUNCIONES DE RENDERIZADO
// ==============================================

/**
 * Limpia todos los contenedores de skills
 */
function clearAllSkills() {
    const containers = document.querySelectorAll('.skills-container');
    containers.forEach(container => {
        // Solo limpiar si no es el formulario
        if (!container.closest('#add-skill-form')) {
            container.innerHTML = '';
        }
    });
}

/**
 * Renderiza todos los skills en sus respectivas secciones
 */
async function renderSkills() {
    const skills = await fetchSkills();
    const themes = await fetchThemes();
    
    // Limpiar skills existentes
    clearAllSkills();
    
    // Crear un mapa de theme_id a skills
    const skillsByTheme = {};
    
    skills.forEach(skill => {
        if (!skillsByTheme[skill.theme_id]) {
            skillsByTheme[skill.theme_id] = [];
        }
        skillsByTheme[skill.theme_id].push(skill);
    });
    
    // Renderizar skills en cada tema
    themes.forEach(theme => {
        const themeName = theme.name;
        const container = getThemeContainer(themeName);
        
        if (container && skillsByTheme[theme.id]) {
            skillsByTheme[theme.id].forEach(skill => {
                const skillElement = createSkillElement(skill);
                container.appendChild(skillElement);
            });
        }
    });
}

/**
 * Actualiza el dropdown de temas con los datos de la base de datos
 */
async function updateThemeDropdown() {
    const themes = await fetchThemes();
    const select = document.getElementById('skill-theme');
    
    // Limpiar opciones existentes excepto la primera
    select.innerHTML = '<option value="">Select a theme</option>';
    
    // Agregar las opciones dinámicamente
    themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.id;
        option.textContent = theme.name;
        select.appendChild(option);
    });
}

// ==============================================
// MANEJO DEL FORMULARIO
// ==============================================

/**
 * Inicializa el slider de nivel
 */
function initializeLevelSlider() {
    const levelSlider = document.getElementById('skill-level');
    const levelDisplay = document.getElementById('level-display');
    
    levelSlider.addEventListener('input', (e) => {
        levelDisplay.textContent = `${e.target.value}%`;
        levelSlider.setAttribute('aria-valuenow', e.target.value);
    });
}

/**
 * Maneja el envío del formulario
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const themeId = parseInt(formData.get('theme'));
    const skillName = formData.get('skillName').trim();
    const skillLevel = parseInt(formData.get('skillLevel'));
    
    // Validaciones
    if (!themeId) {
        alert('Please select a theme');
        return;
    }
    
    if (!skillName) {
        alert('Please enter a skill name');
        return;
    }
    
    try {
        // Crear el nuevo skill
        await createSkill({
            skill: skillName,
            level: skillLevel,
            theme_id: themeId
        });
        
        // Mostrar mensaje de éxito
        alert('Skill added successfully!');
        
        // Resetear el formulario
        form.reset();
        document.getElementById('level-display').textContent = '0%';
        
        // Re-renderizar los skills
        await renderSkills();
        
    } catch (error) {
        alert('Error adding skill. Please try again.');
        console.error('Error:', error);
    }
}

// ==============================================
// INICIALIZACIÓN
// ==============================================

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing application...');
    
    // Inicializar el slider de nivel
    initializeLevelSlider();
    
    // Actualizar el dropdown de temas
    await updateThemeDropdown();
    
    // Renderizar los skills iniciales
    await renderSkills();
    
    // Configurar el evento del formulario
    const form = document.getElementById('add-skill-form');
    form.addEventListener('submit', handleFormSubmit);
    
    console.log('Application initialized successfully!');
});