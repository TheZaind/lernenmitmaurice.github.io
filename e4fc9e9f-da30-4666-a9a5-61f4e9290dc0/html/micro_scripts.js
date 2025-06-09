// PulseLern Micro-Learning Scripts
// Extracted from micro_template.html for modular architecture

// Global variables for slide management
let currentSlideIndex = 0;
let slides = [];
let totalSlides = 0;

// DOM element references
const progressBar = document.querySelector('.progress-bar-fill');
const closeButton = document.querySelector('.nav-button-close');
const continueButton = document.getElementById('continueButton');

// Enhanced Mini-Quiz State Management
let quizStates = {}; // Track quiz states per slide

// Audio system variables
let audioFiles = {};

/**
 * Initialize all slides and set up event listeners
 */
function initializeSlides() {
    slides = document.querySelectorAll('.slides-container .micro-slide');
    totalSlides = slides.length;
    
    // Initialize quiz states for all slides
    slides.forEach((slide, index) => {
        const hasQuiz = slide.getAttribute('data-has-quiz') === 'true';
        if (hasQuiz) {
            // Initialize quiz state
            quizStates[index] = {
                hasSelectedAnswer: false,
                hasCheckedAnswer: false,
                isCorrect: false
            };
            
            // Add event listeners to quiz options
            const options = slide.querySelectorAll('.duo-word-choice');
            options.forEach(option => {
                option.onclick = function() {
                    selectQuizOption(index, option);
                };
            });
        }
    });
      
    // Add main continue button event listener
    // Note: We don't add a static event listener here since the button function changes dynamically
    // The onclick is set dynamically in updateContinueButtonForSlide()

    // Add close button event listener
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            showSlide(0);
        });
    }
    
    if (totalSlides > 0) {
        showSlide(0); // Show the first slide initially
    } else {
        console.error("Keine Slides gefunden zum Initialisieren.");
    }
}

/**
 * Navigate to next slide
 */
