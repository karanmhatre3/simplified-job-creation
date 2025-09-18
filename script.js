// Initialize Lucide Icons
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initializeApp();
});

// Global variables
let selectedFiles = [];
let selectedLanguages = [
    { code: 'es-ES', text: 'Spanish (Spain) [esES]' },
    { code: 'fr-FR', text: 'French (France) [frFR]' }
];
let detectedLanguage = { code: 'en-GB', text: 'English (UK) [enUK]' };
let isLanguageAutoDetected = true;
let languageDetectionState = 'waiting'; // 'waiting', 'detecting', 'detected'
let pendingUploads = 0; // Track number of uploads in progress
let hasVideoFiles = false; // Track if video files are detected

// Form states
let formState = {
    hasFiles: false,
    isTranslating: false,
    isCompleted: false,
    hasLoadedJobDetailsOnce: false
};

// Initialize application
function initializeApp() {
    // Reset certified translation toggle to unchecked
    const humanToggle = document.getElementById('humanToggle');
    const verifyToggle = document.getElementById('verifyToggle');
    if (humanToggle) humanToggle.checked = false;
    if (verifyToggle) verifyToggle.checked = false;
    
    // Always show sticky buttons and hide main form actions for consistency
    const stickyButtons = document.getElementById('stickyButtons');
    const formActions = document.querySelector('.form-actions');
    const stickyAdvancedBtn = document.getElementById('stickyAdvancedBtn');
    if (stickyButtons) {
        stickyButtons.classList.remove('hidden');
    }
    if (formActions) {
        formActions.style.display = 'none';
    }
    // Hide Advanced options by default (only show when human cert is on)
    if (stickyAdvancedBtn) {
        stickyAdvancedBtn.style.display = 'none';
    }
    
    setupFileUpload();
    setupDetectedLanguageSelector();
    setupLanguageSelector();
    setupVideoDubbing();
    updateSelectedLanguages(); // Display default selected languages
    updateFormState(); // Set initial form state
    setupToasts();
    setupButtons();
    setupToggleLabels();
    setupSidebarHover();
    setupTextareaCharacterCount();
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
        languageSelectionCard: document.getElementById('languageSelectionCard'),
        detectedLanguageField: document.getElementById('detectedLanguageField'),
        detectedLanguageSelector: document.getElementById('detectedLanguageSelector'),
        detectedLanguageDropdown: document.getElementById('detectedLanguageDropdown'),
        detectedLanguageText: document.getElementById('detectedLanguageText'),
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
        languageSelectionCard,
        detectedLanguageField,
        detectedLanguageSelector,
        languageField, 
        toggleField, 
        languageSelector,
        humanToggle,
        translateBtn 
    } = getElements();
    
    const verifyToggle = document.getElementById('verifyToggle');
    
    // Update tab visibility and page title based on file upload status
    const tabBars = document.querySelectorAll('.tab-bar');
    const pageTitles = document.querySelectorAll('.page-title');
    
    tabBars.forEach(tabBar => {
        if (formState.hasFiles) {
            tabBar.classList.add('hidden');
        } else {
            tabBar.classList.remove('hidden');
        }
    });
    
    pageTitles.forEach(pageTitle => {
        if (formState.hasFiles) {
            pageTitle.classList.add('hidden');
        } else {
            pageTitle.classList.remove('hidden');
        }
    });
    
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
        languageSelectionCard?.classList.remove('disabled');
        detectedLanguageField?.classList.remove('disabled');
        detectedLanguageSelector?.classList.add('active');
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
        
        // Enable sticky translate button if languages are selected
        const stickyTranslateBtn = document.getElementById('stickyTranslateBtn');
        if (stickyTranslateBtn && selectedLanguages.length > 0) {
            stickyTranslateBtn.disabled = false;
            stickyTranslateBtn.classList.add('active');
        }
        
    } else {
        // Disable form fields
        languageSelectionCard?.classList.add('disabled');
        detectedLanguageField?.classList.add('disabled');
        detectedLanguageSelector?.classList.remove('active');
        languageField?.classList.add('disabled');
        toggleField?.classList.add('disabled');
        languageSelector?.classList.remove('active');
        if (humanToggle) humanToggle.disabled = true;
        if (verifyToggle) verifyToggle.disabled = true;
        
        if (translateBtn) {
            translateBtn.disabled = true;
            translateBtn.classList.remove('active');
        }
        
        // Disable sticky translate button
        const stickyTranslateBtn = document.getElementById('stickyTranslateBtn');
        if (stickyTranslateBtn) {
            stickyTranslateBtn.disabled = true;
            stickyTranslateBtn.classList.remove('active');
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
        setTimeout(() => lucide.createIcons(), 10);
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
                       'text/plain', 'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 
                       'video/x-flv', 'video/webm', 'video/x-matroska', 'video/3gpp', 'audio/wav', 'audio/wave'];
    
    const newFiles = [];
    for (let file of files) {
        if (validTypes.includes(file.type) || file.name.match(/\.(pdf|doc|docx|txt|xliff|tmx|sdlxliff|mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp|ogv|wav)$/i)) {
            newFiles.push(file);
        }
    }
    
    if (newFiles.length > 0) {
        // Add files to list immediately and update UI
        selectedFiles.push(...newFiles);
        formState.hasFiles = selectedFiles.length > 0;
        updateFileList();
        updateFormState();
        updateVideoDetection(); // Check for video files
        
        // Start upload simulation for each new file
        pendingUploads += newFiles.length; // Track pending uploads
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
                    <i data-lucide="x"></i>
                </button>
            </div>
        `;
        
        // Add progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'file-upload-progress-bar';
        progressBar.innerHTML = '<div class="file-upload-progress-fill" style="width: 0%"></div>';
        fileItem.appendChild(progressBar);
        
        lucide.createIcons();
        
        // Add cancel functionality
        const cancelBtn = fileItem.querySelector('.file-uploading-close');
        let cancelled = false;
        cancelBtn.addEventListener('click', () => {
            cancelled = true;
            pendingUploads--; // Decrement pending uploads when cancelled
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
                                    <i data-lucide="trash-2"></i>
                                </button>
                            `;
                        }
                        if (progressBar) {
                            progressBar.remove();
                        }
                        
                        lucide.createIcons();
                        
                        // Re-attach remove functionality
                        const newRemoveBtn = fileItem.querySelector('.file-item-remove');
                        if (newRemoveBtn) {
                            newRemoveBtn.addEventListener('click', () => removeFile(fileIndex));
                        }
                        
                        // Mark upload as complete and check if all uploads are done
                        pendingUploads--;
                        checkUploadCompletion();
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
            <i data-lucide="trash-2"></i>
        </button>
    `;
    
    // Add remove functionality
    const removeBtn = item.querySelector('.file-item-remove');
    removeBtn.addEventListener('click', () => removeFile(index));
    
    // Replace lucide icons
    setTimeout(() => lucide.createIcons(), 10);
    
    return item;
}

// Remove file from list
function removeFile(index) {
    selectedFiles.splice(index, 1);
    formState.hasFiles = selectedFiles.length > 0;
    updateFileList();
    updateFormState();
    
    // Reset language detection if no files remain
    if (selectedFiles.length === 0) {
        languageDetectionState = 'waiting';
        pendingUploads = 0; // Reset pending uploads counter
        hasVideoFiles = false; // Reset video detection
        updateDetectedLanguageDisplay();
        updateVideoDetection(); // Update video card visibility
    } else {
        updateVideoDetection(); // Check if videos still remain
    }
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

// Check if file is a video based on extension
function isVideoFile(filename) {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv', '.wav'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return videoExtensions.includes(extension);
}

// Update video detection state
function updateVideoDetection() {
    const previousHasVideo = hasVideoFiles;
    hasVideoFiles = selectedFiles.some(file => isVideoFile(file.name));
    
    // Show/hide video dubbing card
    const videoDubbingCard = document.getElementById('videoDubbingCard');
    if (videoDubbingCard) {
        if (hasVideoFiles) {
            videoDubbingCard.classList.remove('hidden');
        } else {
            videoDubbingCard.classList.add('hidden');
        }
    }
}

// Check if all uploads are complete and start language detection
function checkUploadCompletion() {
    if (pendingUploads === 0 && selectedFiles.length > 0 && languageDetectionState === 'waiting') {
        startLanguageDetection();
    }
}

// Start language detection process
function startLanguageDetection() {
    languageDetectionState = 'detecting';
    updateDetectedLanguageDisplay();
    
    // Simulate detection for 3 seconds
    setTimeout(() => {
        languageDetectionState = 'detected';
        isLanguageAutoDetected = true;
        updateDetectedLanguageDisplay();
    }, 3000);
}

// Update detected language display
function updateDetectedLanguageDisplay() {
    const detectedLanguageText = document.getElementById('detectedLanguageText');
    const autoDetectedChip = document.querySelector('.auto-detected-chip');
    const detectedLanguageSelector = document.getElementById('detectedLanguageSelector');
    
    if (!detectedLanguageText) return;
    
    switch (languageDetectionState) {
        case 'waiting':
            detectedLanguageText.textContent = 'Waiting for file upload to complete before detecting a language...';
            if (autoDetectedChip) autoDetectedChip.style.display = 'none';
            if (detectedLanguageSelector) detectedLanguageSelector.classList.remove('active');
            break;
        case 'detecting':
            detectedLanguageText.textContent = 'Detecting a language...';
            if (autoDetectedChip) autoDetectedChip.style.display = 'none';
            if (detectedLanguageSelector) detectedLanguageSelector.classList.remove('active');
            break;
        case 'detected':
            detectedLanguageText.textContent = detectedLanguage.text;
            if (autoDetectedChip) {
                autoDetectedChip.style.display = isLanguageAutoDetected ? 'block' : 'none';
            }
            // Re-enable dropdown functionality when detected
            break;
    }
}

// Detected Language Selector
function setupDetectedLanguageSelector() {
    const { detectedLanguageSelector, detectedLanguageDropdown, detectedLanguageText } = getElements();
    
    if (!detectedLanguageSelector || !detectedLanguageDropdown || !detectedLanguageText) return;
    
    // Initialize with default detected language
    updateDetectedLanguageDisplay();
    
    // Toggle dropdown
    detectedLanguageSelector.addEventListener('click', (e) => {
        // Only allow dropdown interaction when language is detected
        if (detectedLanguageSelector.classList.contains('active') && languageDetectionState === 'detected') {
            detectedLanguageDropdown.classList.toggle('hidden');
        }
    });
    
    // Language options
    const languageOptions = detectedLanguageDropdown.querySelectorAll('.language-option');
    languageOptions.forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.dataset.lang;
            const langText = option.textContent;
            
            // Check if user selected a different language than the original auto-detected one
            const originalAutoDetected = { code: 'en-GB', text: 'English (UK) [enUK]' };
            isLanguageAutoDetected = (lang === originalAutoDetected.code);
            
            detectedLanguage = { code: lang, text: langText };
            updateDetectedLanguageDisplay();
            
            detectedLanguageDropdown.classList.add('hidden');
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!detectedLanguageSelector.contains(e.target) && !detectedLanguageDropdown.contains(e.target)) {
            detectedLanguageDropdown.classList.add('hidden');
        }
    });
}

// Video Dubbing Setup
function setupVideoDubbing() {
    const dubbingToggle = document.getElementById('dubbingToggle');
    const voiceSelector = document.getElementById('voiceSelector');
    const voiceDropdown = document.getElementById('voiceDropdown');
    const voiceText = document.getElementById('voiceText');
    
    // Setup voice selector dropdown
    if (voiceSelector && voiceDropdown && voiceText) {
        // Toggle dropdown
        voiceSelector.addEventListener('click', (e) => {
            e.stopPropagation();
            voiceDropdown.classList.toggle('hidden');
        });
        
        // Voice options
        const voiceOptions = voiceDropdown.querySelectorAll('.voice-option');
        voiceOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const voiceValue = option.dataset.voice;
                const voiceLabel = option.textContent;
                
                voiceText.textContent = voiceLabel;
                voiceDropdown.classList.add('hidden');
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!voiceSelector.contains(e.target) && !voiceDropdown.contains(e.target)) {
                voiceDropdown.classList.add('hidden');
            }
        });
    }
    
    // Setup dubbing toggle functionality
    if (dubbingToggle) {
        dubbingToggle.addEventListener('change', (e) => {
            const voiceField = document.getElementById('voiceField');
            const voiceFieldSeparator = document.getElementById('voiceFieldSeparator');
            
            if (e.target.checked) {
                // Show voice selection field when toggle is on
                if (voiceField) voiceField.classList.remove('hidden');
                if (voiceFieldSeparator) voiceFieldSeparator.classList.remove('hidden');
            } else {
                // Hide voice selection field when toggle is off
                if (voiceField) voiceField.classList.add('hidden');
                if (voiceFieldSeparator) voiceFieldSeparator.classList.add('hidden');
            }
        });
    }
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
                    <i data-lucide="x" class="remove-chip" data-index="${index}"></i>
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
            
            // Replace lucide icons
            setTimeout(() => lucide.createIcons(), 10);
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
                <i data-lucide="upload"></i>
                Upload files
            </button>
        </div>
    `;
    
    // Re-initialize lucide icons
    lucide.createIcons();
    
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
    
    // Sticky buttons - mirror main button functionality
    const stickyTranslateBtn = document.getElementById('stickyTranslateBtn');
    const stickyAdvancedBtn = document.getElementById('stickyAdvancedBtn');
    
    if (stickyTranslateBtn) {
        stickyTranslateBtn.addEventListener('click', () => {
            if (selectedLanguages.length > 0 && selectedFiles.length > 0) {
                startTranslation();
            }
        });
    }
    
    // Step 2: Review Quotation buttons
    const reviewQuotationBtn = document.getElementById('reviewQuotationBtn');
    const stickyReviewQuotationBtn = document.getElementById('stickyReviewQuotationBtn');
    
    if (reviewQuotationBtn) {
        reviewQuotationBtn.addEventListener('click', () => {
            console.log('Review quotation button clicked');
            const isValid = validateJobDetailsForm();
            console.log('Form validation result:', isValid);
            if (isValid) {
                console.log('Calling showQuotationReview()');
                showQuotationReview();
            } else {
                console.log('Form validation failed - not proceeding');
            }
        });
    }
    
    if (stickyReviewQuotationBtn) {
        stickyReviewQuotationBtn.addEventListener('click', () => {
            if (validateJobDetailsForm()) {
                showQuotationReview();
            }
        });
    }
    
    // Step 2: Submit translation buttons (old step 2, now deprecated)
    const submitTranslationBtn = document.getElementById('submitTranslationBtn');
    const stickySubmitTranslationBtn = document.getElementById('stickySubmitTranslationBtn');
    
    if (submitTranslationBtn) {
        submitTranslationBtn.addEventListener('click', () => {
            if (validateJobDetailsForm()) {
                showQuotationReview();
            }
        });
    }
    
    if (stickySubmitTranslationBtn) {
        stickySubmitTranslationBtn.addEventListener('click', () => {
            if (validateJobDetailsForm()) {
                showQuotationReview();
            }
        });
    }
    
    // Step 3: Final Submit translation buttons (only sticky version)
    const stickyFinalSubmitTranslationBtn = document.getElementById('stickyFinalSubmitTranslationBtn');
    
    if (stickyFinalSubmitTranslationBtn) {
        stickyFinalSubmitTranslationBtn.addEventListener('click', () => {
            showConfirmationScreen();
        });
    }
    
    if (stickyAdvancedBtn) {
        stickyAdvancedBtn.addEventListener('click', () => {
            // Use the proper showSidebar function
            const advancedSidebar = document.getElementById('advancedSidebar');
            const sidebarOverlay = document.getElementById('sidebarOverlay');
            
            if (sidebarOverlay && advancedSidebar) {
                sidebarOverlay.classList.remove('hidden');
                advancedSidebar.classList.remove('hidden');
                // Force reflow before adding show class
                void advancedSidebar.offsetWidth;
                advancedSidebar.classList.add('show');
                // Replace lucide icons in sidebar
                lucide.createIcons();
            }
        });
    }
    
    // Tab switching functionality
    setupTabSwitching();
    
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
    
    // Setup stepper tab interactions
    setupStepperTabs();
    
    // Setup department dropdowns
    setupDepartmentDropdowns();
    
    // Setup form validation
    setupFormValidation();
    
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
    // Check if we're already in review mode
    const mainView = document.getElementById('mainView');
    if (mainView && mainView.classList.contains('review-mode')) {
        // Submit translation from review mode
        showConfirmationScreen();
        return;
    }
    
    // Check if human-certified translation is selected
    const humanToggle = document.getElementById('humanToggle');
    
    if (humanToggle && humanToggle.checked) {
        // Enter review mode - scroll to job details and change opacity
        enterReviewMode();
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

// Enter review mode - scroll to job details and change opacity
function enterReviewMode() {
    const mainView = document.getElementById('mainView');
    const jobDetailsSection = document.getElementById('jobDetailsSection');
    
    if (mainView && jobDetailsSection) {
        // Add review mode class to main view
        mainView.classList.add('review-mode');
        
        // Add review step class for step 2 positioning
        mainView.classList.add('review-step');
        
        // Make job details interactive and full opacity
        jobDetailsSection.classList.add('review-active');
        
        // Enable form fields in job details
        const billingInput = document.getElementById('billingCodeMain');
        const instructionsTextarea = document.getElementById('linguistInstructionsMain');
        const departmentSelect = document.getElementById('departmentSelectMain');
        const dueDateSelect = document.getElementById('dueDateSelectMain');
        
        if (billingInput) billingInput.disabled = false;
        if (instructionsTextarea) instructionsTextarea.disabled = false;
        
        // Make dropdowns clickable (add click handlers if needed)
        if (departmentSelect) {
            departmentSelect.style.cursor = 'pointer';
        }
        if (dueDateSelect) {
            dueDateSelect.style.cursor = 'pointer';
        }
        
        // Animate page scroll to show job details
        setTimeout(() => {
            animateToJobDetails();
        }, 100);
        
        // Show skeleton loader and hide actual summary
        showSkeletonLoader();
        
        // Update summary values after 5 seconds (or immediately if already loaded once)
        const delay = formState.hasLoadedJobDetailsOnce ? 0 : 5000;
        setTimeout(() => {
            hideSkeletonLoader();
            updateJobSummaryMain();
        }, delay);
        
        // Update stepper to step 2
        updateStepperStep(2);
        
        // Show quotation review section with 30% opacity (preview mode)
        const quotationReviewSection = document.getElementById('quotationReviewSection');
        if (quotationReviewSection) {
            quotationReviewSection.classList.remove('hidden');
            quotationReviewSection.classList.add('preview-mode');
            quotationReviewSection.classList.remove('active-mode');
        }
        
        // Validate form to enable buttons
        validateJobDetailsForm();
        
        // Re-initialize lucide icons
        lucide.createIcons();
    }
}

// Show quotation review (Step 3)
function showQuotationReview() {
    const quotationReviewSection = document.getElementById('quotationReviewSection');
    
    if (quotationReviewSection) {
        // Make quotation section active (full opacity)
        quotationReviewSection.classList.remove('preview-mode');
        quotationReviewSection.classList.add('active-mode');
        
        // Update stepper to step 3
        updateStepperStep(3);
        
        // Enable the final submit button (sticky version only)
        const stickyFinalSubmitBtn = document.getElementById('stickyFinalSubmitTranslationBtn');
        
        if (stickyFinalSubmitBtn) {
            stickyFinalSubmitBtn.disabled = false;
            stickyFinalSubmitBtn.classList.add('active');
        }
        
        // Update job summary values
        updateJobSummaryMain();
        
        // Re-initialize lucide icons
        lucide.createIcons();
        
        // Animate to center the quotation section (similar to animateToJobDetails)
        setTimeout(() => {
            animateToQuotation();
        }, 100);
    }
}

// Return from quotation review (Step 3) to job details (Step 2)
function returnToJobDetails() {
    const jobDetailsSection = document.getElementById('jobDetailsSection');
    const quotationReviewSection = document.getElementById('quotationReviewSection');
    
    if (jobDetailsSection) {
        // Set quotation back to preview mode (30% opacity)
        if (quotationReviewSection) {
            quotationReviewSection.classList.remove('active-mode');
            quotationReviewSection.classList.add('preview-mode');
        }
        
        // Update stepper back to step 2
        updateStepperStep(2);
        
        // Scroll back to the job details section
        jobDetailsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

// Exit review mode - return to normal form view
function exitReviewMode() {
    const mainView = document.getElementById('mainView');
    const jobDetailsSection = document.getElementById('jobDetailsSection');
    const quotationReviewSection = document.getElementById('quotationReviewSection');
    
    if (mainView && jobDetailsSection) {
        // Remove review mode classes
        mainView.classList.remove('review-mode');
        mainView.classList.remove('review-step');
        jobDetailsSection.classList.remove('review-active');
        
        // Hide quotation review section when exiting review mode
        if (quotationReviewSection) {
            quotationReviewSection.classList.add('hidden');
        }
        
        // Disable form fields again
        const billingInput = document.getElementById('billingCodeMain');
        const instructionsTextarea = document.getElementById('linguistInstructionsMain');
        if (billingInput) billingInput.disabled = true;
        if (instructionsTextarea) instructionsTextarea.disabled = true;
        
        // Hide skeleton loader and show summary
        hideSkeletonLoader();
        
        // Update stepper back to step 1
        updateStepperStep(1);
        
        // Reset button text
        const translateBtnText = document.getElementById('translateBtnText');
        const stickyTranslateBtnText = document.getElementById('stickyTranslateBtnText');
        if (translateBtnText) {
            translateBtnText.textContent = 'Review job details';
        }
        if (stickyTranslateBtnText) {
            stickyTranslateBtnText.textContent = 'Review job details';
        }
        
        // Scroll back to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        // Re-initialize lucide icons for new screen
        lucide.createIcons();
    }
}

// Show main view (hide job details)
function showMainView() {
    const mainView = document.getElementById('mainView');
    const jobDetailsView = document.getElementById('jobDetailsView');
    const confirmationView = document.getElementById('confirmationView');
    
    if (mainView && jobDetailsView && confirmationView) {
        jobDetailsView.classList.add('hidden');
        confirmationView.classList.add('hidden');
        mainView.classList.remove('hidden');
    }
}

// Show confirmation screen
function showConfirmationScreen() {
    const mainView = document.getElementById('mainView');
    const jobDetailsView = document.getElementById('jobDetailsView');
    const confirmationView = document.getElementById('confirmationView');
    const stickyButtons = document.getElementById('stickyButtons');
    const progressStepper = document.getElementById('progressStepper');
    
    if (mainView && jobDetailsView && confirmationView) {
        mainView.classList.add('hidden');
        jobDetailsView.classList.add('hidden');
        confirmationView.classList.remove('hidden');
        
        // Hide sticky buttons on confirmation screen
        if (stickyButtons) {
            stickyButtons.classList.add('hidden');
        }
        
        // Hide progress stepper on confirmation screen
        if (progressStepper) {
            progressStepper.classList.add('hidden');
        }
        
        // Initialize lucide icons in the new view
        lucide.createIcons();
        
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

// Setup stepper tab interactions
function setupStepperTabs() {
    const stepperTab1 = document.getElementById('stepperTab1');
    const stepperTab2 = document.getElementById('stepperTab2');
    
    if (stepperTab1) {
        stepperTab1.addEventListener('click', () => {
            goToStep(1);
        });
    }
    
    if (stepperTab2) {
        stepperTab2.addEventListener('click', () => {
            goToStep(2);
        });
    }
    
    const stepperTab3 = document.getElementById('stepperTab3');
    if (stepperTab3) {
        stepperTab3.addEventListener('click', () => {
            goToStep(3);
        });
    }
}

// Navigate to specific step
function goToStep(step) {
    const mainView = document.getElementById('mainView');
    const jobDetailsSection = document.getElementById('jobDetailsSection');
    
    if (!mainView || !jobDetailsSection) return;
    
    if (step === 1) {
        // Step 1: Original positioning (-30% for with-job-details)
        mainView.classList.remove('review-mode');
        mainView.classList.remove('review-step');
        jobDetailsSection.classList.remove('review-active');
        
        // Hide skeleton loader and show summary
        hideSkeletonLoader();
        
        // Animate back to center position
        animateBackToCenter();
        
        // Update button text back to "Review job details"
        const translateBtnText = document.getElementById('translateBtnText');
        const stickyTranslateBtnText = document.getElementById('stickyTranslateBtnText');
        if (translateBtnText) {
            translateBtnText.textContent = 'Review job details';
        }
        if (stickyTranslateBtnText) {
            stickyTranslateBtnText.textContent = 'Review job details';
        }
        
        // Disable job details form fields
        const billingInput = document.getElementById('billingCodeMain');
        const instructionsTextarea = document.getElementById('linguistInstructionsMain');
        if (billingInput) billingInput.disabled = true;
        if (instructionsTextarea) instructionsTextarea.disabled = true;
        
    } else if (step === 2) {
        // Step 2: Center billing code (review mode positioning -80%)
        mainView.classList.add('review-mode');
        mainView.classList.add('review-step');
        jobDetailsSection.classList.add('review-active');
        
        // Enable job details form fields
        const billingInput = document.getElementById('billingCodeMain');
        const instructionsTextarea = document.getElementById('linguistInstructionsMain');
        if (billingInput) billingInput.disabled = false;
        if (instructionsTextarea) instructionsTextarea.disabled = false;
        
        // Show skeleton loader and hide actual summary
        showSkeletonLoader();
        
        // Animate to job details section
        setTimeout(() => {
            animateToJobDetails();
        }, 100);
        
        // Update summary values after 5 seconds (or immediately if already loaded once)
        const delay = formState.hasLoadedJobDetailsOnce ? 0 : 5000;
        setTimeout(() => {
            hideSkeletonLoader();
            updateJobSummaryMain();
        }, delay);
        
        // Update button text for review mode
        const translateBtnText = document.getElementById('translateBtnText');
        const stickyTranslateBtnText = document.getElementById('stickyTranslateBtnText');
        if (translateBtnText) {
            translateBtnText.textContent = 'Submit for Translation';
        }
        if (stickyTranslateBtnText) {
            stickyTranslateBtnText.textContent = 'Submit for Translation';
        }
        
    } else if (step === 3) {
        // Step 3: Navigate to quotation review section
        const quotationReviewSection = document.getElementById('quotationReviewSection');
        
        if (quotationReviewSection) {
            // Make sure we're in review mode first
            mainView.classList.add('review-mode');
            mainView.classList.add('review-step');
            jobDetailsSection.classList.add('review-active');
            
            // Show quotation section and make it active
            quotationReviewSection.classList.remove('hidden');
            quotationReviewSection.classList.remove('preview-mode');
            quotationReviewSection.classList.add('active-mode');
            
            // Enable the final submit button (sticky version only)
            const stickyFinalSubmitBtn = document.getElementById('stickyFinalSubmitTranslationBtn');
            
            if (stickyFinalSubmitBtn) {
                stickyFinalSubmitBtn.disabled = false;
                stickyFinalSubmitBtn.classList.add('active');
            }
            
            // Animate to quotation position
            setTimeout(() => {
                animateToQuotation();
            }, 100);
            
            // Update job summary values
            updateJobSummaryMain();
        }
    }
    
    // Update stepper visual state
    updateStepperStep(step);
}

// Show skeleton loader in summary section (only on first load)
function showSkeletonLoader() {
    // Only show skeleton if this is the first time loading job details
    if (formState.hasLoadedJobDetailsOnce) {
        return;
    }
    
    const skeletonLoader = document.getElementById('jobSummarySkeleton');
    const summaryCard = document.getElementById('jobSummaryCard');
    
    if (skeletonLoader && summaryCard) {
        skeletonLoader.classList.remove('hidden');
        summaryCard.classList.add('hidden');
    }
}

// Hide skeleton loader and show actual summary
function hideSkeletonLoader() {
    const skeletonLoader = document.getElementById('jobSummarySkeleton');
    const summaryCard = document.getElementById('jobSummaryCard');
    
    if (skeletonLoader && summaryCard) {
        skeletonLoader.classList.add('hidden');
        summaryCard.classList.remove('hidden');
        
        // Mark that job details have been loaded once
        formState.hasLoadedJobDetailsOnce = true;
    }
}

// Show/hide appropriate buttons based on step
function updateButtonsForStep(step) {
    const translateBtn = document.getElementById('translateBtn');
    const submitTranslationBtn = document.getElementById('submitTranslationBtn');
    const reviewQuotationBtn = document.getElementById('reviewQuotationBtn');
    const stickyTranslateBtn = document.getElementById('stickyTranslateBtn');
    const stickySubmitTranslationBtn = document.getElementById('stickySubmitTranslationBtn');
    const stickyReviewQuotationBtn = document.getElementById('stickyReviewQuotationBtn');
    const stickyFinalSubmitTranslationBtn = document.getElementById('stickyFinalSubmitTranslationBtn');
    
    if (step === 1) {
        // Step 1: Show translate/review buttons
        if (translateBtn) translateBtn.classList.remove('hidden');
        if (submitTranslationBtn) submitTranslationBtn.classList.add('hidden');
        if (reviewQuotationBtn) reviewQuotationBtn.classList.add('hidden');
        if (stickyTranslateBtn) stickyTranslateBtn.classList.remove('hidden');
        if (stickySubmitTranslationBtn) stickySubmitTranslationBtn.classList.add('hidden');
        if (stickyReviewQuotationBtn) stickyReviewQuotationBtn.classList.add('hidden');
        if (stickyFinalSubmitTranslationBtn) stickyFinalSubmitTranslationBtn.classList.add('hidden');
    } else if (step === 2) {
        // Step 2: Show review quotation buttons
        if (translateBtn) translateBtn.classList.add('hidden');
        if (submitTranslationBtn) submitTranslationBtn.classList.add('hidden');
        if (reviewQuotationBtn) reviewQuotationBtn.classList.remove('hidden');
        if (stickyTranslateBtn) stickyTranslateBtn.classList.add('hidden');
        if (stickySubmitTranslationBtn) stickySubmitTranslationBtn.classList.add('hidden');
        if (stickyReviewQuotationBtn) stickyReviewQuotationBtn.classList.remove('hidden');
        if (stickyFinalSubmitTranslationBtn) stickyFinalSubmitTranslationBtn.classList.add('hidden');
    } else if (step === 3) {
        // Step 3: Show final submit buttons (sticky only)
        if (translateBtn) translateBtn.classList.add('hidden');
        if (submitTranslationBtn) submitTranslationBtn.classList.add('hidden');
        if (reviewQuotationBtn) reviewQuotationBtn.classList.add('hidden');
        if (stickyTranslateBtn) stickyTranslateBtn.classList.add('hidden');
        if (stickySubmitTranslationBtn) stickySubmitTranslationBtn.classList.add('hidden');
        if (stickyReviewQuotationBtn) stickyReviewQuotationBtn.classList.add('hidden');
        if (stickyFinalSubmitTranslationBtn) stickyFinalSubmitTranslationBtn.classList.remove('hidden');
    }
}

// Animate content wrapper transform to show job details
function animateToJobDetails() {
    const contentWrapper = document.querySelector('.content-wrapper');
    
    if (!contentWrapper) return;
    
    // Start transform: translate(-50%, -30%) - center position
    // End transform: translate(-50%, -60%) - review step position (less aggressive)
    const startY = -30;
    const endY = -60;
    const duration = 600; // 600ms duration
    let startTime = null;
    
    function ease(t) {
        // Ease-in-out cubic function for smooth animation
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
    
    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        
        const easedProgress = ease(progress);
        const currentY = startY + (endY - startY) * easedProgress;
        
        contentWrapper.style.transform = `translate(-50%, ${currentY}%)`;
        
        if (progress < 1) {
            requestAnimationFrame(animation);
        }
    }
    
    requestAnimationFrame(animation);
}

// Animate content wrapper back to center position
function animateBackToCenter() {
    const contentWrapper = document.querySelector('.content-wrapper');
    
    if (!contentWrapper) return;
    
    // Start transform: translate(-50%, -60%) - review step position  
    // End transform: translate(-50%, -30%) - center position
    const startY = -60;
    const endY = -30;
    const duration = 600; // 600ms duration
    let startTime = null;
    
    function ease(t) {
        // Ease-in-out cubic function for smooth animation
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
    
    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        
        const easedProgress = ease(progress);
        const currentY = startY + (endY - startY) * easedProgress;
        
        contentWrapper.style.transform = `translate(-50%, ${currentY}%)`;
        
        if (progress < 1) {
            requestAnimationFrame(animation);
        }
    }
    
    requestAnimationFrame(animation);
}

// Animate content wrapper to show quotation section (Step 3)
function animateToQuotation() {
    const contentWrapper = document.querySelector('.content-wrapper');
    
    if (!contentWrapper) return;
    
    // Start transform: translate(-50%, -60%) - step 2 position
    // End transform: translate(-50%, -90%) - step 3 position to center quotation
    const startY = -60;
    const endY = -90;
    const duration = 600; // 600ms duration
    let startTime = null;
    
    function ease(t) {
        // Ease-in-out cubic function for smooth animation
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
    
    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        
        const easedProgress = ease(progress);
        const currentY = startY + (endY - startY) * easedProgress;
        
        contentWrapper.style.transform = `translate(-50%, ${currentY}%)`;
        
        if (progress < 1) {
            requestAnimationFrame(animation);
        }
    }
    
    requestAnimationFrame(animation);
}

// Update stepper step state
function updateStepperStep(step) {
    const stepperTab1 = document.getElementById('stepperTab1');
    const stepperTab2 = document.getElementById('stepperTab2');
    const stepperTab3 = document.getElementById('stepperTab3');
    
    if (stepperTab1 && stepperTab2 && stepperTab3) {
        const circle1 = stepperTab1.querySelector('.stepper-circle');
        const circle2 = stepperTab2.querySelector('.stepper-circle');
        const circle3 = stepperTab3.querySelector('.stepper-circle');
        const number1 = stepperTab1.querySelector('.step-number');
        const check1 = stepperTab1.querySelector('.step-check');
        const number2 = stepperTab2.querySelector('.step-number');
        const check2 = stepperTab2.querySelector('.step-check');
        const number3 = stepperTab3.querySelector('.step-number');
        const check3 = stepperTab3.querySelector('.step-check');
        
        if (step === 1) {
            // Step 1 is active
            stepperTab1.classList.add('active');
            stepperTab2.classList.remove('active');
            stepperTab3.classList.remove('active');
            
            // Circle 1: active state
            circle1.classList.add('active');
            circle1.classList.remove('completed');
            number1.classList.remove('hidden');
            check1.classList.add('hidden');
            
            // Circle 2: inactive state
            circle2.classList.remove('active', 'completed');
            number2.classList.remove('hidden');
            check2.classList.add('hidden');
            
            // Circle 3: inactive state
            circle3.classList.remove('active', 'completed');
            number3.classList.remove('hidden');
            check3.classList.add('hidden');
            
        } else if (step === 2) {
            // Step 2 is active
            stepperTab1.classList.remove('active');
            stepperTab2.classList.add('active');
            stepperTab3.classList.remove('active');
            
            // Circle 1: completed state (show check)
            circle1.classList.remove('active');
            circle1.classList.add('completed');
            number1.classList.add('hidden');
            check1.classList.remove('hidden');
            
            // Circle 2: active state
            circle2.classList.add('active');
            circle2.classList.remove('completed');
            number2.classList.remove('hidden');
            check2.classList.add('hidden');
            
            // Circle 3: inactive state
            circle3.classList.remove('active', 'completed');
            number3.classList.remove('hidden');
            check3.classList.add('hidden');
            
        } else if (step === 3) {
            // Step 3 is active
            stepperTab1.classList.remove('active');
            stepperTab2.classList.remove('active');
            stepperTab3.classList.add('active');
            
            // Circle 1: completed state (show check)
            circle1.classList.remove('active');
            circle1.classList.add('completed');
            number1.classList.add('hidden');
            check1.classList.remove('hidden');
            
            // Circle 2: completed state (show check)
            circle2.classList.remove('active');
            circle2.classList.add('completed');
            number2.classList.add('hidden');
            check2.classList.remove('hidden');
            
            // Circle 3: active state
            circle3.classList.add('active');
            circle3.classList.remove('completed');
            number3.classList.remove('hidden');
            check3.classList.add('hidden');
        }
        
        // Re-initialize lucide icons for the check icons
        lucide.createIcons();
        
        // Update buttons for current step
        updateButtonsForStep(step);
    }
}

// Update job summary values for main screen
function updateJobSummaryMain() {
    const summaryFilesMain = document.getElementById('summaryFilesMain');
    const summaryWordsMain = document.getElementById('summaryWordsMain');
    const summaryPairsMain = document.getElementById('summaryPairsMain');
    const summaryDeliveryMain = document.getElementById('summaryDeliveryMain');
    
    if (summaryFilesMain) {
        summaryFilesMain.textContent = selectedFiles.length || 2;
    }
    
    if (summaryWordsMain) {
        // Calculate approximate word count (placeholder calculation)
        if (selectedFiles.length > 0) {
            const totalWords = selectedFiles.reduce((total, file) => {
                // Rough estimate: 250 words per KB for text files
                return total + Math.round((file.size / 1024) * 250);
            }, 0);
            summaryWordsMain.textContent = totalWords;
        } else {
            summaryWordsMain.textContent = '1203'; // Default placeholder
        }
    }
    
    if (summaryPairsMain) {
        // Calculate language pairs: number of selected languages
        summaryPairsMain.textContent = selectedLanguages.length || 2;
    }
    
    if (summaryDeliveryMain) {
        // Calculate delivery date (3 business days from now)
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 3);
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        const formattedDate = deliveryDate.toLocaleDateString('en-GB', options);
        summaryDeliveryMain.textContent = `${formattedDate} (3 days)`;
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
        // Initialize lucide icons in the toast
        setTimeout(() => lucide.createIcons(), 10);
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
    window.location.reload();
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
    const progressStepper = document.getElementById('progressStepper');
    const stickyButtons = document.getElementById('stickyButtons');
    const stickyTranslateBtnText = document.getElementById('stickyTranslateBtnText');
    const stickyTranslateBtn = document.getElementById('stickyTranslateBtn');
    const stickyAdvancedBtn = document.getElementById('stickyAdvancedBtn');
    const jobDetailsSection = document.getElementById('jobDetailsSection');
    
    if (humanToggle && verifyToggleContainer) {
        humanToggle.addEventListener('change', () => {
            if (humanToggle.checked) {
                // Add class to reposition content wrapper for job details
                const mainView = document.getElementById('mainView');
                if (mainView) {
                    mainView.classList.add('with-job-details');
                }
                
                // Show job name header
                const jobNameHeader = document.getElementById('jobNameHeader');
                if (jobNameHeader) {
                    jobNameHeader.classList.remove('hidden');
                }
                
                // Show verify toggle
                verifyToggleContainer.classList.remove('hidden');
                // Show Advanced Options button and update layout
                if (advancedOptionsBtn) {
                    advancedOptionsBtn.style.display = 'flex';
                }
                if (stickyAdvancedBtn) {
                    stickyAdvancedBtn.style.display = 'flex';
                }
                if (formActions) {
                    formActions.classList.add('show-advanced');
                }
                // Show progress stepper with animation
                if (progressStepper) {
                    progressStepper.classList.remove('hidden');
                    // Add show class after a small delay to trigger animation
                    setTimeout(() => {
                        progressStepper.classList.add('show');
                    }, 50);
                }
                if (stickyButtons) {
                    stickyButtons.classList.remove('hidden');
                }
                // Show job details section with 30% opacity
                if (jobDetailsSection) {
                    jobDetailsSection.classList.remove('hidden');
                }
                // Hide main form action buttons - always use sticky buttons
                if (formActions) {
                    formActions.style.display = 'none';
                }
                // Change translate button text and icon
                if (translateBtnText) {
                    translateBtnText.textContent = 'Review job details';
                }
                if (stickyTranslateBtnText) {
                    stickyTranslateBtnText.textContent = 'Review job details';
                }
                if (translateBtn) {
                    const icon = translateBtn.querySelector('i');
                    if (icon) {
                        icon.setAttribute('data-lucide', 'arrow-right');
                        lucide.createIcons();
                    }
                }
                if (stickyTranslateBtn) {
                    const icon = stickyTranslateBtn.querySelector('i');
                    if (icon) {
                        icon.setAttribute('data-lucide', 'arrow-right');
                        lucide.createIcons();
                    }
                }
            } else {
                // Remove class to restore content wrapper position
                const mainView = document.getElementById('mainView');
                if (mainView) {
                    mainView.classList.remove('with-job-details');
                }
                
                // Hide job name header
                const jobNameHeader = document.getElementById('jobNameHeader');
                if (jobNameHeader) {
                    jobNameHeader.classList.add('hidden');
                }
                
                // Hide verify toggle
                verifyToggleContainer.classList.add('hidden');
                // Hide Advanced Options button and reset layout
                if (advancedOptionsBtn) {
                    advancedOptionsBtn.style.display = 'none';
                }
                if (stickyAdvancedBtn) {
                    stickyAdvancedBtn.style.display = 'none';
                }
                if (formActions) {
                    formActions.classList.remove('show-advanced');
                }
                // Hide progress stepper with animation
                if (progressStepper) {
                    progressStepper.classList.remove('show');
                    // Hide after animation completes
                    setTimeout(() => {
                        progressStepper.classList.add('hidden');
                    }, 400);
                }
                // Keep sticky buttons visible - don't hide them
                // Note: Sticky buttons should always remain visible for consistency
                
                // Hide job details section
                if (jobDetailsSection) {
                    jobDetailsSection.classList.add('hidden');
                }
                // Keep main form action buttons hidden - always use sticky buttons
                if (formActions) {
                    formActions.style.display = 'none';
                }
                // Reset translate button text and icon
                if (translateBtnText) {
                    translateBtnText.textContent = 'Translate';
                }
                if (stickyTranslateBtnText) {
                    stickyTranslateBtnText.textContent = 'Translate';
                }
                if (translateBtn) {
                    const icon = translateBtn.querySelector('i');
                    if (icon) {
                        icon.setAttribute('data-lucide', 'languages');
                        lucide.createIcons();
                    }
                }
                if (stickyTranslateBtn) {
                    const icon = stickyTranslateBtn.querySelector('i');
                    if (icon) {
                        icon.setAttribute('data-lucide', 'languages');
                        lucide.createIcons();
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
            // Replace lucide icons in sidebar
            lucide.createIcons();
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

// Setup tab switching functionality
function setupTabSwitching() {
    const mainView = document.getElementById('mainView');
    const typeTranslateView = document.getElementById('typeTranslateView');
    
    // Function to switch views and update all tabs
    function switchToView(viewName) {
        console.log('Switching to:', viewName);

        const stickyButtons = document.getElementById('stickyButtons');

        // Get all tabs from both views
        const allTabs = document.querySelectorAll('.tab');

        // Remove active class from all tabs
        allTabs.forEach(tab => tab.classList.remove('active'));

        // Add active class to the correct tab in both views
        allTabs.forEach(tab => {
            if (viewName === 'translate-files' && tab.textContent.includes('Translate files')) {
                tab.classList.add('active');
            } else if (viewName === 'type-translate' && tab.textContent.includes('Type and translate')) {
                tab.classList.add('active');
            }
        });

        // Switch views and manage sticky buttons
        if (viewName === 'type-translate') {
            if (mainView && typeTranslateView) {
                mainView.classList.add('hidden');
                typeTranslateView.classList.remove('hidden');
            }
            // Hide sticky buttons in Type and translate view
            if (stickyButtons) {
                stickyButtons.classList.add('hidden');
            }
        } else {
            if (mainView && typeTranslateView) {
                typeTranslateView.classList.add('hidden');
                mainView.classList.remove('hidden');
            }
            // Show sticky buttons when returning to Translate files view
            // (following the app's pattern of always showing sticky buttons)
            if (stickyButtons) {
                stickyButtons.classList.remove('hidden');
            }
        }

        // Re-initialize lucide icons for the new view
        lucide.createIcons();
    }
    
    // Add click handlers to all tabs
    const allTabs = document.querySelectorAll('.tab');
    
    allTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Don't switch if already active
            if (tab.classList.contains('active')) return;
            
            // Determine which view to switch to
            if (tab.textContent.includes('Type and translate')) {
                switchToView('type-translate');
            } else if (tab.textContent.includes('Translate files')) {
                switchToView('translate-files');
            }
        });
    });
}

// Setup sidebar hover interactions
function setupSidebarHover() {
    const sidebar = document.querySelector('.sidebar');
    const navItems = document.querySelectorAll('.nav-item, .sidebar-action, .user-avatar');
    
    if (!sidebar) return;
    
    // Add hover event listeners to sidebar
    sidebar.addEventListener('mouseenter', () => {
        sidebar.classList.add('hovered');
    });
    
    sidebar.addEventListener('mouseleave', () => {
        sidebar.classList.remove('hovered');
    });
    
    // Add individual item hover effects
    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.classList.add('hovered');
        });
        
        item.addEventListener('mouseleave', () => {
            item.classList.remove('hovered');
        });
    });
}

// Setup character count for instructions textarea
function setupTextareaCharacterCount() {
    const textarea = document.getElementById('linguistInstructionsMain');
    const counter = document.getElementById('instructionsCount');
    
    if (textarea && counter) {
        // Update character count on input
        textarea.addEventListener('input', function() {
            const currentLength = this.value.length;
            counter.textContent = currentLength;
            
            // Optional: Add visual feedback when approaching limit
            if (currentLength >= 180) {
                counter.style.color = '#9a2323'; // Red color for warning
            } else {
                counter.style.color = '#6e747e'; // Default gray color
            }
        });
    }
}

// Setup department dropdowns
function setupDepartmentDropdowns() {
    const departments = [
        'Marketing',
        'Sales',
        'Human Resources',
        'Engineering',
        'Product',
        'Customer Support',
        'Finance',
        'Legal',
        'Operations'
    ];
    
    const departmentSelectors = [
        document.getElementById('departmentSelectMain'),
        document.getElementById('departmentSelect')
    ];
    
    departmentSelectors.forEach(selector => {
        if (selector) {
            // Add click handler to show/hide options
            selector.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Remove existing dropdown if present
                const existingDropdown = selector.querySelector('.department-dropdown');
                if (existingDropdown) {
                    existingDropdown.remove();
                    return;
                }
                
                // Create dropdown
                const dropdown = document.createElement('div');
                dropdown.className = 'department-dropdown';
                dropdown.style.cssText = `
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid var(--color-gray-200);
                    border-radius: var(--radius-m);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    max-height: 200px;
                    overflow-y: auto;
                `;
                
                departments.forEach(dept => {
                    const option = document.createElement('div');
                    option.className = 'department-option';
                    option.textContent = dept;
                    option.style.cssText = `
                        padding: 12px 16px;
                        cursor: pointer;
                        border-bottom: 1px solid var(--color-gray-100);
                        font-size: 14px;
                        color: var(--color-gray-900);
                    `;
                    
                    option.addEventListener('mouseover', () => {
                        option.style.backgroundColor = 'var(--color-gray-100)';
                    });
                    
                    option.addEventListener('mouseout', () => {
                        option.style.backgroundColor = 'transparent';
                    });
                    
                    option.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const placeholder = selector.querySelector('.select-placeholder');
                        if (placeholder) {
                            placeholder.textContent = dept;
                            placeholder.style.color = 'var(--color-gray-900)';
                        }
                        selector.setAttribute('data-selected', dept);
                        dropdown.remove();
                        
                        // Trigger validation check
                        validateJobDetailsForm();
                    });
                    
                    dropdown.appendChild(option);
                });
                
                // Position dropdown
                selector.style.position = 'relative';
                selector.appendChild(dropdown);
            });
        }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        const dropdowns = document.querySelectorAll('.department-dropdown');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                dropdown.remove();
            }
        });
    });
}

