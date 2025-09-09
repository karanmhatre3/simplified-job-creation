// ============================================
// Unified Translation Platform - JavaScript
// ============================================

// Global State Management
const state = {
    selectedFiles: [],
    selectedLanguages: [],
    dragCounter: 0,
    isTranslating: false,
    isCompleted: false
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    feather.replace();
    initializeApp();
});

function initializeApp() {
    initializeFileUpload();
    initializeLanguageSelector();
    initializeToggles();
    initializeButtons();
    initializeToasts();
    initializeAdvancedOptions();
    updateFormState();
}

// ============================================
// DOM Elements Helper
// ============================================

function getElements() {
    return {
        // Upload elements
        uploadBox: document.getElementById('uploadBox'),
        uploadArea: document.getElementById('uploadArea'),
        fileInput: document.getElementById('fileInput'),
        fileListContainer: document.getElementById('fileListContainer'),
        fileList: document.getElementById('fileList'),
        uploadingFiles: document.getElementById('uploadingFiles'),
        addMoreFiles: document.getElementById('addMoreFiles'),
        uploadFilesBtn: document.getElementById('uploadFilesBtn'),
        dragOverlay: document.getElementById('dragOverlay'),
        
        // Language elements
        languageField: document.getElementById('languageField'),
        languageSelector: document.getElementById('languageSelector'),
        selectedLanguages: document.getElementById('selectedLanguages'),
        languageDropdown: document.getElementById('languageDropdown'),
        
        // Toggle elements
        toggleField: document.getElementById('toggleField'),
        humanToggle: document.getElementById('humanToggle'),
        verifyToggleContainer: document.getElementById('verifyToggleContainer'),
        verifyToggle: document.getElementById('verifyToggle'),
        
        // Button elements
        translateBtn: document.getElementById('translateBtn'),
        advancedOptionsBtn: document.getElementById('advancedOptionsBtn'),
        
        // Toast elements
        progressToast: document.getElementById('progressToast'),
        successToast: document.getElementById('successToast'),
        toastProgressFill: document.getElementById('toastProgressFill'),
        
        // Views
        mainView: document.getElementById('mainView'),
        jobDetailsView: document.getElementById('jobDetailsView'),
        confirmationView: document.getElementById('confirmationView'),
        
        // Advanced Options
        sidebarOverlay: document.getElementById('sidebarOverlay'),
        advancedSidebar: document.getElementById('advancedSidebar')
    };
}

// ============================================
// File Upload Module
// ============================================

function initializeFileUpload() {
    const { uploadArea, fileInput, uploadFilesBtn, dragOverlay } = getElements();
    
    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Upload area click
    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput?.click());
    }
    
    // Upload files button
    if (uploadFilesBtn) {
        uploadFilesBtn.addEventListener('click', () => fileInput?.click());
    }
    
    // Drag and drop
    setupDragAndDrop();
}

function setupDragAndDrop() {
    const { dragOverlay } = getElements();
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        document.addEventListener(eventName, handleDragEnter, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, handleDragLeave, false);
    });
    
    document.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDragEnter(e) {
    const { dragOverlay } = getElements();
    state.dragCounter++;
    if (dragOverlay && state.dragCounter === 1) {
        dragOverlay.classList.remove('hidden');
    }
}

function handleDragLeave(e) {
    const { dragOverlay } = getElements();
    state.dragCounter--;
    if (dragOverlay && state.dragCounter === 0) {
        dragOverlay.classList.add('hidden');
    }
}

function handleDrop(e) {
    const { dragOverlay } = getElements();
    state.dragCounter = 0;
    if (dragOverlay) {
        dragOverlay.classList.add('hidden');
    }
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
        processFiles(files);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
        processFiles(files);
    }
}

