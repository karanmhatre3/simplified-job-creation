# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Unified Translation Platform** - a web-based application for file translation with language selection and human review options. It's a client-side only application with no build system or backend dependencies.

## Architecture

### Core Structure
- **index.html**: Main HTML file with complete UI structure including sidebar navigation, file upload area, language selector, toast notifications, and dual-button system
- **script.js**: Main JavaScript application logic (~1800 lines) with comprehensive form validation and stepper management
- **styles.css**: Complete styling with CSS custom properties, responsive design, and stepper components

### Key Components

**File Upload System**:
- Drag and drop functionality with visual overlay
- File validation and progress tracking
- Support for multiple file selection
- Global `selectedFiles` array manages uploaded files

**Language Selection**:
- Multi-select dropdown with search functionality
- Default languages: Spanish (Spain) and French (France)
- Global `selectedLanguages` array with language codes and display text

**Form State Management**:
- Global `formState` object tracks: `hasFiles`, `isTranslating`, `isCompleted`, `hasLoadedJobDetailsOnce`
- `updateFormState()` function controls UI visibility and button states
- Form fields are enabled/disabled based on file upload status
- Skeleton loading shown only on first job details load

**Job Details & Validation**:
- Additional instructions textarea with 200 character limit and real-time counter
- Department dropdown with 9 predefined options (Marketing, Sales, HR, Engineering, etc.)
- Billing code input validation with real-time form validation
- Form validation prevents submission until both billing code and department are selected
- Separate validation logic for different screens (review mode vs job details view)

**Dual-Button System**:
- **Step 1 Buttons**: "Translate" or "Review job details" (enabled when files + languages selected)
- **Step 2 Buttons**: "Submit for Translation" (enabled only when billing code + department filled)
- Smart button show/hide logic based on current workflow step
- Both main and sticky button versions for each step

**Progress Stepper**:
- Vertical stepper with circles showing step numbers and completion status
- Purple circles for active/completed states (no green)
- Check icons for completed steps, step numbers for current/future steps
- No purple indicator bar (cleaner design)
- Hidden on completion screen
- Smooth slide-in animation from right when certified translation enabled
- Slide-out animation when certified translation disabled
- 400ms cubic-bezier transitions with proper timing delays

**UI Features**:
- Sidebar navigation with active states and Lucide icons
- Toast notification system for progress and success feedback
- Toggle switches for human review and verification options
- Responsive design with CSS custom properties
- Clean completion screen (no stepper, no sticky buttons)

**Advanced Options Sidebar**:
- Slide-out sidebar from right side with translation quality settings
- Professional/Reviewer quality dropdown options
- File handling preferences (preserve original formatting, etc.)
- Positioned behind sticky buttons but above stepper in z-index stack
- Smooth show/hide animations with backdrop overlay

### JavaScript Architecture

**Initialization Pattern**:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initializeApp();
});
```

**Key Functions**:
- `initializeApp()`: Sets up all event listeners and initial state
- `getElements()`: Centralized DOM element access
- `updateFormState()`: UI state management based on form state
- `setupFileUpload()`, `setupLanguageSelector()`: Component initialization
- `setupDepartmentDropdowns()`: Creates interactive department selection dropdowns
- `setupFormValidation()`: Configures real-time form validation
- `setupTextareaCharacterCount()`: Manages character counting for instructions field
- `validateJobDetailsForm()`: Validates billing code and department selection
- `updateStepperStep(step)`: Manages stepper visual states and button visibility
- `updateButtonsForStep(step)`: Shows/hides appropriate buttons for current step
- `showSkeletonLoader()`: Smart skeleton display (only first time)
- `resetApplication()`: Simple page refresh for clean state reset
- `animateToJobDetails()`: Custom transform animation for smooth positioning
- `animateBackToCenter()`: Reverse transform animation for step navigation

**Global State**:
- `selectedFiles[]`: Array of uploaded file objects
- `selectedLanguages[]`: Array of language objects with `code` and `text`
- `formState{}`: Application state object with loading and validation flags

**Validation Logic**:
- **Step 1**: Buttons enabled when files uploaded and languages selected
- **Step 2**: Buttons enabled only when billing code entered and department selected
- **Real-time validation**: Input events trigger immediate button state updates
- **Context-aware**: Different validation rules for different screens/modes

**Animation System**:
- **Content positioning**: Custom JavaScript transform animations instead of CSS transitions
- **Smooth transforms**: 600ms cubic-bezier easing for natural movement
- **From center (-30%) to review (-80%) positioning**: Prevents visual jumps when content changes
- **Stepper animations**: Slide-in/out from right side with 400ms timing
- **Bidirectional**: Forward and reverse animations for step navigation

**Z-Index Layer Management**:
1. **Navigation sidebar (left)**: `z-index: 1100` (highest)
2. **Sticky bottom bar**: `z-index: 1050` 
3. **Advanced options sidebar**: `z-index: 1000` (behind sticky buttons)
4. **Progress stepper**: `z-index: 900` (lowest - covered by advanced sidebar)

**Workflow States**:
1. **Initial State**: File upload area, language selection disabled
2. **Files Uploaded**: Language selection enabled, translate button active
3. **Human Review Selected**: Job details form appears, stepper animates in, sticky buttons appear
4. **Review Mode (Step 2)**: Form fields enabled, submit buttons require validation, smooth positioning animation
5. **Completion**: Clean screen with only action buttons, stepper/sticky buttons hidden

## Development

### Running the Application
Open `index.html` directly in a web browser - no build process required.

**Testing Protocol**: 
- Do NOT use `open` command after making changes
- User will test manually and provide feedback

### External Dependencies
- **Lucide Icons**: Loaded from CDN for UI icons
- **LottieFiles**: For animated elements (dotlottie-wc)
- **Satoshi Font**: From Fontshare CDN

### File Organization
This is a single-page application with all functionality contained in the three main files. No module system or bundling is used - everything runs in the browser directly.

### Styling System
Uses CSS custom properties (CSS variables) defined in `:root` for consistent theming:
- **Color palette**: Purple/gray theme with purple for active states, gray for inactive
- **Spacing system**: Consistent spacing constants (xs: 4px, s: 8px, m: 16px, l: 24px)
- **Border radius**: Standardized radius values (m: 8px, l: 16px)
- **Component styling**: All components use these variables for consistency
- **Stepper design**: Circles with step numbers/check icons, no purple bar indicators
- **Button states**: Disabled styling with opacity 0.5 and not-allowed cursor
- **Dropdown styling**: Custom dropdowns with hover effects and proper z-indexing
- **Animation transitions**: Cubic-bezier easing for natural movement patterns
- **Transform-based positioning**: JavaScript-controlled transforms for smooth repositioning
- **Layered z-index system**: Proper stacking order for overlapping UI elements
- **Responsive design**: Adapts to different screen sizes and orientations

### Component Patterns
- **Form fields**: Horizontal layout with labels and input wrappers
- **Dropdowns**: Custom-styled with dynamic option generation
- **Buttons**: Primary/secondary/tertiary variants with consistent styling
- **Cards**: Job details cards with consistent padding and border styling
- **Toast notifications**: Progress and success toasts with proper animations
- **Skeleton loading**: Smart loading states that appear only when needed