// Setup form validation
function setupFormValidation() {
    // Add input listeners for billing code fields
    const billingFields = [
        document.getElementById('billingCodeMain'),
        document.getElementById('billingCodeInput')
    ];
    
    billingFields.forEach(field => {
        if (field) {
            field.addEventListener('input', validateJobDetailsForm);
        }
    });
    
    // Initial validation
    validateJobDetailsForm();
}

// Validate job details form and enable/disable submit button
function validateJobDetailsForm() {
    const billingCodeMain = document.getElementById('billingCodeMain');
    const departmentSelectMain = document.getElementById('departmentSelectMain');
    const billingCodeInput = document.getElementById('billingCodeInput');
    const departmentSelect = document.getElementById('departmentSelect');
    const submitTranslationBtn = document.getElementById('submitTranslationBtn');
    const stickySubmitTranslationBtn = document.getElementById('stickySubmitTranslationBtn');
    const reviewQuotationBtn = document.getElementById('reviewQuotationBtn');
    const stickyReviewQuotationBtn = document.getElementById('stickyReviewQuotationBtn');
    const sendForTranslationBtn = document.getElementById('sendForTranslationBtn');
    
    // Check main form (review mode)
    let mainFormValid = false;
    if (billingCodeMain && departmentSelectMain) {
        const hasBillingCode = billingCodeMain.value.trim().length > 0;
        const hasDepartment = departmentSelectMain.getAttribute('data-selected');
        mainFormValid = hasBillingCode && hasDepartment;
    }
    
    // Check job details screen form
    let detailsFormValid = false;
    if (billingCodeInput && departmentSelect) {
        const hasBillingCode = billingCodeInput.value.trim().length > 0;
        const hasDepartment = departmentSelect.getAttribute('data-selected');
        detailsFormValid = hasBillingCode && hasDepartment;
    }
    
    // Enable/disable buttons based on which form is active
    const mainView = document.getElementById('mainView');
    const jobDetailsView = document.getElementById('jobDetailsView');
    const isInReviewMode = mainView && mainView.classList.contains('review-mode');
    const isInJobDetailsView = jobDetailsView && !jobDetailsView.classList.contains('hidden');
    
    if (isInReviewMode) {
        // Review mode (step 2) - validate review quotation buttons
        if (reviewQuotationBtn) {
            reviewQuotationBtn.disabled = !mainFormValid;
            reviewQuotationBtn.classList.toggle('disabled', !mainFormValid);
            reviewQuotationBtn.classList.toggle('active', mainFormValid);
        }
        if (stickyReviewQuotationBtn) {
            stickyReviewQuotationBtn.disabled = !mainFormValid;
            stickyReviewQuotationBtn.classList.toggle('disabled', !mainFormValid);
            stickyReviewQuotationBtn.classList.toggle('active', mainFormValid);
        }
        // Keep old submit buttons for backward compatibility
        if (submitTranslationBtn) {
            submitTranslationBtn.disabled = !mainFormValid;
            submitTranslationBtn.classList.toggle('disabled', !mainFormValid);
            submitTranslationBtn.classList.toggle('active', mainFormValid);
        }
        if (stickySubmitTranslationBtn) {
            stickySubmitTranslationBtn.disabled = !mainFormValid;
            stickySubmitTranslationBtn.classList.toggle('disabled', !mainFormValid);
            stickySubmitTranslationBtn.classList.toggle('active', mainFormValid);
        }
    }
    
    if (isInJobDetailsView) {
        // Job details view - check details form
        if (sendForTranslationBtn) {
            sendForTranslationBtn.disabled = !detailsFormValid;
            sendForTranslationBtn.classList.toggle('disabled', !detailsFormValid);
        }
    }
    
    // Return validation result for the current context
    if (isInReviewMode) {
        return mainFormValid;
    } else if (isInJobDetailsView) {
        return detailsFormValid;
    } else {
        // Default to main form validation
        return mainFormValid;
    }
}