function processFiles(files) {
    const { fileListContainer, uploadBox } = getElements();
    
    // Show file list container
    if (fileListContainer) {
        fileListContainer.classList.remove('hidden');
    }
    if (uploadBox) {
        uploadBox.classList.add('hidden');
    }
    
    // Add files to state
    Array.from(files).forEach(file => {
        const fileId = Date.now() + Math.random();
        const fileData = {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadProgress: 0,
            status: 'uploading'
        };
        
        state.selectedFiles.push(fileData);
        addFileToUI(fileData);
        simulateFileUpload(fileData);
    });
    
    updateFormState();
}

function addFileToUI(file) {
    const { uploadingFiles } = getElements();
    if (!uploadingFiles) return;
    
    const fileItem = createFileElement(file);
    uploadingFiles.appendChild(fileItem);
}

function createFileElement(file) {
    const div = document.createElement('div');
    div.className = 'file-item uploading';
    div.id = `file-${file.id}`;
    div.innerHTML = `
        <div class="file-content">
            <div class="file-info">
                <i data-feather="file-text" class="file-icon"></i>
                <div class="file-details">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">(${formatFileSize(file.size)})</span>
                </div>
            </div>
            <div class="upload-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <span class="progress-text">0%</span>
            </div>
        </div>
    `;
    
    setTimeout(() => feather.replace(), 10);
    return div;
}

function simulateFileUpload(file) {
    const duration = 5000; // 5 seconds
    const interval = 100; // Update every 100ms
    const steps = duration / interval;
    const increment = 100 / steps;
    
    const timer = setInterval(() => {
        file.uploadProgress += increment;
        
        if (file.uploadProgress >= 100) {
            clearInterval(timer);
            file.uploadProgress = 100;
            file.status = 'completed';
            finalizeFileUpload(file);
        } else {
            updateFileProgress(file);
        }
    }, interval);
}

function updateFileProgress(file) {
    const fileElement = document.getElementById(`file-${file.id}`);
    if (!fileElement) return;
    
    const progressFill = fileElement.querySelector('.progress-fill');
    const progressText = fileElement.querySelector('.progress-text');
    
    if (progressFill) {
        progressFill.style.width = `${file.uploadProgress}%`;
    }
    if (progressText) {
        progressText.textContent = `${Math.round(file.uploadProgress)}%`;
    }
}

function finalizeFileUpload(file) {
    const fileElement = document.getElementById(`file-${file.id}`);
    if (!fileElement) return;
    
    // Move to completed files
    const { fileList, uploadingFiles } = getElements();
    if (fileList && uploadingFiles && fileElement.parentNode === uploadingFiles) {
        fileElement.classList.remove('uploading');
        fileElement.classList.add('completed');
        
        // Update UI to show completed state
        fileElement.innerHTML = `
            <div class="file-content">
                <div class="file-info">
                    <i data-feather="file-text" class="file-icon"></i>
                    <div class="file-details">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">(${formatFileSize(file.size)})</span>
                    </div>
                </div>
                <button class="file-remove" onclick="removeFile('${file.id}')">
                    <i data-feather="trash-2"></i>
                </button>
            </div>
        `;
        
        fileList.appendChild(fileElement);
        setTimeout(() => feather.replace(), 10);
    }
    
    updateAddMoreFilesSection();
}

function removeFile(fileId) {
    state.selectedFiles = state.selectedFiles.filter(f => f.id != fileId);
    const fileElement = document.getElementById(`file-${fileId}`);
    fileElement?.remove();
    
    // Hide file list if no files
    if (state.selectedFiles.length === 0) {
        const { fileListContainer, uploadBox } = getElements();
        if (fileListContainer) {
            fileListContainer.classList.add('hidden');
        }
        if (uploadBox) {
            uploadBox.classList.remove('hidden');
        }
    }
    
    updateAddMoreFilesSection();
    updateFormState();
}

function updateAddMoreFilesSection() {
    const { uploadingFiles, addMoreFiles } = getElements();
    if (!uploadingFiles || !addMoreFiles) return;
    
    const hasUploadingFiles = uploadingFiles.children.length > 0;
    addMoreFiles.style.display = hasUploadingFiles ? 'none' : 'block';
}

