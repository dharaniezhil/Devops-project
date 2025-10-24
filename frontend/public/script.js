// Modern JavaScript for User Profile Page

// Global state
let currentProfileData = {};
let profileId = null;
let isThemePanelOpen = false;

// DOM elements cache
const elements = {
    profileForm: document.getElementById('profileForm'),
    profileImage: document.getElementById('profileImage'),
    displayName: document.getElementById('displayName'),
    roleBadge: document.getElementById('roleBadge'),
    statusBadge: document.getElementById('statusBadge'),
    completionStat: document.getElementById('completionStat'),
    mainCompletion: document.getElementById('mainCompletion'),
    mainProgressRing: document.getElementById('mainProgressRing'),
    passwordModal: document.getElementById('passwordModal'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    themePanel: document.getElementById('themePanel'),
    toastContainer: document.getElementById('toastContainer')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Initializing FixItFast Profile App');
    
    // Setup SVG gradients
    setupSVGGradients();
    
    // Load existing profile data
    loadProfileData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize theme
    initializeTheme();
    
    // Calculate initial progress
    updateAllProgress();
    
    // Update header display
    updateHeaderDisplay();
    
    // Set up auto-save functionality
    setupAutoSave();
    
    // Initialize theme panel
    setupThemePanel();
    
    // Animate entrance
    animateEntrance();
    
    console.log('✅ App initialized successfully');
}

function setupSVGGradients() {
    // Create SVG gradients for progress rings
    const svgDefs = document.createElement('svg');
    svgDefs.innerHTML = `
        <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="sectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
        </defs>
    `;
    svgDefs.style.position = 'absolute';
    svgDefs.style.width = '0';
    svgDefs.style.height = '0';
    document.body.appendChild(svgDefs);
}

function setupEventListeners() {
    // Form submission
    elements.profileForm?.addEventListener('submit', handleFormSubmit);
    
    // Input change listeners for real-time validation and progress
    const inputs = elements.profileForm?.querySelectorAll('input, select, textarea');
    inputs?.forEach(input => {
        input.addEventListener('input', debounce(handleInputChange, 300));
        input.addEventListener('blur', validateField);
        input.addEventListener('focus', handleInputFocus);
    });
    
    // Theme change listeners
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(radio => {
        radio.addEventListener('change', handleThemeChange);
    });
    
    // Theme panel cards
    const themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
        card.addEventListener('click', () => {
            const theme = card.getAttribute('data-theme');
            applyTheme(theme);
            updateActiveThemeCard(theme);
        });
    });
    
    // Toggle switches with animations
    const toggles = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', handleToggleChange);
    });
    
    // Password form
    const passwordForm = document.getElementById('passwordForm');
    passwordForm?.addEventListener('submit', handlePasswordChange);
    
    // Password strength checking
    const newPasswordInput = document.getElementById('newPassword');
    newPasswordInput?.addEventListener('input', checkPasswordStrength);
    
    // Modal close events
    window.addEventListener('click', function(event) {
        if (event.target === elements.passwordModal) {
            closePasswordModal();
        }
        if (event.target === elements.themePanel) {
            toggleThemePanel();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            if (elements.passwordModal?.classList.contains('show')) {
                closePasswordModal();
            }
            if (isThemePanelOpen) {
                toggleThemePanel();
            }
        }
    });
    
    // Intersection Observer for animations
    setupScrollAnimations();
}

function handleInputChange(event) {
    const field = event.target;
    
    // Real-time validation
    validateField(event);
    
    // Update progress with animation
    updateAllProgress();
    
    // Update header display if it's a key field
    if (['fullName', 'role', 'accountStatus'].includes(field.name)) {
        updateHeaderDisplay();
    }
    
    // Auto-save after a delay
    clearTimeout(field.autoSaveTimer);
    field.autoSaveTimer = setTimeout(() => {
        autoSaveProfile();
    }, 2000);
}