function nextSlide() {
    // Check if we're coming from a quiz slide
    const currentSlide = slides[currentSlideIndex];
    const wasQuizSlide = currentSlide && currentSlide.getAttribute('data-has-quiz') === 'true';
    const quizState = quizStates[currentSlideIndex];
    const completedQuiz = wasQuizSlide && quizState && quizState.hasCheckedAnswer;
    
    if (currentSlideIndex < totalSlides - 1) {
        showSlide(currentSlideIndex + 1);
    } else {
        showSlide(0); // Loop back to first slide
    }
      // Auto-scroll to top if we just completed a quiz
    if (completedQuiz) {
        setTimeout(() => {
            // Use the same container as the working scroll function
            const scrollContainer = document.querySelector('.main-app-container');
            if (scrollContainer) {
                scrollContainer.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                // Fallback to window scroll
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        }, 100); // Small delay to ensure slide transition has started
    }
}
        
/**
 * Update continue button state based on current slide type
 */
function updateContinueButtonForSlide(slideIndex) {
    const continueBtn = document.querySelector('.continue-button');
    if (!continueBtn) return;
    
    const currentSlide = slides[slideIndex];
    if (!currentSlide) return;
    
    // Check if this slide has a mini-quiz
    const hasQuiz = currentSlide.getAttribute('data-has-quiz') === 'true';
    
    if (hasQuiz) {
        // Initialize quiz state if not exists
        if (!quizStates[slideIndex]) {
            quizStates[slideIndex] = {
                hasSelectedAnswer: false,
                hasCheckedAnswer: false,
                isCorrect: false
            };
        }
        
        const quizState = quizStates[slideIndex];
          if (!quizState.hasSelectedAnswer) {
            // No answer selected yet - gray out button and scroll to bottom if clicked
            continueBtn.disabled = false; // Keep enabled but visually grayed out
            continueBtn.textContent = 'Antwort wählen';
            continueBtn.style.opacity = '0.5';
            continueBtn.style.cursor = 'not-allowed';            continueBtn.onclick = function() {
                // Scroll to bottom using the same container as the working scroll function
                const scrollContainer = document.querySelector('.main-app-container');
                if (scrollContainer) {
                    scrollContainer.scrollTo({
                        top: scrollContainer.scrollHeight,
                        behavior: 'smooth'
                    });
                } else {
                    // Fallback to window scroll
                    window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            };} else if (!quizState.hasCheckedAnswer) {
            // Answer selected, ready to check - restore normal button styling
            continueBtn.disabled = false;
            continueBtn.textContent = 'Überprüfen';
            continueBtn.style.opacity = '1';
            continueBtn.style.cursor = 'pointer';
            continueBtn.onclick = function() {
                checkQuizAnswer(slideIndex);
            };        } else {
            // Answer checked, ready to proceed - restore normal button styling
            continueBtn.disabled = false;
            continueBtn.textContent = 'Weiter';
            continueBtn.style.opacity = '1';
            continueBtn.style.cursor = 'pointer';
            continueBtn.onclick = function() {
                nextSlide();
            };
        }    } else {
        // For regular slides, enable continue button with normal styling
        continueBtn.disabled = false;
        continueBtn.textContent = 'Weiter';
        continueBtn.style.opacity = '1';
        continueBtn.style.cursor = 'pointer';
        continueBtn.onclick = function() {
            nextSlide();
        };
    }
}
          
/**
 * Handle quiz answer checking
 */
function checkQuizAnswer(slideIndex) {
    const currentSlide = slides[slideIndex];
    const quizState = quizStates[slideIndex];
    
    if (!currentSlide || !quizState) return;
    
    // Find selected option
    const selectedOption = currentSlide.querySelector('.duo-word-choice.selected');
    if (!selectedOption) return;
    
    // Get quiz ID from the slide
    const quizId = currentSlide.getAttribute('data-slide-id') ? 
        currentSlide.getAttribute('data-slide-id').replace('_text', '_mini_quiz') : null;
    
    // Check if answer is correct using quiz data or data-correct attribute
    let isCorrect = false;
    if (quizId && window.quizData && window.quizData[quizId]) {
        const selectedIndex = parseInt(selectedOption.dataset.option);
        const correctIndex = window.quizData[quizId].correctAnswer;
        isCorrect = selectedIndex === correctIndex;
    } else {
        // Fallback to data-correct attribute
        isCorrect = selectedOption.dataset.correct === 'true';
    }
    
    quizState.isCorrect = isCorrect;
    quizState.hasCheckedAnswer = true;
        // Play feedback sound
    if (isCorrect) {
        playSound('goodAnswer');
        selectedOption.classList.add('correct');
    } else {
        playSound('badAnswer');
        selectedOption.classList.add('incorrect');
        // Also highlight the correct answer
        let correctOption = null;
        if (quizId && window.quizData && window.quizData[quizId]) {
            const correctIndex = window.quizData[quizId].correctAnswer;
            correctOption = currentSlide.querySelector(`.duo-word-choice[data-option="${correctIndex}"]`);
        } else {
            correctOption = currentSlide.querySelector('.duo-word-choice[data-correct="true"]');
        }
        if (correctOption) {
            correctOption.classList.add('correct');
        }
    }
    
    // Disable all options
    const allOptions = currentSlide.querySelectorAll('.duo-word-choice');
    allOptions.forEach(option => {
        option.disabled = true;
    });
    
    // Show feedback
    showQuizFeedback(currentSlide, isCorrect);
    
    // Update continue button
    updateContinueButtonForSlide(slideIndex);
    
    // Auto-scroll to feedback area after short delay
    setTimeout(() => {
        scrollToQuizFeedback(currentSlide);
    }, 300);
}
          
/**
 * Show quiz feedback
 */
function showQuizFeedback(slideElement, isCorrect) {
    const feedback = slideElement.querySelector('.mini-quiz-feedback');
    if (!feedback) return;
    
    feedback.style.display = 'block';
    feedback.classList.remove('correct', 'incorrect');
    
    if (isCorrect) {
        feedback.classList.add('correct');
    } else {
        feedback.classList.add('incorrect');
    }
    
    // Get quiz data and populate feedback content
    const quizId = slideElement.getAttribute('data-slide-id') ? 
        slideElement.getAttribute('data-slide-id').replace('_text', '_mini_quiz') : null;
    
    if (quizId && window.quizData && window.quizData[quizId]) {
        const quizData = window.quizData[quizId];
        const feedbackContent = feedback.querySelector('.feedback-content');
        if (feedbackContent) {
            feedbackContent.innerHTML = `
                <div class="feedback-icon">${isCorrect ? '✅' : '❌'}</div>
                <div class="feedback-text">
                    <div class="feedback-status">${isCorrect ? 'Richtig!' : 'Falsch!'}</div>
                    <div class="feedback-explanation">${quizData.explanation}</div>
                </div>
            `;
        }
    }
    
    // Trigger animation
    setTimeout(() => {
        feedback.classList.add('show');
    }, 50);
}

/**
 * Scroll to quiz feedback
 */
function scrollToQuizFeedback(slideElement) {
    const feedback = slideElement.querySelector('.mini-quiz-feedback');
    if (!feedback) return;
    
    // Get the main scrollable container
    const scrollContainer = document.querySelector('.main-app-container');
    if (!scrollContainer) return;
    
    // Calculate position to scroll to
    const feedbackRect = feedback.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    
    // Get footer height for mobile adjustment
    const footer = document.querySelector('.micro-footer');
    const footerHeight = footer ? footer.offsetHeight : 80;
    const isMobile = window.innerWidth <= 768;
    
    // Check if feedback is already visible on desktop
    if (!isMobile) {
        const viewportHeight = containerRect.height;
        const feedbackTop = feedbackRect.top - containerRect.top;
        const feedbackBottom = feedbackRect.bottom - containerRect.top;
        
        // If feedback is already fully visible with some margin, don't scroll
        if (feedbackTop >= 20 && feedbackBottom <= viewportHeight - 20) {
            return; // Content fits, no scrolling needed
        }
        
        // Only scroll if feedback is partially or completely out of view
        let targetScrollTop = scrollContainer.scrollTop + feedbackTop - 100;
        
        // Ensure we don't scroll past the bottom of content unnecessarily
        const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        targetScrollTop = Math.min(targetScrollTop, maxScroll);
        
        scrollContainer.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth'
        });
    } else {
        // Mobile: Always scroll to ensure feedback is visible above footer
        let targetScrollTop = scrollContainer.scrollTop + feedbackRect.bottom - containerRect.bottom + footerHeight + 20;
        
        scrollContainer.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth'
        });
    }
}

/**
 * Handle quiz option selection
 */