// ============================================
// Language Selector Module
// ============================================

function initializeLanguageSelector() {
    const { languageSelector, languageDropdown } = getElements();
    
    if (languageSelector && languageDropdown) {
        languageSelector.addEventListener('click', toggleLanguageDropdown);
        
        const options = languageDropdown.querySelectorAll('.language-option');
        options.forEach(option => {
            option.addEventListener('click', selectLanguage);
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#languageSelector') && !e.target.closest('#languageDropdown')) {
                languageDropdown.classList.add('hidden');
            }
        });
    }
}

function toggleLanguageDropdown(e) {
    e.stopPropagation();
    const { languageDropdown } = getElements();
    if (languageDropdown) {
        languageDropdown.classList.toggle('hidden');
    }
}

function selectLanguage(e) {
    e.stopPropagation();
    const lang = e.target.dataset.lang;
    const langText = e.target.textContent;
    
    if (!state.selectedLanguages.find(l => l.code === lang)) {
        state.selectedLanguages.push({ code: lang, text: langText });
        updateSelectedLanguages();
        updateFormState();
    }
    
    const { languageDropdown } = getElements();
    if (languageDropdown) {
        languageDropdown.classList.add('hidden');
    }
}

function updateSelectedLanguages() {
    const { selectedLanguages: container } = getElements();
    if (!container) return;
    
    if (state.selectedLanguages.length === 0) {
        container.innerHTML = '<span class="placeholder">Select languages</span>';
    } else {
        container.innerHTML = state.selectedLanguages.map((lang, index) => `
            <div class="language-chip" data-index="${index}">
                <span>${lang.text}</span>
                <i data-feather="x" class="chip-remove" onclick="removeLanguage(${index})"></i>
            </div>
        `).join('');
        
        setTimeout(() => feather.replace(), 10);
    }
}

function removeLanguage(index) {
    state.selectedLanguages.splice(index, 1);
    updateSelectedLanguages();
    updateFormState();
}

// Make removeLanguage global for onclick
window.removeLanguage = removeLanguage;
window.removeFile = removeFile;

// ============================================
// Toggle Controls Module
// ============================================

function initializeToggles() {
    const { humanToggle, verifyToggle } = getElements();
    
    if (humanToggle) {
        humanToggle.addEventListener('change', handleHumanToggleChange);
        
        // Make label clickable
        const label = document.querySelector('label[for="humanToggle"]');
        if (!label) {
            const toggleContainer = humanToggle.closest('.toggle-container');
            if (toggleContainer) {
                toggleContainer.addEventListener('click', (e) => {
                    if (e.target !== humanToggle && !e.target.closest('.toggle-switch')) {
                        humanToggle.click();
                    }
                });
            }
        }
    }
    
    if (verifyToggle) {
        const label = document.querySelector('label[for="verifyToggle"]');
        if (!label) {
            const toggleContainer = verifyToggle.closest('.toggle-container');
            if (toggleContainer) {
                toggleContainer.addEventListener('click', (e) => {
                    if (e.target !== verifyToggle && !e.target.closest('.toggle-switch')) {
                        verifyToggle.click();
                    }
                });
            }
        }
    }
}

function handleHumanToggleChange(e) {
    const { verifyToggleContainer, translateBtn, advancedOptionsBtn } = getElements();
    const isChecked = e.target.checked;
    
    if (verifyToggleContainer) {
        verifyToggleContainer.classList.toggle('hidden', !isChecked);
    }
    
    if (translateBtn) {
        const btnText = document.getElementById('translateBtnText');
        const icon = translateBtn.querySelector('svg');
        
        if (isChecked) {
            if (btnText) btnText.textContent = 'Review job details';
            if (advancedOptionsBtn) {
                advancedOptionsBtn.style.display = 'flex';
            }
            if (icon) {
                const newIcon = document.createElement('i');
                newIcon.setAttribute('data-feather', 'arrow-right');
                icon.parentNode.replaceChild(newIcon, icon);
                feather.replace();
            }
        } else {
            if (btnText) btnText.textContent = 'Translate';
            if (advancedOptionsBtn) {
                advancedOptionsBtn.style.display = 'none';
            }
            if (icon) {
                const newIcon = document.createElement('i');
                newIcon.setAttribute('data-feather', 'disc');
                icon.parentNode.replaceChild(newIcon, icon);
                feather.replace();
            }
        }
        
        // Reset verify toggle
        const verifyToggle = document.getElementById('verifyToggle');
        if (!isChecked && verifyToggle) {
            verifyToggle.checked = false;
        }
    }
}

