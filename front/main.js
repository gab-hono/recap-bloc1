// ==============================================
// CONFIGURATION AND GLOBAL VARIABLES
// ==============================================

const API_URL = 'http://localhost:4242';

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Creates a skill element with its progress bar
 * @param {Object} skill - The skill object containing id, skill name, and level
 * @returns {HTMLElement} - The created list item element
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
 * Finds the skills container for a specific theme
 * @param {string} themeName - The name of the theme
 * @returns {HTMLElement|null} - The skills container element or null if not found
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
// API FUNCTIONS
// ==============================================

/**
 * Fetches all skills from the database
 * @returns {Promise<Array>} - Array of skill objects
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
 * Fetches all themes from the database
 * @returns {Promise<Array>} - Array of theme objects
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
 * Creates a new skill in the database
 * @param {Object} skillData - The skill data to create
 * @returns {Promise<Object>} - The created skill object
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

// ==============================================
// RENDERING FUNCTIONS
// ==============================================

/**
 * Clears all skills containers
 */
function clearAllSkills() {
    const containers = document.querySelectorAll('.skills-container');
    containers.forEach(container => {
        // Only clear if it's not the form
        if (!container.closest('#add-skill-form')) {
            container.innerHTML = '';
        }
    });
}

/**
 * Renders all skills in their respective sections
 */
async function renderSkills() {
    const skills = await fetchSkills();
    const themes = await fetchThemes();
    
    // Clear existing skills
    clearAllSkills();
    
    // Create a map of theme_id to skills
    const skillsByTheme = {};
    
    skills.forEach(skill => {
        if (!skillsByTheme[skill.theme_id]) {
            skillsByTheme[skill.theme_id] = [];
        }
        skillsByTheme[skill.theme_id].push(skill);
    });
    
    // Render skills in each theme
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
 * Updates the theme dropdown with data from the database
 */
async function updateThemeDropdown() {
    const themes = await fetchThemes();
    const select = document.getElementById('skill-theme');
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">Select a theme</option>';
    
    // Add options dynamically
    themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.id;
        option.textContent = theme.name;
        select.appendChild(option);
    });
}

// ==============================================
// FORM HANDLING
// ==============================================

/**
 * Initializes the level slider
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
 * Handles form submission
 * @param {Event} e - The submit event
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const themeId = parseInt(formData.get('theme'));
    const skillName = formData.get('skillName').trim();
    const skillLevel = parseInt(formData.get('skillLevel'));
    
    // Validations
    if (!themeId) {
        alert('Please select a theme');
        return;
    }
    
    if (!skillName) {
        alert('Please enter a skill name');
        return;
    }
    
    try {
        // Create the new skill
        await createSkill({
            skill: skillName,
            level: skillLevel,
            theme_id: themeId
        });
        
        // Show success message
        alert('Skill added successfully!');
        
        // Reset the form
        form.reset();
        document.getElementById('level-display').textContent = '0%';
        
        // Re-render the skills
        await renderSkills();
        
    } catch (error) {
        alert('Error adding skill. Please try again.');
        console.error('Error:', error);
    }
}

// ==============================================
// INITIALIZATION
// ==============================================

/**
 * Initializes the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing application...');
    
    // Initialize the level slider
    initializeLevelSlider();
    
    // Update the theme dropdown
    await updateThemeDropdown();
    
    // Render the initial skills
    await renderSkills();
    
    // Set up form event listener
    const form = document.getElementById('add-skill-form');
    form.addEventListener('submit', handleFormSubmit);
    
    console.log('Application initialized successfully!');
});