function handleInputFocus(event) {
    const field = event.target;
    const inputCard = field.closest('.input-card');
    
    // Highlight the card when focused
    if (inputCard) {
        inputCard.style.transform = 'translateY(-2px)';
        inputCard.style.borderColor = 'var(--border-focus)';
        
        field.addEventListener('blur', () => {
            inputCard.style.transform = '';
            inputCard.style.borderColor = '';
        }, { once: true });
    }
}

function validateField(event) {
    const field = event.target;
    const fieldName = field.name;
    const value = field.value.trim();
    const errorElement = field.parentElement.querySelector('.error-message');
    
    let isValid = true;
    let errorMessage = '';
    
    // Clear previous states
    field.classList.remove('invalid', 'valid');
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = `${getFieldLabel(field)} is required`;
    }
    
    // Email validation
    else if (fieldName === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }
    
    // Phone number validation
    else if (fieldName === 'phoneNumber' && value) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
        }
    }
    
    // URL validation for social links
    else if (['whatsappLink', 'linkedinProfile'].includes(fieldName) && value) {
        const urlRegex = /^https?:\/\/.+/;
        if (!urlRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid URL (starting with http:// or https://)';
        }
    }
    
    // Password validation
    else if (fieldName === 'newPassword' && value) {
        if (value.length < 8) {
            isValid = false;
            errorMessage = 'Password must be at least 8 characters long';
        }
    }
    
    // Confirm password validation
    else if (fieldName === 'confirmPassword' && value) {
        const newPassword = document.getElementById('newPassword')?.value;
        if (value !== newPassword) {
            isValid = false;
            errorMessage = 'Passwords do not match';
        }
    }
    
    // Update field styling and error message
    if (errorElement) {
        if (isValid) {
            field.classList.add('valid');
            errorElement.classList.remove('show');
            errorElement.textContent = '';
            
            // Success animation
            animateSuccess(field);
        } else {
            field.classList.add('invalid');
            errorElement.classList.add('show');
            errorElement.textContent = errorMessage;
            
            // Error animation
            animateError(field);
        }
    }
    
    return isValid;
}

function getFieldLabel(field) {
    const label = field.parentElement.querySelector('label');
    if (label) {
        return label.textContent.replace('*', '').trim();
    }
    return field.name;
}

function updateAllProgress() {
    const sections = document.querySelectorAll('.form-section[data-section]');
    let totalFields = 0;
    let completedFields = 0;
    
    sections.forEach(section => {
        const sectionName = section.getAttribute('data-section');
        const inputs = section.querySelectorAll('input, select, textarea');
        const toggles = section.querySelectorAll('.toggle-switch input[type="checkbox"]');
        const radios = section.querySelectorAll('input[type="radio"]');
        
        let sectionTotal = 0;
        let sectionCompleted = 0;
        
        // Count regular inputs
        inputs.forEach(input => {
            if (!input.closest('.toggle-switch') && input.type !== 'radio') {
                sectionTotal++;
                totalFields++;
                
                if (input.value.trim() || input.checked) {
                    sectionCompleted++;
                    completedFields++;
                }
            }
        });
        
        // Count toggle groups
        const toggleGroups = {};
        toggles.forEach(toggle => {
            const groupName = toggle.name;
            if (!toggleGroups[groupName]) {
                toggleGroups[groupName] = { checked: false };
                sectionTotal++;
                totalFields++;
            }
            if (toggle.checked) {
                toggleGroups[groupName].checked = true;
            }
        });
        
        Object.values(toggleGroups).forEach(group => {
            if (group.checked) {
                sectionCompleted++;
                completedFields++;
            }
        });
        
        // Count radio groups
        const radioGroups = {};
        radios.forEach(radio => {
            const groupName = radio.name;
            if (!radioGroups[groupName]) {
                radioGroups[groupName] = { selected: false };
                sectionTotal++;
                totalFields++;
            }
            if (radio.checked) {
                radioGroups[groupName].selected = true;
            }
        });
        
        Object.values(radioGroups).forEach(group => {
            if (group.selected) {
                sectionCompleted++;
                completedFields++;
            }
        });
        
        // Update section progress with animation
        const sectionProgress = sectionTotal > 0 ? Math.round((sectionCompleted / sectionTotal) * 100) : 0;
        updateSectionProgress(section, sectionProgress);
    });
    
    // Update overall progress with animation
    const overallProgress = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    updateMainProgress(overallProgress);
}

