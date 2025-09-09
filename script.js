// Initialize Feather Icons
document.addEventListener('DOMContentLoaded', () => {
    feather.replace();
    initializeApp();
});

// Global variables
let selectedFiles = [];
let selectedLanguages = [
    { code: 'es-ES', text: 'Spanish (Spain) [esES]' },
    { code: 'fr-FR', text: 'French (France) [frFR]' }
];

// Form states
let formState = {
    hasFiles: false,
    isTranslating: false,
    isCompleted: false
};

// Initialize application
function initializeApp() {
    setupFileUpload();
    setupLanguageSelector();
    updateSelectedLanguages(); // Display default selected languages
    updateFormState(); // Set initial form state
    setupToasts();
    setupButtons();
    setupToggleLabels();
}

// Get DOM elements
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
        
        // Form elements
        languageField: document.getElementById('languageField'),
        languageSelector: document.getElementById('languageSelector'),
        languageDropdown: document.getElementById('languageDropdown'),
        selectedLanguages: document.getElementById('selectedLanguages'),
        toggleField: document.getElementById('toggleField'),
        humanToggle: document.getElementById('humanToggle'),
        translateBtn: document.getElementById('translateBtn'),
        
        // Toast elements
        progressToast: document.getElementById('progressToast'),
        successToast: document.getElementById('successToast'),
        toastProgressFill: document.getElementById('toastProgressFill')
    };
}

// Update form state and UI
function updateFormState() {
    const { 
        uploadBox, 
        fileListContainer, 
        languageField, 
        toggleField, 
        languageSelector,
        humanToggle,
        translateBtn 
    } = getElements();
    
    const verifyToggle = document.getElementById('verifyToggle');
    
    // Update upload section visibility
    if (formState.hasFiles) {
        uploadBox?.classList.add('hidden');
        fileListContainer?.classList.remove('hidden');
    } else {
        uploadBox?.classList.remove('hidden');
        fileListContainer?.classList.add('hidden');
    }
    
    // Update form field states
    if (formState.hasFiles && !formState.isTranslating) {
        // Enable form fields
        languageField?.classList.remove('disabled');
        toggleField?.classList.remove('disabled');
        languageSelector?.classList.add('active');
        if (humanToggle) humanToggle.disabled = false;
        if (verifyToggle) verifyToggle.disabled = false;
        
        // Enable translate button if languages are selected
        if (translateBtn && selectedLanguages.length > 0) {
            translateBtn.disabled = false;
            translateBtn.classList.add('active');
        }
    } else {
        // Disable form fields
        languageField?.classList.add('disabled');
        toggleField?.classList.add('disabled');
        languageSelector?.classList.remove('active');
        if (humanToggle) humanToggle.disabled = true;
        if (verifyToggle) verifyToggle.disabled = true;
        
        if (translateBtn) {
            translateBtn.disabled = true;
            translateBtn.classList.remove('active');
        }
    }
}

// File Upload Functionality
function setupFileUpload() {
    const { uploadArea, fileInput } = getElements();
    const dragOverlay = document.getElementById('dragOverlay');
    let dragCounter = 0;
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Global drag events for overlay
    document.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        if (dragCounter === 1) {
            showDragOverlay();
        }
    });
    
    document.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            hideDragOverlay();
        }
    });
    
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        hideDragOverlay();
        handleFiles(e.dataTransfer.files);
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // Overlay click to browse
    if (dragOverlay) {
        dragOverlay.addEventListener('click', () => {
            fileInput.click();
            hideDragOverlay();
        });
    }
}

// Show/hide drag overlay
function showDragOverlay() {
    const overlay = document.getElementById('dragOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        setTimeout(() => feather.replace(), 10);
    }
}