function selectQuizOption(slideIndex, optionElement) {
    const currentSlide = slides[slideIndex];
    const quizState = quizStates[slideIndex];
    
    if (!currentSlide || !quizState || quizState.hasCheckedAnswer) return;
    
    // Remove previous selection
    const allOptions = currentSlide.querySelectorAll('.duo-word-choice');
    allOptions.forEach(option => {
        option.classList.remove('selected');
    });
    
    // Select current option
    optionElement.classList.add('selected');
    quizState.hasSelectedAnswer = true;
    
    // Update continue button (this will restore normal styling)
    updateContinueButtonForSlide(slideIndex);
}

/**
 * Global function for mini-quiz continue buttons
 */
function proceedToNext() {
    nextSlide();
}

/**
 * Reset mini-quiz state when navigating to a slide
 */
function resetMiniQuizState(slideElement) {
    if (!slideElement) return;
    
    // Check if this slide has a mini-quiz
    const hasQuiz = slideElement.getAttribute('data-has-quiz') === 'true';
    if (!hasQuiz) return;
    
    // Find slide index to reset quiz state
    const slideIndex = Array.from(slides).indexOf(slideElement);
    if (slideIndex !== -1) {
        quizStates[slideIndex] = {
            hasSelectedAnswer: false,
            hasCheckedAnswer: false,
            isCorrect: false
        };
    }
      // Reset all quiz options to unselected state
    const options = slideElement.querySelectorAll('.duo-word-choice');
    options.forEach((option, index) => {
        option.classList.remove('correct', 'incorrect', 'selected');
        option.disabled = false;
        // Reset styling
        option.style.backgroundColor = '';
        option.style.color = '';
        option.style.borderColor = '';
        
        // Add click event listener for new quiz system
        option.onclick = function() {
            selectQuizOption(slideIndex, option);
        };
    });
    
    // Hide feedback area
    const feedback = slideElement.querySelector('.mini-quiz-feedback');
    if (feedback) {
        feedback.style.display = 'none';
        feedback.classList.remove('show', 'correct-feedback', 'incorrect-feedback');
    }
    
    // Reset any continue button that might be part of the quiz
    const miniQuizContinue = slideElement.querySelector('.mini-quiz-continue');
    if (miniQuizContinue) {
        miniQuizContinue.style.display = 'none';
    }
    
    // Reset the global quiz state variables if they exist
    // This will reset any JavaScript state for the quiz
    const quizId = slideElement.querySelector('[id*="_mini_quiz"]');
    if (quizId) {
        const idParts = quizId.id.split('_');
        const baseQuizId = idParts.slice(0, -1).join('_'); // Remove the "opt0" part
        
        // Reset global variables that might exist for this quiz
        if (window[`selectedOption_${baseQuizId}`] !== undefined) {
            window[`selectedOption_${baseQuizId}`] = -1;
        }
        if (window[`quizAnswered_${baseQuizId}`] !== undefined) {
            window[`quizAnswered_${baseQuizId}`] = false;
        }
    }
}

/**
 * Update progress bar based on current slide
 */
function updateProgressBar() {
    if (totalSlides > 0) {
        const progressPercentage = ((currentSlideIndex + 1) / totalSlides) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    } else {
        progressBar.style.width = '0%';
    }
}

/**
 * Sound System - Preload audio files and create sound functions
 */
function preloadAudio() {
    const sounds = {
        goodAnswer: 'assets/sounds/goodawnser2.mp3',
        badAnswer: 'assets/sounds/badawnser1.mp3',
        pageTransition: 'assets/sounds/pg_warm3.mp3'
    };
    
    for (const [key, path] of Object.entries(sounds)) {
        audioFiles[key] = new Audio(path);
        audioFiles[key].preload = 'auto';
        audioFiles[key].volume = 0.3; // Set moderate volume
    }
}

/**
 * Play sound by key
 */
function playSound(soundKey) {
    try {
        if (audioFiles[soundKey]) {
            audioFiles[soundKey].currentTime = 0; // Reset to beginning
            audioFiles[soundKey].play().catch(e => console.log('Sound play failed:', e));
        }
    } catch (error) {
        console.log('Sound playback error:', error);
    }
}

/**
 * Create click sound effect using Web Audio API
 */
function createClickSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Create a satisfying click sound (short pop)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        // Fallback: silent if Web Audio API not supported
        console.log('Web Audio API not supported for click sound');
    }
}

/**
 * Show slide with animation
 */
