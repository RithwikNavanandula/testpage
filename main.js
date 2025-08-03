// Global Variables
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let testType = '';
let timer = null;
let startTime = null;
let testDuration = 3 * 60 * 60; // 3 hours in seconds
let timeRemaining = testDuration;
let selectedTopics = [];
let tabSwitchCount = 0;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeAntiCheat();
});

function initializeApp() {
    const testCards = document.querySelectorAll('.test-card');
    testCards.forEach(card => {
        card.addEventListener('click', function() {
            const testTypeAttr = this.getAttribute('data-test-type');
            if (testTypeAttr) {
                showLoading();
                setTimeout(() => {
                    navigateToTest(testTypeAttr);
                }, 500);
            }
        });
    });
}

// Anti-Cheat Features
function initializeAntiCheat() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // Disable text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';

    // Disable keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Disable Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+P, Ctrl+S, Ctrl+U, Ctrl+A
        if (e.ctrlKey) {
            const forbiddenKeys = ['c', 'v', 'x', 'p', 's', 'u', 'a'];
            if (forbiddenKeys.includes(e.key.toLowerCase())) {
                e.preventDefault();
                showAntiCheatWarning('Keyboard shortcuts are disabled during the test!');
                return false;
            }
        }
        
        // Disable F12 (Developer Tools)
        if (e.key === 'F12') {
            e.preventDefault();
            showAntiCheatWarning('Developer tools are not allowed during the test!');
            return false;
        }

        // Disable Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J (Developer Tools)
        if (e.ctrlKey && e.shiftKey && ['I', 'C', 'J'].includes(e.key.toUpperCase())) {
            e.preventDefault();
            showAntiCheatWarning('Developer tools are not allowed during the test!');
            return false;
        }
    });

    // Detect tab switch or window blur
    let blurWarningShown = false;
    window.addEventListener('blur', function() {
        if (!blurWarningShown && (timer !== null)) { // Only during active tests
            tabSwitchCount++;
            showAntiCheatWarning(`Warning ${tabSwitchCount}: Please stay on the test page! Tab switching detected.`);
            blurWarningShown = true;
            
            // Reset warning after 3 seconds
            setTimeout(() => {
                blurWarningShown = false;
            }, 3000);
        }
    });

    // Disable print functionality
    window.addEventListener('beforeprint', function(e) {
        e.preventDefault();
        showAntiCheatWarning('Printing is not allowed during the test!');
        return false;
    });
}