// Setup real-time translation simulation for Type and Translate
function setupRealTimeTranslation() {
    const sourceTextArea = document.getElementById('sourceTextArea');
    const translationTextArea = document.getElementById('translationTextArea');
    const translationSkeleton = document.getElementById('translationSkeleton');
    let translationTimeout;

    // Common Chinese characters for realistic translation simulation
    const chineseChars = [
        '我', '是', '你', '的', '一', '在', '不', '了', '有', '和', '人', '这', '中', '大', '为',
        '上', '个', '国', '时', '要', '说', '出', '来', '就', '会', '可', '也', '都', '后', '自',
        '以', '去', '子', '得', '生', '家', '着', '法', '那', '天', '里', '定', '见', '小', '月',
        '分', '听', '三', '头', '手', '高', '正', '年', '同', '老', '实', '地', '方', '女', '点',
        '水', '相', '回', '现', '么', '好', '很', '她', '开', '四', '十', '走', '无', '如', '前',
        '所', '本', '次', '白', '活', '关', '门', '动', '力', '者', '向', '命', '多', '全', '然',
        '建', '过', '不', '同', '社', '想', '干', '光', '专', '业', '测', '试', '内', '容', '文'
    ];

    function generateChineseText(inputLength) {
        // Chinese characters are typically more compact, so use roughly 60% of input length
        const targetLength = Math.max(1, Math.floor(inputLength * 0.6));
        let result = '';

        for (let i = 0; i < targetLength; i++) {
            const randomChar = chineseChars[Math.floor(Math.random() * chineseChars.length)];
            result += randomChar;

            // Add occasional spaces or punctuation for realism
            if (i > 0 && Math.random() < 0.15) {
                if (Math.random() < 0.7) {
                    result += '，'; // Chinese comma
                } else if (Math.random() < 0.5) {
                    result += '。'; // Chinese period
                } else {
                    result += ' ';
                }
            }
        }

        return result;
    }

    if (sourceTextArea && translationTextArea && translationSkeleton) {
        sourceTextArea.addEventListener('input', function() {
            const inputText = this.value;
            const inputLength = inputText.length;

            // Clear previous timeout
            clearTimeout(translationTimeout);

            if (inputLength === 0) {
                // Clear translation when input is empty
                translationTextArea.value = '';
                translationSkeleton.classList.add('hidden');
                return;
            }

            // Show skeleton loader immediately
            translationSkeleton.classList.remove('hidden');
            translationTextArea.value = ''; // Clear previous translation

            // Simulate translation after 2 seconds
            translationTimeout = setTimeout(() => {
                // Hide skeleton loader
                translationSkeleton.classList.add('hidden');

                // Generate Chinese translation
                const chineseTranslation = generateChineseText(inputLength);
                translationTextArea.value = chineseTranslation;

                // Update character count
                const characterCount = document.querySelector('#typeTranslateView .character-count');
                if (characterCount) {
                    characterCount.textContent = `${chineseTranslation.length} / 5000`;
                }
            }, 2000);
        });
    }
}

// Initialize advanced options on load
document.addEventListener('DOMContentLoaded', () => {
    setupAdvancedOptions();
    setupRealTimeTranslation();
});