function hideDragOverlay() {
    const overlay = document.getElementById('dragOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// Handle file selection
function handleFiles(files) {
    const validTypes = ['application/pdf', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                       'text/plain'];
    
    const newFiles = [];
    for (let file of files) {
        if (validTypes.includes(file.type) || file.name.match(/\.(pdf|doc|docx|txt|xliff|tmx|sdlxliff)$/i)) {
            newFiles.push(file);
        }
    }
    
    if (newFiles.length > 0) {
        // Add files to list immediately and update UI
        selectedFiles.push(...newFiles);
        formState.hasFiles = selectedFiles.length > 0;
        updateFileList();
        updateFormState();
        
        // Start upload simulation for each new file
        newFiles.forEach((file, index) => {
            simulateFileUpload(file, selectedFiles.length - newFiles.length + index);
        });
    }
}

// Simulate file upload with progress
function simulateFileUpload(file, fileIndex) {
    const { fileList } = getElements();
    if (!fileList) return;
    
    // Find the file item in the list
    const fileItems = fileList.querySelectorAll('.file-item');
    const fileItem = fileItems[fileIndex];
    if (!fileItem) return;
    
    // Convert file item to uploading state
    const removeBtn = fileItem.querySelector('.file-item-remove');
    if (removeBtn) {
        // Replace remove button with uploading state
        removeBtn.outerHTML = `
            <div class="file-uploading-status">
                <span class="file-uploading-percent">Uploading (0%)...</span>
                <div class="upload-spinner"></div>
                <button class="file-uploading-close">
                    <i data-feather="x"></i>
                </button>
            </div>
        `;
        
        // Add progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'file-upload-progress-bar';
        progressBar.innerHTML = '<div class="file-upload-progress-fill" style="width: 0%"></div>';
        fileItem.appendChild(progressBar);
        
        feather.replace();
        
        // Add cancel functionality
        const cancelBtn = fileItem.querySelector('.file-uploading-close');
        let cancelled = false;
        cancelBtn.addEventListener('click', () => {
            cancelled = true;
            removeFile(fileIndex);
        });
        
        // Simulate upload progress over 5 seconds
        let progress = 0;
        const interval = setInterval(() => {
            if (cancelled) {
                clearInterval(interval);
                return;
            }
            
            progress += 4; // 4% every 200ms = 100% in 5 seconds
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                // Complete upload - convert back to normal file item
                setTimeout(() => {
                    if (!cancelled) {
                        const uploadingStatus = fileItem.querySelector('.file-uploading-status');
                        const progressBar = fileItem.querySelector('.file-upload-progress-bar');
                        
                        if (uploadingStatus) {
                            uploadingStatus.outerHTML = `
                                <button class="file-item-remove" data-index="${fileIndex}">
                                    <i data-feather="trash-2"></i>
                                </button>
                            `;
                        }
                        if (progressBar) {
                            progressBar.remove();
                        }
                        
                        feather.replace();
                        
                        // Re-attach remove functionality
                        const newRemoveBtn = fileItem.querySelector('.file-item-remove');
                        if (newRemoveBtn) {
                            newRemoveBtn.addEventListener('click', () => removeFile(fileIndex));
                        }
                    }
                }, 500);
            }
            
            // Update progress display
            const progressFill = fileItem.querySelector('.file-upload-progress-fill');
            const progressText = fileItem.querySelector('.file-uploading-percent');
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressText) progressText.textContent = `Uploading (${progress}%)...`;
        }, 200);
    }
}

// Update file list display
function updateFileList() {
    const { fileList } = getElements();
    
    if (fileList) {
        fileList.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileItem = createFileItem(file, index);
            fileList.appendChild(fileItem);
        });
    }
    
    // Update add more files section appearance
    updateAddMoreFilesSection();
}