function showAntiCheatWarning(message) {
    // Create warning overlay
    const warningDiv = document.createElement('div');
    warningDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        font-weight: 600;
        max-width: 300px;
    `;
    warningDiv.textContent = message;
    document.body.appendChild(warningDiv);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (document.body.contains(warningDiv)) {
            document.body.removeChild(warningDiv);
        }
    }, 3000);
}

// Subject ordering function
function sortQuestionsBySubject(questions) {
    const subjectOrder = ['Mathematics', 'Physics', 'Chemistry'];
    
    return questions.sort((a, b) => {
        const subjectA = subjectOrder.indexOf(a.subject);
        const subjectB = subjectOrder.indexOf(b.subject);
        
        if (subjectA !== subjectB) {
            return subjectA - subjectB;
        }
        
        // If same subject, maintain original order or random order
        return 0;
    });
}

function showLoading() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.classList.add('show');
    }
}

function hideLoading() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.classList.remove('show');
    }
}

function navigateToTest(type) {
    testType = type;
    
    switch(type) {
        case 'session':
            window.location.href = 'session-test.html';
            break;
        case 'practice':
            window.location.href = 'practice-test.html';
            break;
        case 'topic':
            window.location.href = 'topic-test.html';
            break;
    }
}

function goHome() {
    window.location.href = 'index.html';
}

// Session Test Functions
function initializeSessionTest() {
    if (typeof sessionQuestions2025 === 'undefined') {
        console.error('Session questions not loaded');
        return;
    }
    
    populateSessionSelection();
}

function populateSessionSelection() {
    const sessionsGrid = document.getElementById('sessionsGrid');
    if (!sessionsGrid) return;
    
    // Get unique sessions from questions
    const sessions = [...new Set(sessionQuestions2025.map(q => q.session))].sort((a, b) => a - b);
    
    sessionsGrid.innerHTML = '';
    
    sessions.forEach(session => {
        const sessionQuestions = sessionQuestions2025.filter(q => q.session === session);
        const sessionCard = createSessionCard(session, sessionQuestions.length);
        sessionsGrid.appendChild(sessionCard);
    });
}

function createSessionCard(sessionNumber, questionCount) {
    const card = document.createElement('div');
    card.className = 'session-card';
    card.innerHTML = `
        <h3>Session ${sessionNumber}</h3>
        <p>${questionCount} Questions</p>
        <p>Mathematics, Physics, Chemistry</p>
        <p class="time-info">Time: 3 hours</p>
    `;
    
    card.addEventListener('click', () => startSessionTest(sessionNumber));
    return card;
}

function startSessionTest(sessionNumber) {
    let sessionQuestions = sessionQuestions2025.filter(q => q.session === sessionNumber);
    
    // Sort questions by subject order (Math -> Physics -> Chemistry)
    currentQuestions = sortQuestionsBySubject(sessionQuestions);
    currentQuestionIndex = 0;
    userAnswers = {};
    
    // Reset timer for 3 hours
    timeRemaining = testDuration;
    
    // Hide session selection and show test area
    document.getElementById('sessionSelection').style.display = 'none';
    document.getElementById('testWithPalette').style.display = 'flex';
    
    document.getElementById('sessionTitle').textContent = `Session ${sessionNumber} Test`;
    document.getElementById('totalQuestions').textContent = currentQuestions.length;
    
    startCountdownTimer('timer');
    displayQuestion();
    renderQuestionPalette();
}

// Practice Test Functions
function initializePracticeTest() {
    if (typeof practiceQuestions2024 === 'undefined') {
        console.error('Practice questions not loaded');
        return;
    }
    
    populateTopicSelection();
}

function populateTopicSelection() {
    const topicsGrid = document.getElementById('topicsGrid');
    if (!topicsGrid) return;
    
    // Get unique topics from questions
    const topics = [...new Set(practiceQuestions2024.map(q => q.topic))];
    
    topicsGrid.innerHTML = '';
    
    topics.forEach(topic => {
        const topicQuestions = practiceQuestions2024.filter(q => q.topic === topic);
        const topicCard = createTopicCard(topic, topicQuestions);
        topicsGrid.appendChild(topicCard);
    });
}

function createTopicCard(topic, questions) {
    const card = document.createElement('div');
    card.className = 'topic-card';
    
    const subjects = [...new Set(questions.map(q => q.subject))];
    
    card.innerHTML = `
        <h3>${topic}</h3>
        <div class="topic-meta">
            <span class="subject-badge">${subjects[0]}</span>
            <span class="question-count">${questions.length} Questions</span>
        </div>
    `;
    
    card.addEventListener('click', () => startPracticeTest(topic));
    return card;
}

function startPracticeTest(topic) {
    let topicQuestions = practiceQuestions2024.filter(q => q.topic === topic);
    
    // Sort questions by subject order
    currentQuestions = sortQuestionsBySubject(topicQuestions);
    currentQuestionIndex = 0;
    userAnswers = {};
    
    document.getElementById('topicSelection').classList.add('hidden');
    document.getElementById('practiceArea').classList.remove('hidden');
    
    document.getElementById('topicTitle').textContent = `${topic} Practice`;
    document.getElementById('totalPracticeQuestions').textContent = currentQuestions.length;
    
    displayPracticeQuestion();
}

// Topic-wise Test Functions
function initializeTopicWiseTest() {
    if (typeof practiceQuestions2023 === 'undefined') {
        console.error('Topic-wise questions not loaded');
        return;
    }
    
    populateTopicWiseSelection();
}

function populateTopicWiseSelection() {
    const subjects = ['Mathematics', 'Physics', 'Chemistry'];
    
    subjects.forEach(subject => {
        const container = document.getElementById(`${subject.toLowerCase()}Topics`);
        if (!container) return;
        
        const topics = [...new Set(practiceQuestions2023
            .filter(q => q.subject === subject)
            .map(q => q.topic))];
        
        container.innerHTML = '';
        
        topics.forEach(topic => {
            const checkbox = createTopicCheckbox(topic, subject);
            container.appendChild(checkbox);
        });
    });
}

function createTopicCheckbox(topic, subject) {
    const div = document.createElement('div');
    div.className = 'topic-checkbox';
    
    const questionCount = practiceQuestions2023.filter(q => q.topic === topic && q.subject === subject).length;
    
    div.innerHTML = `
        <input type="checkbox" id="${topic}" value="${topic}" data-subject="${subject}">
        <label for="${topic}">${topic} (${questionCount})</label>
    `;
    
    return div;
}

function selectAllTopics() {
    const checkboxes = document.querySelectorAll('.topic-checkbox input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

function clearAllTopics() {
    const checkboxes = document.querySelectorAll('.topic-checkbox input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

function startTopicWiseTest() {
    const selectedCheckboxes = document.querySelectorAll('.topic-checkbox input[type="checkbox"]:checked');
    
    if (selectedCheckboxes.length === 0) {
        alert('Please select at least one topic.');
        return;
    }
    
    selectedTopics = Array.from(selectedCheckboxes).map(cb => ({
        topic: cb.value,
        subject: cb.getAttribute('data-subject')
    }));
    
    // Get questions for selected topics with subject limits
    let mathQuestions = [];
    let physicsQuestions = [];
    let chemistryQuestions = [];
    
    selectedTopics.forEach(selection => {
        const topicQuestions = practiceQuestions2023.filter(q => 
            q.topic === selection.topic && q.subject === selection.subject
        );
        
        // Shuffle questions for randomness
        const shuffledQuestions = topicQuestions.sort(() => 0.5 - Math.random());
        
        // Distribute to subject arrays
        if (selection.subject === 'Mathematics') {
            mathQuestions.push(...shuffledQuestions);
        } else if (selection.subject === 'Physics') {
            physicsQuestions.push(...shuffledQuestions);
        } else if (selection.subject === 'Chemistry') {
            chemistryQuestions.push(...shuffledQuestions);
        }
    });
    
    // Limit each subject to maximum 25 questions
    mathQuestions = mathQuestions.slice(0, 25);
    physicsQuestions = physicsQuestions.slice(0, 25);
    chemistryQuestions = chemistryQuestions.slice(0, 25);
    
    // Combine all questions in subject order (Math -> Physics -> Chemistry)
    currentQuestions = [...mathQuestions, ...physicsQuestions, ...chemistryQuestions];
    
    currentQuestionIndex = 0;
    userAnswers = {};
    
    // Reset timer for 3 hours
    timeRemaining = testDuration;
    
    // Hide topic selection and show test area
    document.getElementById('topicWiseSelection').style.display = 'none';
    document.getElementById('topicTestWithPalette').style.display = 'flex';
    
    document.getElementById('topicTestTitle').textContent = 'Topic-wise Test';
    document.getElementById('totalTopicQuestions').textContent = currentQuestions.length;
    
    startCountdownTimer('topicTimer');
    displayTopicQuestion();
    renderTopicQuestionPalette();
}

// Question Palette Functions
function renderQuestionPalette() {
    const palette = document.getElementById('questionPalette');
    if (!palette) return;

    palette.innerHTML = '<h4>Questions</h4>';
    
    let currentSubject = '';
    
    currentQuestions.forEach((q, index) => {
        // Add subject divider
        if (q.subject !== currentSubject) {
            currentSubject = q.subject;
            const divider = document.createElement('div');
            divider.className = 'subject-divider';
            divider.textContent = currentSubject;
            palette.appendChild(divider);
        }
        
        const btn = document.createElement('button');
        btn.textContent = index + 1;
        btn.setAttribute('data-index', index);
        btn.className = 'palette-question-btn';

        // Mark current question
        if (index === currentQuestionIndex) btn.classList.add('current');

        // Mark answered or not
        const answer = userAnswers[index];
        if (answer !== undefined && answer !== '') {
            btn.classList.add('answered');
        } else {
            btn.classList.add('unanswered');
        }

        btn.addEventListener('click', () => {
            currentQuestionIndex = index;
            displayQuestion();
        });

        palette.appendChild(btn);
    });
}

function renderTopicQuestionPalette() {
    const palette = document.getElementById('topicQuestionPalette');
    if (!palette) return;

    palette.innerHTML = '<h4>Questions</h4>';
    
    let currentSubject = '';

    currentQuestions.forEach((q, index) => {
        // Add subject divider
        if (q.subject !== currentSubject) {
            currentSubject = q.subject;
            const divider = document.createElement('div');
            divider.className = 'subject-divider';
            divider.textContent = currentSubject;
            palette.appendChild(divider);
        }
        
        const btn = document.createElement('button');
        btn.textContent = index + 1;
        btn.setAttribute('data-index', index);
        btn.className = 'palette-question-btn';

        // Mark current question
        if (index === currentQuestionIndex) btn.classList.add('current');

        // Mark answered or not
        const answer = userAnswers[index];
        if (answer !== undefined && answer !== '') {
            btn.classList.add('answered');
        } else {
            btn.classList.add('unanswered');
        }

        btn.addEventListener('click', () => {
            currentQuestionIndex = index;
            displayTopicQuestion();
        });

        palette.appendChild(btn);
    });
}

// Question Display Functions
function displayQuestion() {
    if (!currentQuestions || currentQuestions.length === 0) return;
    
    const question = currentQuestions[currentQuestionIndex];
    
    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('questionType').textContent = question.questionType || 'MCQ';
    document.getElementById('subjectTag').textContent = question.subject;
    document.getElementById('questionContent').innerHTML = question.question;
    
    // Handle question image
    const questionImage = document.getElementById('questionImage');
    if (question.imageUrl) {
        questionImage.innerHTML = `<img src="${question.imageUrl}" alt="Question Image">`;
        questionImage.classList.remove('hidden');
    } else {
        questionImage.classList.add('hidden');
    }
    
    // Display options or numerical input
    if (question.questionType === 'MCQ') {
        displayMCQOptions(question);
        document.getElementById('numericalInput').classList.add('hidden');
    } else {
        displayNumericalInput();
        document.getElementById('optionsContainer').innerHTML = '';
    }
    
    updateNavigationButtons();
    renderQuestionPalette();
}

function displayMCQOptions(question) {
    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';
    
    if (!question.options) return;
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.setAttribute('data-option', String.fromCharCode(65 + index));
        
        optionDiv.innerHTML = `
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span class="option-text">${option}</span>
        `;
        
        optionDiv.addEventListener('click', () => selectOption(optionDiv));
        container.appendChild(optionDiv);
    });
    
    // Restore previous selection
    const previousAnswer = userAnswers[currentQuestionIndex];
    if (previousAnswer) {
        const selectedOption = container.querySelector(`[data-option="${previousAnswer}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }
}

function displayNumericalInput() {
    document.getElementById('numericalInput').classList.remove('hidden');
    const input = document.getElementById('numericalAnswer');
    input.value = userAnswers[currentQuestionIndex] || '';
    
    input.addEventListener('input', function() {
        userAnswers[currentQuestionIndex] = this.value;
        renderQuestionPalette(); // Update palette when answer changes
    });
}

function selectOption(optionElement) {
    // Remove previous selection
    const container = optionElement.parentNode;
    container.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
    
    // Add selection to clicked option
    optionElement.classList.add('selected');
    
    // Store answer
    userAnswers[currentQuestionIndex] = optionElement.getAttribute('data-option');
    
    // Update palette
    renderQuestionPalette();
}

function displayPracticeQuestion() {
    if (!currentQuestions || currentQuestions.length === 0) return;
    
    const question = currentQuestions[currentQuestionIndex];
    
    document.getElementById('currentPracticeQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('practiceQuestionType').textContent = question.questionType || 'MCQ';
    document.getElementById('practiceSubjectTag').textContent = question.subject;
    document.getElementById('practiceQuestionContent').innerHTML = question.question;
    
    // Handle question image
    const questionImage = document.getElementById('practiceQuestionImage');
    if (question.imageUrl) {
        questionImage.innerHTML = `<img src="${question.imageUrl}" alt="Question Image">`;
        questionImage.classList.remove('hidden');
    } else {
        questionImage.classList.add('hidden');
    }
    
    // Display options or numerical input
    if (question.questionType === 'MCQ') {
        displayPracticeMCQOptions(question);
        document.getElementById('practiceNumericalInput').classList.add('hidden');
    } else {
        displayPracticeNumericalInput();
        document.getElementById('practiceOptionsContainer').innerHTML = '';
    }
    
    // Hide solution initially
    document.getElementById('solutionContainer').classList.add('hidden');
    
    updatePracticeNavigationButtons();
}

function displayPracticeMCQOptions(question) {
    const container = document.getElementById('practiceOptionsContainer');
    container.innerHTML = '';
    
    if (!question.options) return;
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.setAttribute('data-option', String.fromCharCode(65 + index));
        
        optionDiv.innerHTML = `
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span class="option-text">${option}</span>
        `;
        
        optionDiv.addEventListener('click', () => selectPracticeOption(optionDiv));
        container.appendChild(optionDiv);
    });
    
    // Restore previous selection
    const previousAnswer = userAnswers[currentQuestionIndex];
    if (previousAnswer) {
        const selectedOption = container.querySelector(`[data-option="${previousAnswer}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }
}

function displayPracticeNumericalInput() {
    document.getElementById('practiceNumericalInput').classList.remove('hidden');
    const input = document.getElementById('practiceNumericalAnswer');
    input.value = userAnswers[currentQuestionIndex] || '';
    
    input.addEventListener('input', function() {
        userAnswers[currentQuestionIndex] = this.value;
    });
}

function selectPracticeOption(optionElement) {
    // Remove previous selection
    const container = optionElement.parentNode;
    container.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
    
    // Add selection to clicked option
    optionElement.classList.add('selected');
    
    // Store answer
    userAnswers[currentQuestionIndex] = optionElement.getAttribute('data-option');
}

function displayTopicQuestion() {
    if (!currentQuestions || currentQuestions.length === 0) return;
    
    const question = currentQuestions[currentQuestionIndex];
    
    document.getElementById('currentTopicQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('topicQuestionType').textContent = question.questionType || 'MCQ';
    document.getElementById('topicSubjectTag').textContent = question.subject;
    document.getElementById('topicQuestionContent').innerHTML = question.question;
    
    // Handle question image
    const questionImage = document.getElementById('topicQuestionImage');
    if (question.imageUrl) {
        questionImage.innerHTML = `<img src="${question.imageUrl}" alt="Question Image">`;
        questionImage.classList.remove('hidden');
    } else {
        questionImage.classList.add('hidden');
    }
    
    // Display options or numerical input
    if (question.questionType === 'MCQ') {
        displayTopicMCQOptions(question);
        document.getElementById('topicNumericalInput').classList.add('hidden');
    } else {
        displayTopicNumericalInput();
        document.getElementById('topicOptionsContainer').innerHTML = '';
    }
    
    updateTopicNavigationButtons();
    renderTopicQuestionPalette();
}

function displayTopicMCQOptions(question) {
    const container = document.getElementById('topicOptionsContainer');
    container.innerHTML = '';
    
    if (!question.options) return;
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.setAttribute('data-option', String.fromCharCode(65 + index));
        
        optionDiv.innerHTML = `
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span class="option-text">${option}</span>
        `;
        
        optionDiv.addEventListener('click', () => selectTopicOption(optionDiv));
        container.appendChild(optionDiv);
    });
    
    // Restore previous selection
    const previousAnswer = userAnswers[currentQuestionIndex];
    if (previousAnswer) {
        const selectedOption = container.querySelector(`[data-option="${previousAnswer}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }
}

function displayTopicNumericalInput() {
    document.getElementById('topicNumericalInput').classList.remove('hidden');
    const input = document.getElementById('topicNumericalAnswer');
    input.value = userAnswers[currentQuestionIndex] || '';
    
    input.addEventListener('input', function() {
        userAnswers[currentQuestionIndex] = this.value;
        renderTopicQuestionPalette(); // Update palette when answer changes
    });
}

function selectTopicOption(optionElement) {
    // Remove previous selection
    const container = optionElement.parentNode;
    container.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
    
    // Add selection to clicked option
    optionElement.classList.add('selected');
    
    // Store answer
    userAnswers[currentQuestionIndex] = optionElement.getAttribute('data-option');
    
    // Update palette
    renderTopicQuestionPalette();
}

// Navigation Functions
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

function previousPracticeQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayPracticeQuestion();
    }
}

function nextPracticeQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayPracticeQuestion();
    }
}

function previousTopicQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayTopicQuestion();
    }
}

function nextTopicQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayTopicQuestion();
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;
    if (nextBtn) nextBtn.disabled = currentQuestionIndex === currentQuestions.length - 1;
    if (submitBtn) submitBtn.style.display = currentQuestionIndex === currentQuestions.length - 1 ? 'block' : 'none';
}

function updatePracticeNavigationButtons() {
    const prevBtn = document.getElementById('practicePrevBtn');
    const nextBtn = document.getElementById('practiceNextBtn');
    
    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;
    if (nextBtn) nextBtn.disabled = currentQuestionIndex === currentQuestions.length - 1;
}

function updateTopicNavigationButtons() {
    const prevBtn = document.getElementById('topicPrevBtn');
    const nextBtn = document.getElementById('topicNextBtn');
    const submitBtn = document.getElementById('topicSubmitBtn');
    
    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;
    if (nextBtn) nextBtn.disabled = currentQuestionIndex === currentQuestions.length - 1;
    if (submitBtn) submitBtn.style.display = currentQuestionIndex === currentQuestions.length - 1 ? 'block' : 'none';
}

// Practice Test Solution Functions
function showAnswer() {
    const question = currentQuestions[currentQuestionIndex];
    const solutionContainer = document.getElementById('solutionContainer');
    
    // Show correct answer
    const correctAnswerDisplay = document.getElementById('correctAnswerDisplay');
    correctAnswerDisplay.textContent = `Correct Answer: ${question.correctAnswer}`;
    
    // Show solution if available
    const solutionContent = document.getElementById('solutionContent');
    solutionContent.innerHTML = question.solution || 'Solution not available for this question.';
    
    // Highlight correct and incorrect options
    const options = document.querySelectorAll('#practiceOptionsContainer .option');
    options.forEach(option => {
        const optionLetter = option.getAttribute('data-option');
        if (optionLetter === question.correctAnswer) {
            option.classList.add('correct');
        } else if (option.classList.contains('selected')) {
            option.classList.add('incorrect');
        }
    });
    
    solutionContainer.classList.remove('hidden');
}