// ============================================
// Form State Management
// ============================================

function updateFormState() {
    const hasFiles = state.selectedFiles.length > 0;
    const hasLanguages = state.selectedLanguages.length > 0;
    
    // Enable/disable language field
    const { languageField, toggleField, translateBtn } = getElements();
    
    if (languageField) {
        languageField.classList.toggle('disabled', !hasFiles);
    }
    
    if (toggleField) {
        toggleField.classList.toggle('disabled', !hasFiles || !hasLanguages);
    }
    
    // Enable/disable translate button
    if (translateBtn) {
        translateBtn.disabled = !(hasFiles && hasLanguages);
    }
    
    // Enable/disable toggles
    const humanToggle = document.getElementById('humanToggle');
    const verifyToggle = document.getElementById('verifyToggle');
    
    if (humanToggle) {
        humanToggle.disabled = !hasFiles || !hasLanguages;
    }
    
    if (verifyToggle) {
        verifyToggle.disabled = !hasFiles || !hasLanguages;
    }
}

// ============================================
// Button Handlers
// ============================================

function initializeButtons() {
    const { translateBtn } = getElements();
    
    if (translateBtn) {
        translateBtn.addEventListener('click', handleTranslateClick);
    }
    
    // Job details screen buttons
    const backToFilesBtn = document.getElementById('backToFilesBtn');
    const sendForTranslationBtn = document.getElementById('sendForTranslationBtn');
    
    if (backToFilesBtn) {
        backToFilesBtn.addEventListener('click', showMainView);
    }
    
    if (sendForTranslationBtn) {
        sendForTranslationBtn.addEventListener('click', showConfirmationScreen);
    }
    
    // Confirmation screen buttons
    const newTranslationBtn = document.getElementById('newTranslationBtn');
    const viewProjectsBtn = document.getElementById('viewProjectsBtn');
    
    if (newTranslationBtn) {
        newTranslationBtn.addEventListener('click', () => {
            resetApplication();
            showMainView();
        });
    }
    
    if (viewProjectsBtn) {
        viewProjectsBtn.addEventListener('click', () => {
            console.log('Navigate to projects page');
        });
    }
}

function handleTranslateClick() {
    if (state.selectedFiles.length > 0 && state.selectedLanguages.length > 0) {
        startTranslation();
    }
}

function startTranslation() {
    const humanToggle = document.getElementById('humanToggle');
    
    if (humanToggle && humanToggle.checked) {
        showJobDetailsScreen();
    } else {
        // Store file count before reset
        const fileCount = state.selectedFiles.length || 2;
        
        // Reset form immediately
        resetApplication();
        
        // Show progress toast for 10 seconds
        showProgressToast(fileCount);
        
        // Animate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            updateProgressToast(progress, fileCount);
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    hideProgressToast();
                    showSuccessToast();
                }, 500);
            }
        }, 1000);
    }
}

// ============================================
// View Navigation
// ============================================

function showMainView() {
    const { mainView, jobDetailsView, confirmationView } = getElements();
    
    if (mainView) mainView.classList.remove('hidden');
    if (jobDetailsView) jobDetailsView.classList.add('hidden');
    if (confirmationView) confirmationView.classList.add('hidden');
}

