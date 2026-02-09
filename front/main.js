// ==============================================
// CONFIGURATION AND GLOBAL VARIABLES
// ==============================================

const API_URL = 'http://localhost:4242';

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

// Creates a skill HTML element with a progress bar
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
             data-value="${skill.level}%">
            <span class="progress-line" style="max-width: ${skill.level}%"></span>
        </div>
    `;

    return li;
}

// Finds the container (ul element) for a specific theme section
function getThemeContainer(themeName) {
    const containers = document.querySelectorAll('.col');
    
    for (const container of containers) {
        const header = container.querySelector('.theme h3');
        if (header && header.textContent.trim() === themeName) {
            return container.querySelector('.skills-container');
        }
    }
    
    console.warn(`Theme container not found for: ${themeName}`);
    return null;
}

// ==============================================
// API FUNCTIONS
// ==============================================

// Gets all skills from the database
async function fetchSkills() {
    try {
        const response = await fetch(`${API_URL}/skills`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Skills fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching skills:', error);
        alert('Error loading skills. Make sure the backend is running on port 4242.');
        return [];
    }
}

// Gets all themes from the database
async function fetchThemes() {
    try {
        const response = await fetch(`${API_URL}/themes`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Themes fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching themes:', error);
        alert('Error loading themes. Make sure the backend is running on port 4242.');
        return [];
    }
}

// Sends a new skill to the database
async function createSkill(skillData) {
    try {
        console.log('Creating skill with data:', skillData);
        const response = await fetch(`${API_URL}/skills`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(skillData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create skill');
        }
        
        const data = await response.json();
        console.log('Skill created:', data);
        return data;
    } catch (error) {
        console.error('Error creating skill:', error);
        throw error;
    }
}

// ==============================================
// RENDERING FUNCTIONS
// ==============================================

// Removes all skill items from the page (but not the form)
function clearAllSkills() {
    const containers = document.querySelectorAll('.skills-container');
    containers.forEach(container => {
        // Only clear if it's not the form
        if (!container.closest('#add-skill-form')) {
            container.innerHTML = '';
        }
    });
}

// Displays all skills in their correct theme sections
async function renderSkills() {
    const skills = await fetchSkills();
    const themes = await fetchThemes();
    
    console.log('Rendering skills...', { skills, themes });
    
    // Clear existing skills
    clearAllSkills();
    
    // Create a map of theme_id to skills
    // Example: { 1: [skill1, skill2], 2: [skill3, skill4] }
    const skillsByTheme = {};
    
    skills.forEach(skill => {
        if (!skill.theme_id) {
            console.warn('Skill without theme_id:', skill);
            return;
        }
        
        if (!skillsByTheme[skill.theme_id]) {
            skillsByTheme[skill.theme_id] = [];
        }
        skillsByTheme[skill.theme_id].push(skill);
    });
    
    console.log('Skills grouped by theme:', skillsByTheme);
    
    // Render skills in each theme
    themes.forEach(theme => {
        const themeName = theme.name;
        const container = getThemeContainer(themeName);
        
        if (container && skillsByTheme[theme.id]) {
            console.log(`Rendering ${skillsByTheme[theme.id].length} skills for theme: ${themeName}`);
            skillsByTheme[theme.id].forEach(skill => {
                const skillElement = createSkillElement(skill);
                container.appendChild(skillElement);
            });
        } else if (container) {
            console.log(`No skills found for theme: ${themeName}`);
        }
    });
}

// Fills the dropdown with theme options from the database
async function updateThemeDropdown() {
    const themes = await fetchThemes();
    const select = document.getElementById('skill-theme');
    
    if (!select) {
        console.error('Theme select element not found!');
        return;
    }
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">Select a theme</option>';
    
    // Add options dynamically
    themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.id;
        option.textContent = theme.name;
        select.appendChild(option);
    });
    
    console.log(`Theme dropdown updated with ${themes.length} themes`);
}

// ==============================================
// FORM HANDLING
// ==============================================

// Makes the slider show the percentage as you move it
function initializeLevelSlider() {
    const levelSlider = document.getElementById('skill-level');
    const levelDisplay = document.getElementById('level-display');
    
    if (!levelSlider || !levelDisplay) {
        console.error('Level slider elements not found!');
        return;
    }
    
    levelSlider.addEventListener('input', (e) => {
        levelDisplay.textContent = `${e.target.value}%`;
    });
    
    console.log('Level slider initialized');
}

// Runs when the user submits the "Add New Skill" form
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const themeId = parseInt(formData.get('theme'));
    const skillName = formData.get('skillName').trim();
    const skillLevel = parseInt(formData.get('skillLevel'));
    
    console.log('Form submitted with:', { themeId, skillName, skillLevel });
    
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
        alert(`Error adding skill: ${error.message}`);
        console.error('Error:', error);
    }
}

// ==============================================
// INITIALIZATION
// ==============================================

// Runs when the page finishes loading
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== Initializing application ===');
    
    // Initialize the level slider
    initializeLevelSlider();
    
    // Update the theme dropdown
    await updateThemeDropdown();
    
    // Render the initial skills
    await renderSkills();
    
    // Set up form event listener
    const form = document.getElementById('add-skill-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        console.log('Form event listener attached');
    } else {
        console.error('Form element not found!');
    }
    
    console.log('=== Application initialized successfully ===');
});