// Updated Timer Functions - Countdown Timer
function startCountdownTimer(timerElementId) {
    startTime = Date.now();
    timeRemaining = testDuration; // Reset to 3 hours
    
    timer = setInterval(() => updateCountdownTimer(timerElementId), 1000);
    updateCountdownTimer(timerElementId); // Update immediately
}

function updateCountdownTimer(timerElementId) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    timeRemaining = testDuration - elapsed;
    
    // If time is up, auto-submit test
    if (timeRemaining <= 0) {
        timeRemaining = 0;
        stopTimer();
        alert('Time is up! The test will be submitted automatically.');
        
        // Auto-submit based on test type
        if (timerElementId === 'timer') {
            submitTest();
        } else if (timerElementId === 'topicTimer') {
            submitTopicTest();
        }
        return;
    }
    
    // Calculate hours, minutes, and seconds remaining
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    const timerElement = document.getElementById(timerElementId);
    if (timerElement) {
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timerElement.textContent = `Time Left: ${timeString}`;
        
        // Change color when less than 30 minutes remaining
        if (timeRemaining <= 1800) { // 30 minutes
            timerElement.style.backgroundColor = '#dc3545';
            timerElement.style.color = 'white';
        } else if (timeRemaining <= 3600) { // 1 hour
            timerElement.style.backgroundColor = '#ffc107';
            timerElement.style.color = '#333';
        }
    }
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