function updateSectionProgress(section, progress) {
    const progressRing = section.querySelector('.progress-ring .ring-progress');
    const progressText = section.querySelector('.progress-text');
    
    if (progressRing && progressText) {
        const circumference = 2 * Math.PI * 20; // radius = 20
        const offset = circumference - (progress / 100) * circumference;
        
        // Animate the ring
        progressRing.style.strokeDashoffset = offset;
        
        // Animate the text
        animateNumber(progressText, parseInt(progressText.textContent) || 0, progress, '%');
    }
}

function updateMainProgress(progress) {
    // Update the main completion ring
    if (elements.mainProgressRing) {
        const circumference = 2 * Math.PI * 75; // radius = 75
        const offset = circumference - (progress / 100) * circumference;
        elements.mainProgressRing.style.strokeDashoffset = offset;
    }
    
    // Update completion percentage with animation
    if (elements.mainCompletion) {
        animateNumber(elements.mainCompletion, parseInt(elements.mainCompletion.textContent) || 0, progress, '%');
    }
    
    // Update stats
    if (elements.completionStat) {
        animateNumber(elements.completionStat, parseInt(elements.completionStat.textContent) || 0, progress);
    }
}

function updateHeaderDisplay() {
    const fullName = document.getElementById('fullName')?.value || 'John Doe';
    const role = document.getElementById('role')?.value || 'general';
    const status = document.getElementById('accountStatus')?.value || 'active';
    
    // Update display name with animation
    if (elements.displayName) {
        if (elements.displayName.textContent !== fullName) {
            animateTextChange(elements.displayName, fullName);
        }
    }
    
    // Update role badge
    if (elements.roleBadge) {
        const roleText = role.charAt(0).toUpperCase() + role.slice(1);
        elements.roleBadge.innerHTML = `<i class="fas fa-user"></i> ${roleText}`;
    }
    
    // Update status badge
    if (elements.statusBadge) {
        const statusMap = {
            'active': { text: 'Active', class: 'badge-active', icon: 'fa-circle' },
            'inactive': { text: 'Inactive', class: 'badge-inactive', icon: 'fa-circle' },
            'pending': { text: 'Pending', class: 'badge-pending', icon: 'fa-clock' }
        };
        
        const statusInfo = statusMap[status] || statusMap['active'];
        elements.statusBadge.className = `badge badge-status ${statusInfo.class}`;
        elements.statusBadge.innerHTML = `<i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}`;
    }
}

function handleThemeChange(event) {
    const theme = event.target.value;
    applyTheme(theme);
    updateActiveThemeCard(theme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('preferredTheme', theme);
    
    // Update theme panel active state
    updateActiveThemeCard(theme);
    
    // Show theme change notification
    showToast(`Theme changed to ${theme.charAt(0).toUpperCase() + theme.slice(1)}`, 'success');
}

function updateActiveThemeCard(theme) {
    const themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('data-theme') === theme) {
            card.classList.add('active');
        }
    });
    
    // Also update radio buttons
    const themeRadio = document.querySelector(`input[name="theme"][value="${theme}"]`);
    if (themeRadio) {
        themeRadio.checked = true;
    }
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('preferredTheme') || 'light';
    applyTheme(savedTheme);
}

