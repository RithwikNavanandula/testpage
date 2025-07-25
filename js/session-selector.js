// Assume sessionQuestions2025 is loaded from questions2025.js

// Extract unique sessions
const uniqueSessions = [...new Set(sessionQuestions2025.map(q => q.session))].sort((a, b) => a - b);

// Populate dropdown
const select = document.getElementById('session-select');
uniqueSessions.forEach(session => {
    const option = document.createElement('option');
    option.value = session;
    option.textContent = `Session ${session}`;
    select.appendChild(option);
});

// Enable start button on selection
select.addEventListener('change', () => {
    document.getElementById('start-test-btn').disabled = false;
});

// Start test button
document.getElementById('start-test-btn').addEventListener('click', () => {
    const selectedSession = select.value;
    if (selectedSession) {
        // Filter questions for selected session
        const sessionQuestions = sessionQuestions2025.filter(q => q.session == selectedSession);
        
        // Store in localStorage or pass to test page
        localStorage.setItem('currentTestQuestions', JSON.stringify(sessionQuestions));
        localStorage.setItem('testType', 'session'); // To identify it's a session test
        
        // Redirect to test page (assume it's session-test.html or similar from your code)
        window.location.href = 'session-test.html';
    }
});