// Test Submission Functions
function submitTest() {
    if (confirm('Are you sure you want to submit the test? You cannot change answers after submission.')) {
        stopTimer();
        calculateResults();
        showResults();
    }
}

function submitTopicTest() {
    if (confirm('Are you sure you want to submit the test? You cannot change answers after submission.')) {
        stopTimer();
        calculateTopicResults();
        showTopicResults();
    }
}

function calculateResults() {
    let correct = 0;
    let attempted = 0;
    
    currentQuestions.forEach((question, index) => {
        if (userAnswers[index] !== undefined && userAnswers[index] !== '') {
            attempted++;
            if (userAnswers[index] === question.correctAnswer) {
                correct++;
            }
        }
    });
    
    const percentage = attempted > 0 ? (correct / attempted) * 100 : 0;
    const timeSpent = testDuration - timeRemaining;
    
    return {
        correct,
        attempted,
        total: currentQuestions.length,
        percentage: percentage.toFixed(2),
        timeSpent: timeSpent,
        tabSwitches: tabSwitchCount
    };
}

function calculateTopicResults() {
    let correct = 0;
    let attempted = 0;
    
    currentQuestions.forEach((question, index) => {
        if (userAnswers[index] !== undefined && userAnswers[index] !== '') {
            attempted++;
            if (userAnswers[index] === question.correctAnswer) {
                correct++;
            }
        }
    });
    
    const percentage = attempted > 0 ? (correct / attempted) * 100 : 0;
    const timeSpent = testDuration - timeRemaining;
    
    return {
        correct,
        attempted,
        total: currentQuestions.length,
        percentage: percentage.toFixed(2),
        timeSpent: timeSpent,
        tabSwitches: tabSwitchCount
    };
}