function handleToggleChange(event) {
    const toggle = event.target;
    const toggleSlider = toggle.nextElementSibling;
    
    // Add visual feedback with animation
    if (toggleSlider) {
        toggleSlider.style.transform = 'scale(1.05)';
        setTimeout(() => {
            toggleSlider.style.transform = '';
        }, 150);
    }
    
    // Update progress
    updateAllProgress();
    
    // Show feedback
    const label = toggle.closest('.toggle-item')?.querySelector('.toggle-label')?.textContent;
    if (label) {
        showToast(`${label} ${toggle.checked ? 'enabled' : 'disabled'}`, 'info', 2000);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate all fields
    const inputs = elements.profileForm.querySelectorAll('input, select, textarea');
    let isFormValid = true;
    
    inputs.forEach(input => {
        const fieldValid = validateField({ target: input });
        if (!fieldValid) {
            isFormValid = false;
        }
    });
    
    if (!isFormValid) {
        showToast('Please fix the errors in the form before submitting.', 'error');
        // Scroll to first error
        const firstError = document.querySelector('.invalid');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
        return;
    }
    
    // Show loading with animation
    showLoadingSpinner();
    
    try {
        // Collect form data
        const formData = new FormData(elements.profileForm);
        const profileData = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            profileData[key] = value;
        }
        
        // Add checkbox values
        const checkboxes = elements.profileForm.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            profileData[checkbox.name] = checkbox.checked;
        });
        
        // Add current timestamp
        profileData.lastUpdated = new Date().toISOString();
        
        // Save to MongoDB
        const result = await saveProfileToMongoDB(profileData);
        
        if (result.success) {
            showToast('Profile saved successfully! 🎉', 'success');
            currentProfileData = profileData;
            profileId = result.profileId;
            
            // Celebrate animation
            celebrateSuccess();
        } else {
            throw new Error(result.message || 'Failed to save profile');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Error saving profile. Please try again.', 'error');
    } finally {
        hideLoadingSpinner();
    }
}

async function saveProfileToMongoDB(profileData) {
    try {
        const response = await fetch('/api/profiles', {
            method: profileId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...profileData,
                _id: profileId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('MongoDB save error:', error);
        
        // Fallback to localStorage
        const localData = {
            ...profileData,
            _id: profileId || generateId(),
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem('userProfile', JSON.stringify(localData));
        
        return {
            success: true,
            profileId: localData._id,
            message: 'Profile saved locally'
        };
    }
}

async function loadProfileData() {
    try {
        const response = await fetch('/api/profiles/current');
        
        if (response.ok) {
            const data = await response.json();
            if (data.profile) {
                populateForm(data.profile);
                currentProfileData = data.profile;
                profileId = data.profile._id;
                return;
            }
        }
    } catch (error) {
        console.log('API not available, checking localStorage');
    }
    
    // Fallback to localStorage
    const localData = localStorage.getItem('userProfile');
    if (localData) {
        try {
            const profileData = JSON.parse(localData);
            populateForm(profileData);
            currentProfileData = profileData;
            profileId = profileData._id;
        } catch (error) {
            console.error('Error parsing local profile data:', error);
        }
    }
}

function populateForm(data) {
    Object.keys(data).forEach(key => {
        const element = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = Boolean(data[key]);
            } else if (element.type === 'radio') {
                const radio = document.querySelector(`input[name="${key}"][value="${data[key]}"]`);
                if (radio) radio.checked = true;
            } else {
                element.value = data[key] || '';
            }
            
            // Trigger animations for populated fields
            if (element.value) {
                element.classList.add('valid');
            }
        }
    });
    
    updateHeaderDisplay();
    updateAllProgress();
}

function setupAutoSave() {
    setInterval(() => {
        const currentData = getFormData();
        if (hasUnsavedChanges(currentData)) {
            autoSaveProfile();
        }
    }, 5 * 60 * 1000); // 5 minutes
}

async function autoSaveProfile() {
    const formData = getFormData();
    
    try {
        const result = await saveProfileToMongoDB(formData);
        if (result.success) {
            currentProfileData = formData;
            showToast('Profile auto-saved', 'info', 2000);
        }
    } catch (error) {
        console.log('Auto-save failed:', error);
    }
}

function getFormData() {
    const formData = new FormData(elements.profileForm);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    const checkboxes = elements.profileForm.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        data[checkbox.name] = checkbox.checked;
    });
    
    return data;
}