function showSlide(index) {
    if (index < 0 || index >= totalSlides) {
        console.warn("Slide index out of bounds:", index);
        return;
    }
    
    // Play page transition sound effect
    playSound('pageTransition');

    const currentSlide = slides[currentSlideIndex];
    const nextSlide = slides[index];
    const isForward = index > currentSlideIndex;
    
    // Set up initial positions for push away animation
    if (currentSlide) {
        currentSlide.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease';
        currentSlide.style.transform = isForward ? 'translateX(-100%)' : 'translateX(100%)';
        currentSlide.style.opacity = '0';
    }
    
    if (nextSlide) {
        nextSlide.style.transition = 'none';
        nextSlide.style.transform = isForward ? 'translateX(100%)' : 'translateX(-100%)';
        nextSlide.style.opacity = '1';
        nextSlide.classList.add('active');
        
        // Trigger reflow
        nextSlide.offsetHeight;
        
        // Animate to center position
        nextSlide.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        nextSlide.style.transform = 'translateX(0)';
    }

    // Clean up after animation
    setTimeout(() => {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) {
                slide.classList.add('active');
                slide.style.transform = 'translateX(0)';
                slide.style.opacity = '1';
                slide.style.transition = '';
            } else {
                slide.style.transform = '';
                slide.style.opacity = '';
                slide.style.transition = '';
            }
        });
        
        currentSlideIndex = index;
        updateProgressBar(); // Update progress bar instead of page counter
        
        // Reset mini-quiz state for the new slide
        resetMiniQuizState(slides[index]);
        
        // Handle continue button state for mini-quiz slides
        updateContinueButtonForSlide(index);
        
        // Apply uniform scaling to visual content
        applyScalingToActiveSlide();
          
        // Re-initialize Mermaid and MathJax for the current slide if they are present
        if (typeof mermaid !== 'undefined') {
            const currentSlideElement = slides[currentSlideIndex];
            const mermaidElements = currentSlideElement.querySelectorAll('.mermaid');
            
            if (mermaidElements.length > 0) {
                console.log(`Re-rendering ${mermaidElements.length} Mermaid diagram(s) for slide ${currentSlideIndex}`);
                
                // For slides with Mermaid, we need to re-run to ensure proper rendering
                try {
                    mermaid.run({ nodes: mermaidElements });
                    console.log(`Successfully rendered Mermaid diagrams for slide ${currentSlideIndex}`);
                } catch (error) {
                    console.error('Error rendering Mermaid diagrams:', error);
                }
            }
        }
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([slides[currentSlideIndex]]);
        }
    }, 400); // Match animation duration
}

/**
 * Smart Continue Button - Check scroll position
 */
function checkScrollAndEnableButton() {
    const continueButton = document.getElementById('continueButton');
    if (!continueButton) return;
    
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Check if scrolling is possible
    const canScroll = documentHeight > windowHeight;
    
    if (!canScroll) {
        // No scrolling needed - enable button immediately
        continueButton.disabled = false;
        continueButton.style.backgroundColor = 'var(--button-primary-bg)';
        continueButton.style.color = 'var(--button-primary-text)';
    } else {
        // Check if scrolled to 90%
        const scrollPercent = (scrollTop + windowHeight) / documentHeight;
        
        if (scrollPercent >= 0.9) {
            // Enable button
            continueButton.disabled = false;
            continueButton.style.backgroundColor = 'var(--button-primary-bg)';
            continueButton.style.color = 'var(--button-primary-text)';
        } else {
            // Disable button
            continueButton.disabled = true;
            continueButton.style.backgroundColor = 'var(--progress-bar-bg)';
            continueButton.style.color = 'var(--text-color-secondary)';
        }
    }
}

// Universal Visual Toolkit Functions
function initializeVisualConfigurations() {
    console.log('Initializing visual configurations...');
    
    // Find all visual placeholders that have configuration data
    const visualPlaceholders = document.querySelectorAll('.visual-placeholder[data-has-config="true"]');
    console.log(`Found ${visualPlaceholders.length} visual placeholders with configuration`);
      
    visualPlaceholders.forEach((placeholder, index) => {
        try {
            console.log(`Processing placeholder ${index + 1}:`, placeholder);
            const configScript = placeholder.querySelector('script.visual-config');
            console.log(`Found config script:`, configScript);
            
            if (configScript) {
                // Execute the script to set window.visualConfig
                eval(configScript.textContent);
                const config = window.visualConfig;
                console.log(`Loaded config:`, config);
                
                if (config) {
                    renderVisualConfig(placeholder, config);
                    // Clear the global variable for next use
                    window.visualConfig = null;
                } else {
                    console.warn(`No config loaded from script in placeholder ${index + 1}`);
                    renderFallbackVisual(placeholder);
                }
            } else {
                console.warn(`No config script found in placeholder ${index + 1}`);
                renderFallbackVisual(placeholder);
            }
        } catch (error) {
            console.error(`Error rendering visual configuration ${index + 1}:`, error);
            renderFallbackVisual(placeholder);
        }
    });
}
        
function renderVisualConfig(container, config) {
    // Store config globally for interaction callbacks
    window.currentVisualConfig = config;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create the visual container
    const visualContainer = document.createElement('div');
    visualContainer.className = 'visual-component-root';
    visualContainer.innerHTML = `<div class="visual-container" style="--accent-primary: ${config.colors?.primary || '#0af'}; --accent-secondary: ${config.colors?.secondary || '#f06'}; --transition-speed: ${config.timing?.speed || '0.3s'}"></div>`;
    
    const canvasContainer = visualContainer.querySelector('.visual-container');
    
    // Render elements
    if (config.elements && Array.isArray(config.elements)) {
        config.elements.forEach((element, index) => {
            const visualElement = createVisualElement(element, index);
            if (visualElement) {
                canvasContainer.appendChild(visualElement);
            }
        });
    }
    
    // Apply animations
    if (config.animations && Array.isArray(config.animations)) {
        setTimeout(() => {
            config.animations.forEach(animation => {
                applyAnimation(canvasContainer, animation);
            });
        }, 100);
    }
    
    // Setup interactions
    if (config.interactions && Array.isArray(config.interactions)) {
        config.interactions.forEach(interaction => {
            setupInteraction(canvasContainer, interaction);
        });
    }
    
    container.appendChild(visualContainer);
}