// Create file item element
function createFileItem(file, index) {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
        <div class="file-item-info">
            <span class="file-item-name">${file.name}</span>
            <span class="file-item-size">(${formatFileSize(file.size)})</span>
        </div>
        <button class="file-item-remove" data-index="${index}">
            <i data-feather="trash-2"></i>
        </button>
    `;
    
    // Add remove functionality
    const removeBtn = item.querySelector('.file-item-remove');
    removeBtn.addEventListener('click', () => removeFile(index));
    
    // Replace feather icons
    setTimeout(() => feather.replace(), 10);
    
    return item;
}

// Remove file from list
function removeFile(index) {
    selectedFiles.splice(index, 1);
    formState.hasFiles = selectedFiles.length > 0;
    updateFileList();
    updateFormState();
}

// Language Selector
function setupLanguageSelector() {
    const { languageSelector, languageDropdown } = getElements();
    
    if (!languageSelector || !languageDropdown) return;
    
    // Toggle dropdown
    languageSelector.addEventListener('click', (e) => {
        // Don't toggle if clicking on a language chip or its remove button
        if (e.target.closest('.language-chip') || e.target.classList.contains('remove-chip')) {
            return;
        }
        languageDropdown.classList.toggle('hidden');
    });
    
    // Language options
    const languageOptions = languageDropdown.querySelectorAll('.language-option');
    languageOptions.forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.dataset.lang;
            const langText = option.textContent;
            
            if (!selectedLanguages.find(l => l.code === lang)) {
                selectedLanguages.push({ code: lang, text: langText });
                updateSelectedLanguages();
            }
            
            languageDropdown.classList.add('hidden');
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!languageSelector.contains(e.target) && !languageDropdown.contains(e.target)) {
            languageDropdown.classList.add('hidden');
        }
    });
}

// Update selected languages display
function updateSelectedLanguages() {
    const { selectedLanguages: container } = getElements();
    
    if (container) {
        container.innerHTML = '';
        
        if (selectedLanguages.length === 0) {
            container.innerHTML = '<span class="placeholder">Select target languages</span>';
        } else {
            selectedLanguages.forEach((lang, index) => {
                const chip = document.createElement('div');
                chip.className = 'language-chip';
                chip.innerHTML = `
                    <span>${lang.text}</span>
                    <i data-feather="x" class="remove-chip" data-index="${index}"></i>
                `;
                
                // Add remove functionality
                const removeBtn = chip.querySelector('.remove-chip');
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    removeLanguage(index);
                });
                
                container.appendChild(chip);
            });
            
            // Replace feather icons
            setTimeout(() => feather.replace(), 10);
        }
    }
    
    // Update form state to refresh translate button
    updateFormState();
}

// Remove language from selection
function removeLanguage(index) {
    selectedLanguages.splice(index, 1);
    updateSelectedLanguages();
}

// Update add more files section
function updateAddMoreFilesSection() {
    const addMoreFiles = document.getElementById('addMoreFiles');
    if (!addMoreFiles) return;
    
    // Always show the same design with upload button
    addMoreFiles.innerHTML = `
        <div class="add-more-content">
            <div class="add-more-text">
                <strong>Drag and drop your files here, or click to browse.</strong>
                <p>We support most formats, and files can be up to 2 GB - <a href="#">See supported formats</a></p>
            </div>
            <button class="upload-files-btn" id="uploadFilesBtn">
                <i data-feather="upload"></i>
                Upload files
            </button>
        </div>
    `;
    
    // Re-initialize feather icons
    feather.replace();
    
    // Re-attach event handlers
    setupAddMoreFilesHandlers();
}

// Setup add more files handlers
function setupAddMoreFilesHandlers() {
    const addMoreFiles = document.getElementById('addMoreFiles');
    const uploadFilesBtn = document.getElementById('uploadFilesBtn');
    const { fileInput } = getElements();
    
    if (addMoreFiles) {
        // Only button is clickable
        addMoreFiles.style.cursor = 'default';
        addMoreFiles.onclick = null;
        
        if (uploadFilesBtn) {
            uploadFilesBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (fileInput) fileInput.click();
            });
        }
        
        // Drag and drop always works
        addMoreFiles.addEventListener('dragover', (e) => {
            e.preventDefault();
            addMoreFiles.style.background = '#f0f4ff';
            addMoreFiles.style.borderColor = 'var(--color-purple-500)';
        });
        
        addMoreFiles.addEventListener('dragleave', () => {
            addMoreFiles.style.background = '';
            addMoreFiles.style.borderColor = '';
        });
        
        addMoreFiles.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            addMoreFiles.style.background = '';
            addMoreFiles.style.borderColor = '';
            handleFiles(e.dataTransfer.files);
        });
    }
}

// Setup button handlers
function setupButtons() {
    const { translateBtn } = getElements();
    
    // Translation button
    if (translateBtn) {
        translateBtn.addEventListener('click', () => {
            if (selectedLanguages.length > 0 && selectedFiles.length > 0) {
                startTranslation();
            }
        });
    }
    
    // Job details screen buttons
    const backToFilesBtn = document.getElementById('backToFilesBtn');
    const sendForTranslationBtn = document.getElementById('sendForTranslationBtn');
    
    if (backToFilesBtn) {
        backToFilesBtn.addEventListener('click', () => {
            showMainView();
        });
    }
    
    if (sendForTranslationBtn) {
        sendForTranslationBtn.addEventListener('click', () => {
            // Show confirmation screen
            showConfirmationScreen();
        });
    }
    
    // Initial setup of add more files
    updateAddMoreFilesSection();
    
    // New translation button
    const newTransBtn = document.getElementById('newTranslationBtn2');
    if (newTransBtn) {
        newTransBtn.addEventListener('click', () => {
            resetApplication();
        });
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
            // In a real app, this would navigate to projects page
            console.log('Navigate to projects page');
        });
    }
    
    // Success toast buttons
    const dismissBtn = document.getElementById('dismissBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            hideSuccessToast();
        });
    }
    
    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', () => {
            downloadTranslatedFiles();
        });
    }
}

// Start translation simulation
function startTranslation() {
    // Check if human-certified translation is selected
    const humanToggle = document.getElementById('humanToggle');
    
    if (humanToggle && humanToggle.checked) {
        // Show job details review screen
        showJobDetailsScreen();
    } else {
        // Store file count before reset
        const fileCount = selectedFiles.length || 2;
        
        // Reset form immediately
        resetApplication();
        
        // Show progress toast for 10 seconds, then success
        showProgressToast(fileCount);
        
        // Animate progress over 10 seconds
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            updateProgressToast(progress, fileCount);
            
            if (progress >= 100) {
                clearInterval(interval);
                // Hide progress and show success
                setTimeout(() => {
                    hideProgressToast();
                    showSuccessToast();
                }, 500);
            }
        }, 1000); // Update every second for 10 seconds
    }
}

// Show job details review screen
function showJobDetailsScreen() {
    const mainView = document.getElementById('mainView');
    const jobDetailsView = document.getElementById('jobDetailsView');
    
    if (mainView && jobDetailsView) {
        mainView.classList.add('hidden');
        jobDetailsView.classList.remove('hidden');
        
        // Update summary values based on current state
        updateJobSummary();
        
        // Re-initialize feather icons for new screen
        setTimeout(() => feather.replace(), 10);
    }
}

// Show main view (hide job details)
function showMainView() {
    const mainView = document.getElementById('mainView');
    const jobDetailsView = document.getElementById('jobDetailsView');
    const confirmationView = document.getElementById('confirmationView');
    
    if (mainView && jobDetailsView && confirmationView) {
        mainView.classList.remove('hidden');
        jobDetailsView.classList.add('hidden');
        confirmationView.classList.add('hidden');
    }
}

// Show confirmation screen
function showConfirmationScreen() {
    const mainView = document.getElementById('mainView');
    const jobDetailsView = document.getElementById('jobDetailsView');
    const confirmationView = document.getElementById('confirmationView');
    
    if (mainView && jobDetailsView && confirmationView) {
        mainView.classList.add('hidden');
        jobDetailsView.classList.add('hidden');
        confirmationView.classList.remove('hidden');
        
        // Initialize feather icons in the new view
        feather.replace();
        
        // Reset the Lottie animation by recreating it
        const iconContainer = confirmationView.querySelector('.confirmation-icon');
        if (iconContainer) {
            // Clear and recreate the animation element
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
    }
}

// Update job summary with current values
function updateJobSummary() {
    const summaryFiles = document.getElementById('summaryFiles');
    const summaryWords = document.getElementById('summaryWords');
    const summaryPairs = document.getElementById('summaryPairs');
    
    if (summaryFiles) {
        summaryFiles.textContent = selectedFiles.length;
    }
    
    if (summaryWords) {
        // Calculate approximate word count (placeholder calculation)
        const totalWords = selectedFiles.reduce((total, file) => {
            // Rough estimate: 250 words per KB for text files
            return total + Math.round((file.size / 1024) * 250);
        }, 0);
        summaryWords.textContent = totalWords;
    }
    
    if (summaryPairs) {
        // Calculate language pairs: number of selected languages
        summaryPairs.textContent = selectedLanguages.length;
    }
}

// Toast notifications
function setupToasts() {
    // Progress toast close button
    const progressClose = document.querySelector('#progressToast .toast-close');
    if (progressClose) {
        progressClose.addEventListener('click', hideProgressToast);
    }
    
    // Success toast close button
    const successClose = document.querySelector('#successToast .toast-close');
    if (successClose) {
        successClose.addEventListener('click', hideSuccessToast);
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
        // Initialize feather icons in the toast
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



// Download translated files
function downloadTranslatedFiles() {
    selectedFiles.forEach(file => {
        const content = 'This is a simulated translated document content.';
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const translatedName = file.name.replace(/\.[^/.]+$/, '') + '_translated' + 
                              file.name.match(/\.[^/.]+$/)[0];
        
        const a = document.createElement('a');
        a.href = url;
        a.download = translatedName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    hideSuccessToast();
}

// Reset application
function resetApplication() {
    selectedFiles = [];
    selectedLanguages = [
        { code: 'es-ES', text: 'Spanish (Spain) [esES]' },
        { code: 'fr-FR', text: 'French (France) [frFR]' }
    ];
    
    // Reset form state
    formState = {
        hasFiles: false,
        isTranslating: false,
        isCompleted: false
    };
    
    const { fileInput } = getElements();
    if (fileInput) fileInput.value = '';
    
    updateFileList();
    updateSelectedLanguages();
    updateFormState();
    
    hideProgressToast();
    hideSuccessToast();
}

// Setup toggle label clicks
function setupToggleLabels() {
    const toggleContainers = document.querySelectorAll('.toggle-container');
    
    toggleContainers.forEach(container => {
        const checkbox = container.querySelector('input[type="checkbox"]');
        const label = container.querySelector('.toggle-label');
        
        if (checkbox && label) {
            label.style.cursor = 'pointer';
            label.addEventListener('click', () => {
                if (!checkbox.disabled) {
                    checkbox.checked = !checkbox.checked;
                    // Trigger change event for any existing handlers
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        }
    });
    
    // Setup human toggle functionality to show/hide verify toggle and update buttons
    const humanToggle = document.getElementById('humanToggle');
    const verifyToggleContainer = document.getElementById('verifyToggleContainer');
    const advancedOptionsBtn = document.getElementById('advancedOptionsBtn');
    const translateBtnText = document.getElementById('translateBtnText');
    const translateBtn = document.getElementById('translateBtn');
    const formActions = document.querySelector('.form-actions');
    
    if (humanToggle && verifyToggleContainer) {
        humanToggle.addEventListener('change', () => {
            if (humanToggle.checked) {
                // Show verify toggle
                verifyToggleContainer.classList.remove('hidden');
                // Show Advanced Options button and update layout
                if (advancedOptionsBtn) {
                    advancedOptionsBtn.style.display = 'flex';
                }
                if (formActions) {
                    formActions.classList.add('show-advanced');
                }
                // Change translate button text and icon
                if (translateBtnText) {
                    translateBtnText.textContent = 'Review job details';
                }
                if (translateBtn) {
                    const icon = translateBtn.querySelector('i');
                    if (icon) {
                        icon.setAttribute('data-feather', 'arrow-right');
                        feather.replace();
                    }
                }
            } else {
                // Hide verify toggle
                verifyToggleContainer.classList.add('hidden');
                // Hide Advanced Options button and reset layout
                if (advancedOptionsBtn) {
                    advancedOptionsBtn.style.display = 'none';
                }
                if (formActions) {
                    formActions.classList.remove('show-advanced');
                }
                // Reset translate button text and icon
                if (translateBtnText) {
                    translateBtnText.textContent = 'Translate';
                }
                if (translateBtn) {
                    const icon = translateBtn.querySelector('i');
                    if (icon) {
                        icon.setAttribute('data-feather', 'fast-forward');
                        feather.replace();
                    }
                }
                // Reset verify toggle when hiding
                const verifyToggle = document.getElementById('verifyToggle');
                if (verifyToggle) {
                    verifyToggle.checked = false;
                }
            }
        });
    }
}

// Utility function: Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Advanced Options Sidebar functionality
function setupAdvancedOptions() {
    const advancedOptionsBtn = document.getElementById('advancedOptionsBtn');
    const advancedOptionsBtn2 = document.getElementById('advancedOptionsBtn2');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const advancedSidebar = document.getElementById('advancedSidebar');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const textareaInput = document.querySelector('.textarea-input');
    const textareaCount = document.querySelector('.textarea-count');
    
    // Function to show sidebar
    function showSidebar() {
        if (sidebarOverlay && advancedSidebar) {
            sidebarOverlay.classList.remove('hidden');
            advancedSidebar.classList.remove('hidden');
            // Force reflow before adding show class
            void advancedSidebar.offsetWidth;
            advancedSidebar.classList.add('show');
            // Replace feather icons in sidebar
            feather.replace();
        }
    }
    
    // Function to hide sidebar
    function hideSidebar() {
        if (sidebarOverlay && advancedSidebar) {
            advancedSidebar.classList.remove('show');
            setTimeout(() => {
                sidebarOverlay.classList.add('hidden');
                advancedSidebar.classList.add('hidden');
            }, 300);
        }
    }
    
    // Attach click handlers
    if (advancedOptionsBtn) {
        advancedOptionsBtn.addEventListener('click', showSidebar);
    }
    
    if (advancedOptionsBtn2) {
        advancedOptionsBtn2.addEventListener('click', showSidebar);
    }
    
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', hideSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', hideSidebar);
    }
    
    // Handle textarea character count
    if (textareaInput && textareaCount) {
        textareaInput.addEventListener('input', () => {
            const count = textareaInput.value.length;
            textareaCount.textContent = `${count}/200`;
        });
    }
    
    // Handle dropdown functionality
    const dropdowns = document.querySelectorAll('.field-dropdown');
    
    dropdowns.forEach(dropdown => {
        const dropdownInput = dropdown.querySelector('.dropdown-input');
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        const dropdownOptions = dropdown.querySelectorAll('.dropdown-option');
        
        // Toggle dropdown on click
        dropdownInput.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close other open dropdowns
            dropdowns.forEach(otherDropdown => {
                if (otherDropdown !== dropdown) {
                    otherDropdown.classList.remove('open');
                    const otherMenu = otherDropdown.querySelector('.dropdown-menu');
                    if (otherMenu) otherMenu.classList.add('hidden');
                }
            });
            
            // Toggle current dropdown
            dropdown.classList.toggle('open');
            if (dropdownMenu) {
                dropdownMenu.classList.toggle('hidden');
            }
        });
        
        // Handle option selection
        dropdownOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Update the selected value
                const value = option.textContent;
                dropdownInput.textContent = value;
                
                // Mark option as selected
                dropdownOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                // Close dropdown
                dropdown.classList.remove('open');
                dropdownMenu.classList.add('hidden');
            });
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.field-dropdown')) {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('open');
                const menu = dropdown.querySelector('.dropdown-menu');
                if (menu) menu.classList.add('hidden');
            });
        }
    });
}

// Initialize advanced options on load
document.addEventListener('DOMContentLoaded', () => {
    setupAdvancedOptions();
});