function hasUnsavedChanges(currentData) {
    return JSON.stringify(currentData) !== JSON.stringify(currentProfileData);
}

function resetForm() {
    if (confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
        elements.profileForm.reset();
        
        // Reset checkboxes
        const checkboxes = elements.profileForm.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = false);
        
        // Clear error messages and states
        const errorMessages = elements.profileForm.querySelectorAll('.error-message');
        errorMessages.forEach(msg => {
            msg.classList.remove('show');
            msg.textContent = '';
        });
        
        const inputs = elements.profileForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.classList.remove('valid', 'invalid');
        });
        
        updateHeaderDisplay();
        updateAllProgress();
        
        showToast('Form reset successfully', 'info');
    }
}

// Profile photo functions with modern file handling
function changeProfilePhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image must be less than 5MB', 'error');
                return;
            }
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image file', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                elements.profileImage.src = e.target.result;
                showToast('Profile photo updated! 📸', 'success');
                
                // Animate the avatar
                elements.profileImage.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    elements.profileImage.style.transform = '';
                }, 300);
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// Password modal functions
function openPasswordModal() {
    elements.passwordModal.classList.add('show');
    elements.passwordModal.style.display = 'flex';
    document.getElementById('currentPassword')?.focus();
    document.body.style.overflow = 'hidden';
}

function closePasswordModal() {
    elements.passwordModal.classList.remove('show');
    setTimeout(() => {
        elements.passwordModal.style.display = 'none';
    }, 300);
    document.body.style.overflow = '';
    
    // Clear password form
    const passwordForm = document.getElementById('passwordForm');
    passwordForm?.reset();
    
    // Clear error messages
    const errorMessages = passwordForm?.querySelectorAll('.error-message');
    errorMessages?.forEach(msg => {
        msg.classList.remove('show');
        msg.textContent = '';
    });
    
    // Reset password strength
    resetPasswordStrength();
}

async function handlePasswordChange(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const passwordData = Object.fromEntries(formData);
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    if (passwordData.newPassword.length < 8) {
        showToast('Password must be at least 8 characters long', 'error');
        return;
    }
    
    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Updating...';
        submitBtn.disabled = true;
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        showToast('Password updated successfully! 🔐', 'success');
        closePasswordModal();
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    } catch (error) {
        showToast('Error updating password', 'error');
    }
}

function checkPasswordStrength(event) {
    const password = event.target.value;
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    let strengthLabel = 'Weak';
    let color = '#ef4444';
    
    // Check length
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    
    // Check for different character types
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    
    // Determine strength label and color
    if (strength >= 80) {
        strengthLabel = 'Very Strong';
        color = '#22c55e';
    } else if (strength >= 60) {
        strengthLabel = 'Strong';
        color = '#3b82f6';
    } else if (strength >= 40) {
        strengthLabel = 'Medium';
        color = '#f59e0b';
    }
    
    // Animate strength bar
    strengthBar.style.width = `${strength}%`;
    strengthBar.style.background = color;
    strengthText.textContent = `Password Strength: ${strengthLabel}`;
    strengthText.style.color = color;
}

function resetPasswordStrength() {
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    if (strengthBar) {
        strengthBar.style.width = '0%';
    }
    if (strengthText) {
        strengthText.textContent = 'Password Strength';
        strengthText.style.color = '';
    }
}

// Theme panel functions
function setupThemePanel() {
    const savedTheme = localStorage.getItem('preferredTheme') || 'light';
    updateActiveThemeCard(savedTheme);
}