function createVisualElement(element, index) {
    const el = document.createElement('div');
    el.className = 'visual-element';
    el.id = element.id || `element-${index}`;
    
    // Set position with responsive coordinate system
    if (element.position) {
        el.style.position = 'absolute';
        
        // Use percentage-based positioning for fixed 400x300 container
        // Convert coordinate system: LLM uses -200 to +200 for X, -150 to +150 for Y
        const normalizedX = (element.position.x + 200) / 400; // Convert to 0-1 range
        const normalizedY = (element.position.y + 150) / 300; // Convert to 0-1 range
        
        // Apply as percentages for responsive positioning
        el.style.left = (normalizedX * 100) + '%';
        el.style.top = (normalizedY * 100) + '%';
        
        // Center the element at its position
        el.style.transform = 'translate(-50%, -50%)';
    }
    
    // Set size from options with fixed container scaling
    if (element.options) {
        if (element.options.width) {
            // Scale width as percentage of container width (400px base)
            const widthPercent = (element.options.width / 400) * 100;
            el.style.width = Math.min(widthPercent, 90) + '%'; // Max 90% of container
        }
        if (element.options.height) {
            // Scale height as percentage of container height (300px base)
            const heightPercent = (element.options.height / 300) * 100;
            el.style.height = Math.min(heightPercent, 90) + '%'; // Max 90% of container
        }
        if (element.options.opacity !== undefined) el.style.opacity = element.options.opacity;
    }
    
    // Legacy size support with fixed container scaling
    if (element.size) {
        const widthPercent = (element.size.width / 400) * 100;
        const heightPercent = (element.size.height / 300) * 100;
        el.style.width = Math.min(widthPercent, 90) + '%';
        el.style.height = Math.min(heightPercent, 90) + '%';
    }
    
    // Enhanced styling with design rules
    el.style.borderRadius = '4px';
    el.style.transition = 'all 0.3s ease';
    
    // Set colors from style
    if (element.style) {
        if (element.style.backgroundColor) el.style.backgroundColor = element.style.backgroundColor;
        if (element.style.color) el.style.color = element.style.color;
        if (element.style.border) el.style.border = element.style.border;
        if (element.style.borderRadius) el.style.borderRadius = element.style.borderRadius;
        if (element.style.fontSize) el.style.fontSize = element.style.fontSize;
        if (element.style.fontWeight) el.style.fontWeight = element.style.fontWeight;
    }
    
    // Apply color theme from color field (LLM uses color: "Primary", "Secondary", etc.)
    if (element.color) {
        const colorMap = {
            'Primary': '#0af',     // Use design rules colors
            'Secondary': '#f06', 
            'Success': '#0f8',
            'Warning': '#fc0',
            'Error': '#f03',
            'Info': '#06f'
        };
        const bgColor = colorMap[element.color] || element.color;
        el.style.backgroundColor = bgColor;
        el.style.border = `2px solid ${bgColor}`;
        el.style.boxShadow = `0 0 10px ${bgColor}40`; // Add glow effect
    }
    
    // Apply shape class for rectangle type
    if (element.type === 'rectangle') {
        el.classList.add('shape-rectangle');
        if (!element.style && !element.color) {
            el.style.backgroundColor = '#0af';
            el.style.border = '2px solid #0af';
            el.style.boxShadow = '0 0 10px #0af40';
        }
    }
    
    // Apply shape class
    if (element.shape) {
        el.classList.add(`shape-${element.shape}`);
    }
    
    // Apply color class
    if (element.colorClass) {
        el.classList.add(`color-${element.colorClass}`);
    }
    
    // Set content based on type
    switch (element.type) {
        case 'text':
            el.classList.add('text-element');
            // LLM uses options.text
            el.textContent = (element.options && element.options.text) || element.content || '';
            el.style.color = element.style?.color || '#ffffff';
            el.style.fontSize = element.style?.fontSize || '14px';
            el.style.fontWeight = element.style?.fontWeight || 'bold';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.textAlign = 'center';
            el.style.textShadow = '0 0 5px rgba(0, 170, 255, 0.5)'; // Add text glow
            el.style.fontFamily = 'Arial, sans-serif';
            break;
        case 'rectangle':
            // Rectangle styling is handled above
            break;
        case 'circle':
            el.style.borderRadius = '50%';
            if (!element.style && !element.color) {
                el.style.backgroundColor = '#0af';
                el.style.border = '2px solid #0af';
                el.style.boxShadow = '0 0 15px #0af';
            }
            break;
        case 'shape':
            // Shape styling is handled by CSS classes
            break;
        case 'button':
            el.classList.add('visual-button');
            el.textContent = (element.options && element.options.text) || element.content || 'Button';
            el.style.cursor = 'pointer';
            el.style.backgroundColor = '#222';
            el.style.color = '#0af';
            el.style.border = '1px solid #0af';
            el.style.padding = '8px 16px';
            el.style.borderRadius = '4px';
            el.style.fontWeight = 'bold';
            break;
        case 'line':
            el.style.height = '2px';
            el.style.backgroundColor = element.style?.backgroundColor || '#0af';
            el.style.transformOrigin = 'left center';
            el.style.boxShadow = `0 0 5px ${element.style?.backgroundColor || '#0af'}`;
            if (element.angle) {
                el.style.transform = `rotate(${element.angle}deg)`;
            }
            break;
        default:
            el.textContent = (element.options && element.options.text) || element.content || '';
    }
    
    return el;
}