function showJobDetailsScreen() {
    const { mainView, jobDetailsView } = getElements();
    
    if (mainView && jobDetailsView) {
        mainView.classList.add('hidden');
        jobDetailsView.classList.remove('hidden');
        updateJobSummary();
        setTimeout(() => feather.replace(), 10);
    }
}

function showConfirmationScreen() {
    const { mainView, jobDetailsView, confirmationView } = getElements();
    
    if (mainView && jobDetailsView && confirmationView) {
        mainView.classList.add('hidden');
        jobDetailsView.classList.add('hidden');
        confirmationView.classList.remove('hidden');
        
        // Recreate Lottie animation
        const iconContainer = confirmationView.querySelector('.confirmation-icon');
        if (iconContainer) {
            iconContainer.innerHTML = `
                <dotlottie-wc 
                    id="confirmationLottie"
                    src="https://lottie.host/14db5b3e-3d14-4b6a-a107-bf9b54df4981/UaxlL2hslO.lottie" 
                    style="width: 120px; height: 120px" 
                    speed="1"
                    autoplay>
                </dotlottie-wc>
            `;
        }
        
        feather.replace();
    }
}

function updateJobSummary() {
    const summaryFiles = document.getElementById('summaryFiles');
    const summaryWords = document.getElementById('summaryWords');
    const summaryPairs = document.getElementById('summaryPairs');
    
    if (summaryFiles) {
        summaryFiles.textContent = state.selectedFiles.length;
    }
    
    if (summaryWords) {
        const wordCount = state.selectedFiles.length * 601;
        summaryWords.textContent = wordCount.toLocaleString();
    }
    
    if (summaryPairs) {
        summaryPairs.textContent = state.selectedLanguages.length;
    }
}

// ============================================
// Toast Notifications
// ============================================

function initializeToasts() {
    const dismissBtn = document.getElementById('dismissBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const toastClose = document.querySelector('.success-toast .toast-close');
    
    if (dismissBtn) {
        dismissBtn.addEventListener('click', hideSuccessToast);
    }
    
    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', downloadTranslatedFiles);
    }
    
    if (toastClose) {
        toastClose.addEventListener('click', hideSuccessToast);
    }
}

function showProgressToast(fileCount = 2) {
    const { progressToast } = getElements();
    const progressMessage = document.getElementById('progressMessage');
    
    if (progressToast) {
        progressToast.classList.remove('hidden');
        progressToast.style.display = 'block';
    }
    
    if (progressMessage) {
        progressMessage.textContent = `${fileCount} files translating ... 10 seconds left`;
    }
}

function hideProgressToast() {
    const { progressToast } = getElements();
    if (progressToast) {
        progressToast.style.display = 'none';
    }
}

function updateProgressToast(progress, fileCount = 2) {
    const { toastProgressFill } = getElements();
    const progressMessage = document.getElementById('progressMessage');
    
    if (toastProgressFill) {
        toastProgressFill.style.width = `${progress}%`;
    }
    
    if (progressMessage) {
        const timeLeft = Math.round((100 - progress) / 10);
        progressMessage.textContent = `${fileCount} files translating ... ${timeLeft} seconds left`;
    }
}

function showSuccessToast() {
    const { successToast } = getElements();
    if (successToast) {
        successToast.classList.remove('hidden');
        successToast.style.display = 'block';
        setTimeout(() => feather.replace(), 10);
    }
}

function hideSuccessToast() {
    const { successToast } = getElements();
    if (successToast) {
        successToast.classList.add('hidden');
        successToast.style.display = 'none';
    }
}

function downloadTranslatedFiles() {
    console.log('Downloading translated files...');
    // Implementation for download
}

// ============================================
// Advanced Options Sidebar
// ============================================