function toggleThemePanel() {
    isThemePanelOpen = !isThemePanelOpen;
    elements.themePanel.classList.toggle('open', isThemePanelOpen);
    
    if (isThemePanelOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// Utility functions
function showLoadingSpinner() {
    elements.loadingSpinner.classList.add('show');
    elements.loadingSpinner.style.display = 'flex';
}

function hideLoadingSpinner() {
    elements.loadingSpinner.classList.remove('show');
    setTimeout(() => {
        elements.loadingSpinner.style.display = 'none';
    }, 300);
}

function showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    }[type] || 'fa-info-circle';
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; margin-left: auto; opacity: 0.7;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// Animation functions
function animateNumber(element, from, to, suffix = '') {
    const duration = 600;
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(from + (to - from) * easeProgress);
        
        element.textContent = current + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

function animateTextChange(element, newText) {
    element.style.opacity = '0.5';
    element.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        element.textContent = newText;
        element.style.opacity = '1';
        element.style.transform = 'scale(1)';
    }, 150);
}

function animateSuccess(element) {
    element.style.borderColor = '#22c55e';
    element.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
    
    setTimeout(() => {
        element.style.borderColor = '';
        element.style.boxShadow = '';
    }, 1000);
}

function animateError(element) {
    element.style.animation = 'shake 0.4s ease-in-out';
    
    setTimeout(() => {
        element.style.animation = '';
    }, 400);
}

function celebrateSuccess() {
    // Create confetti effect
    const colors = ['#667eea', '#764ba2', '#22c55e', '#3b82f6', '#f59e0b'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            createConfetti(colors[Math.floor(Math.random() * colors.length)]);
        }, i * 20);
    }
}

function createConfetti(color) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${color};
        left: ${Math.random() * 100}vw;
        top: -10px;
        z-index: 10000;
        pointer-events: none;
        border-radius: 50%;
    `;
    
    document.body.appendChild(confetti);
    
    const animation = confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(100vh) rotate(${Math.random() * 360}deg)`, opacity: 0 }
    ], {
        duration: Math.random() * 1000 + 1000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
    
    animation.addEventListener('finish', () => confetti.remove());
}

function animateEntrance() {
    const sections = document.querySelectorAll('.form-section');
    const quickActions = document.querySelectorAll('.action-btn');
    
    // Animate quick actions
    quickActions.forEach((btn, index) => {
        btn.style.opacity = '0';
        btn.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            btn.style.transition = 'all 0.5s ease';
            btn.style.opacity = '1';
            btn.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // Animate sections
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            section.style.transition = 'all 0.6s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 200 + index * 150);
    });
}

function setupScrollAnimations() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    
    // Observe all cards
    const cards = document.querySelectorAll('.input-card');
    cards.forEach(card => observer.observe(card));
}

// Password visibility toggle
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        field.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Additional utility functions
function generateId() {
    return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for global access
window.changeProfilePhoto = changeProfilePhoto;
window.openPasswordModal = openPasswordModal;
window.closePasswordModal = closePasswordModal;
window.resetForm = resetForm;
window.toggleThemePanel = toggleThemePanel;
window.togglePassword = togglePassword;

// Additional feature functions
window.openQuickEdit = function() {
    showToast('Quick Edit feature coming soon!', 'info');
};

window.openSettings = function() {
    showToast('Settings panel coming soon!', 'info');
};

window.viewActivity = function() {
    showToast('Activity dashboard coming soon!', 'info');
};

window.exportProfile = function() {
    const data = getFormData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profile.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Profile exported successfully! 📄', 'success');
};

window.shareProfile = function() {
    if (navigator.share) {
        navigator.share({
            title: 'My FixItFast Profile',
            text: 'Check out my profile on FixItFast!',
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Profile link copied to clipboard! 📋', 'success');
    }
};

// Add CSS for shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

console.log('✨ Modern Profile App loaded successfully!');