function applyAnimation(container, animation) {
    // Support both legacy target and LLM's elementId
    const selector = animation.elementId || animation.target;
    const targetElements = selector === 'all' 
        ? container.querySelectorAll('.visual-element')
        : container.querySelectorAll(`#${selector}`);
    
    // Extract timing and parameters
    const timing = animation.timing || {};
    const parameter = animation.parameter || {};
    const duration = timing.duration ? `${timing.duration}ms` : (animation.duration || '1s');
    const delay = timing.delay || animation.delay || 0;
    const easing = timing.easing || 'ease';
    
    targetElements.forEach(element => {
        setTimeout(() => {
            switch (animation.type) {
                case 'pulse':
                    element.classList.add('pulsing');
                    break;
                case 'rotate':
                    element.classList.add('rotating');
                    break;
                case 'fadeIn':
                    element.style.animation = `fadeIn ${duration} ${easing}`;
                    break;
                case 'fade':
                    // LLM uses fade type with opacity in parameter
                    element.style.transition = `opacity ${duration} ${easing}`;
                    if (parameter.opacity !== undefined) {
                        element.style.opacity = parameter.opacity;
                    }
                    break;
                case 'slideIn':
                    element.style.animation = `slideIn ${duration} ${easing}`;
                    break;
                case 'bounce':
                    element.style.animation = `bounce ${duration} ${easing}`;
                    break;
                case 'move':
                    // LLM uses parameter object with x, y coordinates
                    const targetX = parameter.x !== undefined ? parameter.x : (animation.to && animation.to.x);
                    const targetY = parameter.y !== undefined ? parameter.y : (animation.to && animation.to.y);
                    
                    if (targetX !== undefined || targetY !== undefined) {
                        element.style.transition = `all ${duration} ${easing}`;
                        if (targetX !== undefined) element.style.left = targetX + 'px';
                        if (targetY !== undefined) element.style.top = targetY + 'px';
                    }
                    break;
                case 'scale':
                    element.style.transition = `transform ${duration} ${easing}`;
                    const scaleValue = parameter.scale || animation.scale || 1.2;
                    element.style.transform = `scale(${scaleValue})`;
                    break;
                case 'sequence':
                    if (animation.steps && Array.isArray(animation.steps)) {
                        animation.steps.forEach((step, index) => {
                            setTimeout(() => {
                                applyAnimation(container, {...step, elementId: selector});
                            }, (animation.stepDelay || 500) * index);
                        });
                    }
                    break;
            }
        }, delay);
    });
}
        
function setupInteraction(container, interaction) {
    // Support both legacy target and LLM's elementId
    const selector = interaction.elementId || interaction.target;
    const targetElements = selector === 'all'
        ? container.querySelectorAll('.visual-element')
        : container.querySelectorAll(`#${selector}`);
    
    targetElements.forEach(element => {
        element.classList.add('interactive');
        element.style.cursor = 'pointer';
        
        switch (interaction.type) {
            case 'click':
                element.addEventListener('click', () => {
                    // Handle LLM's callbacks array
                    if (interaction.callbacks && Array.isArray(interaction.callbacks)) {
                        interaction.callbacks.forEach(callback => {
                            handleInteractionCallback(container, callback);
                        });
                    }
                    // Handle legacy single action
                    else if (interaction.action) {
                        handleInteractionAction(container, interaction.action);
                    }
                });
                break;
            case 'hover':
                element.addEventListener('mouseenter', () => {
                    if (interaction.callbacks && Array.isArray(interaction.callbacks)) {
                        interaction.callbacks.forEach(callback => {
                            if (callback.trigger === 'hover' || callback.trigger === 'enter') {
                                handleInteractionCallback(container, callback);
                            }
                        });
                    }
                    else if (interaction.action && interaction.action.onHover) {
                        handleInteractionAction(container, interaction.action.onHover);
                    }
                });
                element.addEventListener('mouseleave', () => {
                    if (interaction.callbacks && Array.isArray(interaction.callbacks)) {
                        interaction.callbacks.forEach(callback => {
                            if (callback.trigger === 'leave') {
                                handleInteractionCallback(container, callback);
                            }
                        });
                    }
                    else if (interaction.action && interaction.action.onLeave) {
                        handleInteractionAction(container, interaction.action.onLeave);
                    }
                });
                break;
            case 'drag':
                makeDraggable(element);
                break;
        }
    });
}

function handleInteractionCallback(container, callback) {
    switch (callback.action) {
        case 'triggerAnimation':
            // Find the animation by ID and trigger it
            if (window.currentVisualConfig && window.currentVisualConfig.animations) {
                const animation = window.currentVisualConfig.animations.find(anim => anim.id === callback.animationId);
                if (animation) {
                    applyAnimation(container, animation);
                } else {
                    console.warn(`Animation with ID '${callback.animationId}' not found`);
                }
            }
            break;
        case 'highlight':
            const highlightTargets = callback.elementId === 'all'
                ? container.querySelectorAll('.visual-element')
                : container.querySelectorAll(`#${callback.elementId}`);
            highlightTargets.forEach(el => {
                el.classList.add('glowing');
                if (callback.duration) {
                    setTimeout(() => el.classList.remove('glowing'), callback.duration);
                }
            });
            break;
        case 'animate':
            applyAnimation(container, callback);
            break;
        default:
            console.warn(`Unknown callback action: ${callback.action}`);
    }
}