function initializeAdvancedOptions() {
    const advancedOptionsBtn = document.getElementById('advancedOptionsBtn');
    const advancedOptionsBtn2 = document.getElementById('advancedOptionsBtn2');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const { sidebarOverlay } = getElements();
    
    if (advancedOptionsBtn) {
        advancedOptionsBtn.addEventListener('click', showAdvancedSidebar);
    }
    
    if (advancedOptionsBtn2) {
        advancedOptionsBtn2.addEventListener('click', showAdvancedSidebar);
    }
    
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', hideAdvancedSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', hideAdvancedSidebar);
    }
    
    // Initialize dropdowns and textarea
    setupSidebarDropdowns();
    setupTextareaCounter();
}

function showAdvancedSidebar() {
    const { sidebarOverlay, advancedSidebar } = getElements();
    
    if (sidebarOverlay && advancedSidebar) {
        sidebarOverlay.classList.remove('hidden');
        advancedSidebar.classList.remove('hidden');
        void advancedSidebar.offsetWidth; // Force reflow
        advancedSidebar.classList.add('show');
        feather.replace();
    }
}

function hideAdvancedSidebar() {
    const { sidebarOverlay, advancedSidebar } = getElements();
    
    if (sidebarOverlay && advancedSidebar) {
        advancedSidebar.classList.remove('show');
        setTimeout(() => {
            sidebarOverlay.classList.add('hidden');
            advancedSidebar.classList.add('hidden');
        }, 300);
    }
}

function setupSidebarDropdowns() {
    const dropdowns = document.querySelectorAll('.field-dropdown');
    
    dropdowns.forEach(dropdown => {
        const dropdownInput = dropdown.querySelector('.dropdown-input');
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        const dropdownOptions = dropdown.querySelectorAll('.dropdown-option');
        
        if (dropdownInput) {
            dropdownInput.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Close other dropdowns
                dropdowns.forEach(other => {
                    if (other !== dropdown) {
                        other.classList.remove('open');
                        const menu = other.querySelector('.dropdown-menu');
                        if (menu) menu.classList.add('hidden');
                    }
                });
                
                // Toggle current dropdown
                dropdown.classList.toggle('open');
                if (dropdownMenu) {
                    dropdownMenu.classList.toggle('hidden');
                }
            });
        }
        
        // Handle option selection
        dropdownOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (dropdownInput) {
                    dropdownInput.textContent = option.textContent;
                }
                
                dropdownOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                dropdown.classList.remove('open');
                if (dropdownMenu) {
                    dropdownMenu.classList.add('hidden');
                }
            });
        });
    });
    
    // Close dropdowns on outside click
    document.addEventListener('click', () => {
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('open');
            const menu = dropdown.querySelector('.dropdown-menu');
            if (menu) menu.classList.add('hidden');
        });
    });
}

function setupTextareaCounter() {
    const textareaInput = document.querySelector('.textarea-input');
    const textareaCount = document.querySelector('.textarea-count');
    
    if (textareaInput && textareaCount) {
        textareaInput.addEventListener('input', () => {
            const count = textareaInput.value.length;
            textareaCount.textContent = `${count}/200`;
        });
    }
}

// ============================================
// Utility Functions
// ============================================

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function resetApplication() {
    state.selectedFiles = [];
    state.selectedLanguages = [];
    
    const { fileListContainer, uploadBox, fileList, uploadingFiles } = getElements();
    
    // Clear file lists
    if (fileList) fileList.innerHTML = '';
    if (uploadingFiles) uploadingFiles.innerHTML = '';
    
    // Show upload box, hide file list
    if (fileListContainer) fileListContainer.classList.add('hidden');
    if (uploadBox) uploadBox.classList.remove('hidden');
    
    // Reset language selection
    updateSelectedLanguages();
    
    // Reset toggles
    const humanToggle = document.getElementById('humanToggle');
    const verifyToggle = document.getElementById('verifyToggle');
    
    if (humanToggle) humanToggle.checked = false;
    if (verifyToggle) verifyToggle.checked = false;
    
    // Trigger change event to update UI
    if (humanToggle) {
        humanToggle.dispatchEvent(new Event('change'));
    }
    
    // Update form state
    updateFormState();
}