function showResults() {
    const results = calculateResults();
    
    document.getElementById('testWithPalette').style.display = 'none';
    document.getElementById('resultArea').classList.remove('hidden');
    
    const resultSummary = document.getElementById('resultSummary');
    resultSummary.innerHTML = `
        <div class="result-item">
            <span class="result-label">Total Questions:</span>
            <span class="result-value">${results.total}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Attempted:</span>
            <span class="result-value">${results.attempted}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Correct Answers:</span>
            <span class="result-value score">${results.correct}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Accuracy:</span>
            <span class="result-value percentage">${results.percentage}%</span>
        </div>
        <div class="result-item">
            <span class="result-label">Time Spent:</span>
            <span class="result-value">${formatTimeSpent(results.timeSpent)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Tab Switches:</span>
            <span class="result-value" style="color: ${results.tabSwitches > 0 ? '#dc3545' : '#28a745'}">${results.tabSwitches}</span>
        </div>
    `;
}

function showTopicResults() {
    const results = calculateTopicResults();
    
    document.getElementById('topicTestWithPalette').style.display = 'none';
    document.getElementById('topicResultArea').classList.remove('hidden');
    
    const resultSummary = document.getElementById('topicResultSummary');
    resultSummary.innerHTML = `
        <div class="result-item">
            <span class="result-label">Total Questions:</span>
            <span class="result-value">${results.total}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Attempted:</span>
            <span class="result-value">${results.attempted}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Correct Answers:</span>
            <span class="result-value score">${results.correct}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Accuracy:</span>
            <span class="result-value percentage">${results.percentage}%</span>
        </div>
        <div class="result-item">
            <span class="result-label">Time Spent:</span>
            <span class="result-value">${formatTimeSpent(results.timeSpent)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Tab Switches:</span>
            <span class="result-value" style="color: ${results.tabSwitches > 0 ? '#dc3545' : '#28a745'}">${results.tabSwitches}</span>
        </div>
    `;
}

function retakeTest() {
    window.location.reload();
}

function retakeTopicTest() {
    window.location.reload();
}

// Page-specific initialization
window.addEventListener('load', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'session-test.html':
            initializeSessionTest();
            break;
        case 'practice-test.html':
            initializePracticeTest();
            break;
        case 'topic-test.html':
            initializeTopicWiseTest();
            break;
    }
});

// Utility Functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatTimeSpent(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Export functions for global access
window.goHome = goHome;
window.previousQuestion = previousQuestion;
window.nextQuestion = nextQuestion;
window.previousPracticeQuestion = previousPracticeQuestion;
window.nextPracticeQuestion = nextPracticeQuestion;
window.previousTopicQuestion = previousTopicQuestion;
window.nextTopicQuestion = nextTopicQuestion;
window.submitTest = submitTest;
window.submitTopicTest = submitTopicTest;
window.showAnswer = showAnswer;
window.retakeTest = retakeTest;
window.retakeTopicTest = retakeTopicTest;
window.selectAllTopics = selectAllTopics;
window.clearAllTopics = clearAllTopics;
window.startTopicWiseTest = startTopicWiseTest;