function handleInteractionAction(container, action) {
    switch (action.type) {
        case 'highlight':
            const highlightTargets = action.target === 'all'
                ? container.querySelectorAll('.visual-element')
                : container.querySelectorAll(`#${action.target}`);
            highlightTargets.forEach(el => {
                el.classList.add('glowing');
                if (action.duration) {
                    setTimeout(() => el.classList.remove('glowing'), action.duration);
                }
            });
            break;
        case 'animate':
            applyAnimation(container, action);
            break;
        case 'show':
            const showTargets = action.target === 'all'
                ? container.querySelectorAll('.visual-element')
                : container.querySelectorAll(`#${action.target}`);
            showTargets.forEach(el => {
                el.style.opacity = '1';
                el.style.visibility = 'visible';
            });
            break;
        case 'hide':
            const hideTargets = action.target === 'all'
                ? container.querySelectorAll('.visual-element')
                : container.querySelectorAll(`#${action.target}`);
            hideTargets.forEach(el => {
                el.style.opacity = '0';
                el.style.visibility = 'hidden';
            });
            break;
    }
}

function makeDraggable(element) {
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    element.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = parseInt(element.style.left) || 0;
        initialY = parseInt(element.style.top) || 0;
        element.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        element.style.left = (initialX + deltaX) + 'px';
        element.style.top = (initialY + deltaY) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            element.style.cursor = 'grab';
        }
    });
}

function renderFallbackVisual(container) {
    container.innerHTML = `
        <div class="visual-component-root">
            <div class="visual-container">
                <div class="visual-element text-element" style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: var(--text-secondary);
                    font-style: italic;
                ">Visual content placeholder</div>
            </div>
        </div>
    `;
}

/**
 * IMPROVED UNIFORM SCALING SYSTEM: Fill body space without stretching
 */
function applyUniformScaling() {
    const visualContainers = document.querySelectorAll('.visual-container');
    
    visualContainers.forEach(container => {
        const visualRoot = container.querySelector('.visual-component-root');
        if (!visualRoot) return;
        
        // Get container dimensions (body space available)
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        // Get content dimensions
        const contentRect = visualRoot.getBoundingClientRect();
        const contentWidth = contentRect.width;
        const contentHeight = contentRect.height;
        
        if (contentWidth === 0 || contentHeight === 0) return;
        
        // Calculate scale factors for both dimensions
        const scaleX = containerWidth / contentWidth;
        const scaleY = containerHeight / contentHeight;
        
        // Use the smaller scale to ensure uniform scaling (no stretching)
        // This ensures 2 sides fill to container edge, 2 sides may have gaps
        const scale = Math.min(scaleX, scaleY);
        
        // Apply uniform scaling transformation
        visualRoot.style.transform = `scale(${scale})`;
        visualRoot.style.transformOrigin = 'center center';
        
        // Ensure container allows overflow for edges that extend beyond
        container.style.overflow = 'hidden';
    });
}

/**
 * Apply scaling when slides change
 */
function applyScalingToActiveSlide() {
    setTimeout(applyUniformScaling, 50);
}

// Event Listeners and Initialization

// Keyboard navigation for slide control
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentSlideIndex > 0) {
        showSlide(currentSlideIndex - 1);
    } else if (e.key === 'ArrowRight' && currentSlideIndex < totalSlides - 1) {
        showSlide(currentSlideIndex + 1);
    } else if (e.key === ' ' || e.key === 'Enter') { // Space or Enter for next slide
        e.preventDefault();
        nextSlide();
    } else if (e.key === 'Escape') {
        // Handle close action - could close the micro-learning session
        console.log('Escape pressed - close functionality can be implemented here');
    }
});

// Close button functionality
if (closeButton) {
    closeButton.addEventListener('click', () => {
        // Handle close action - could close the micro-learning session
        console.log('Close button clicked - close functionality can be implemented here');
        // Example: window.close() or redirect to main page
    });
}

// Scroll event listener for smart button
window.addEventListener('scroll', checkScrollAndEnableButton);
window.addEventListener('resize', checkScrollAndEnableButton);

// Optional: Click on progress bar to jump to specific slide
if (progressBar && progressBar.parentElement) {
    progressBar.parentElement.addEventListener('click', (e) => {
        const rect = progressBar.parentElement.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickPercentage = clickX / rect.width;
        const targetSlide = Math.floor(clickPercentage * totalSlides);
        
        if (targetSlide >= 0 && targetSlide < totalSlides) {
            showSlide(targetSlide);
        }
    });
}

// Apply scaling on load and resize
window.addEventListener('load', () => {
    setTimeout(applyUniformScaling, 100); // Small delay to ensure elements are rendered
});

window.addEventListener('resize', () => {
    setTimeout(applyUniformScaling, 50);
});

// Mermaid initialization
document.addEventListener('DOMContentLoaded', function() {
    if (typeof mermaid !== 'undefined') {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose',
            htmlLabels: true,
            fontFamily: "'Poppins', sans-serif",
            // 4:3 Aspect Ratio Optimierungen
            maxWidth: 960,      // Optimiert für 1024px Container mit Padding
            maxHeight: 680,     // Optimiert für 768px Container mit Padding
            flowchart: {
                curve: 'basis',
                useMaxWidth: true,
                useMaxHeight: true,
                htmlLabels: true,
                rankDir: 'LR',     // Default zu Left-Right für horizontale Layouts
                nodeSpacing: 50,   // Mehr Platz zwischen Nodes horizontal
                rankSpacing: 80    // Mehr Platz zwischen Reihen
            },
            sequence: {
                useMaxWidth: true,
                width: 900,        // Breiter für 4:3 Format
                height: 600
            },
            mindmap: {
                useMaxWidth: true,
                maxNodeWidth: 200  // Breitere Nodes für bessere Lesbarkeit
            },
            themeVariables: {
                primaryColor: '#7F5AF0',        // Haupt-Lila aus NEWdesignconceptForVisuals.txt
                primaryTextColor: '#f0f0f0',    // Helle Textfarbe für Dark Mode
                primaryBorderColor: '#7F5AF0',  // Lila-Rahmen
                lineColor: '#7F5AF0',          // Lila für Verbindungslinien
                secondaryColor: '#6A48D0',      // Dunkles Lila für Schatten
                tertiaryColor: '#242424',       // Dunkler Hintergrund (card-bg)
                background: '#121212',          // Dark Mode Hintergrund
                mainBkg: '#242424',            // Knoten-Hintergrund
                secondBkg: '#1E1E1E',          // Sekundärer Hintergrund (app-bg)
                edgeLabelBackground: '#242424', // Edge-Label Hintergrund
                clusterBkg: '#1E1E1E',         // Cluster-Hintergrund
                altBackground: '#1A1A1A',       // Alternative Hintergrundfarbe
                nodeTextColor: '#f0f0f0'       // Text in Knoten
            }
        });
        
        // Initial render of all Mermaid diagrams
        try {
            const allMermaidElements = document.querySelectorAll('.mermaid');
            if (allMermaidElements.length > 0) {
                console.log(`Found ${allMermaidElements.length} Mermaid diagrams to render`);
                mermaid.run({ nodes: allMermaidElements });
                console.log('Initial Mermaid rendering completed');
            }
        } catch (error) {
            console.error('Error in initial Mermaid rendering:', error);
        }
    } else {
        console.error('Mermaid library not loaded');
    }
    
    // UNIVERSAL VISUAL TOOLKIT JAVASCRIPT
    // Initialize all visual configurations when DOM is loaded
    initializeVisualConfigurations();
    // Initialize audio system
    preloadAudio();
    initializeSlides(); // Initialize slides after DOM is loaded and Mermaid is configured
});

// Add additional debugging for Mermaid
window.addEventListener('load', function() {
    console.log('Window load event fired');
    if (typeof mermaid !== 'undefined') {
        console.log('Mermaid is available:', mermaid.version || 'version unknown');
        const allMermaidElements = document.querySelectorAll('.mermaid');
        console.log(`Total Mermaid elements found: ${allMermaidElements.length}`);
        allMermaidElements.forEach((el, index) => {
            console.log(`Mermaid element ${index}:`, el.textContent.substring(0, 100));
        });
    } else {
        console.error('Mermaid is not available on window load');
    }
});

// Initialize slides when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeSlides();
    
    // Initialize Mermaid diagrams globally with improved settings
    if (typeof mermaid !== 'undefined') {
        mermaid.initialize({
            startOnLoad: false, // We will call mermaid.run() manually
            theme: 'dark',
            securityLevel: 'loose',
            htmlLabels: true,
            fontFamily: "'Poppins', sans-serif",
            flowchart: {
                nodeSpacing: 50,
                rankSpacing: 50,
                curve: 'basis',
                useMaxWidth: true,
                htmlLabels: true
            },
            sequence: {
                diagramMarginX: 50,
                diagramMarginY: 10,
                actorMargin: 50,
                width: 150,
                height: 65,
                boxMargin: 10,
                boxTextMargin: 5,
                noteMargin: 10,
                messageMargin: 35,
                mirrorActors: true,
                bottomMarginAdj: 1
            },
            themeVariables: {
                primaryColor: '#7F5AF0',        // Konsistent mit dem Theme oben
                primaryTextColor: '#f0f0f0',
                primaryBorderColor: '#7F5AF0',
                lineColor: '#7F5AF0',
                secondaryColor: '#6A48D0',
                tertiaryColor: '#242424',
                background: '#121212',
                mainBkg: '#242424',
                secondBkg: '#1E1E1E',
                edgeLabelBackground: '#242424',
                clusterBkg: '#1E1E1E',
                altBackground: '#1A1A1A',
                nodeTextColor: '#f0f0f0'
            }
        });
        
        // FIXED: Initial render of all Mermaid diagrams on page load
        setTimeout(() => {
            const allMermaidElements = document.querySelectorAll('.mermaid');
            if (allMermaidElements.length > 0) {
                try {
                    mermaid.run({ nodes: allMermaidElements });
                    console.log(`Initial render: ${allMermaidElements.length} Mermaid diagram(s)`);
                } catch (error) {
                    console.error('Error in initial Mermaid render:', error);
                }
            }
        }, 100);
    }
});
