document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('report-content');
    const btnVision = document.getElementById('btn-report-vision');
    const btnLazy = document.getElementById('btn-report-lazy');
    const searchInput = document.getElementById('patient-search');
    const searchBtn = document.getElementById('btn-search');
    const searchResults = document.getElementById('search-results');
    
    if (!container || !btnVision || !btnLazy) return;

    let currentView = 'latest'; // 'latest', 'search', 'specific'

    function setActive(button) {
        [btnVision, btnLazy].forEach(b => b.classList.remove('primary'));
        if (button) button.classList.add('primary');
    }

    function displayVisionReport(latest, title = 'Vision Test') {
        const when = latest.when ? new Date(latest.when) : new Date();

        const rightLog = Number(latest.rightLogmar ?? NaN);
        const leftLog = Number(latest.leftLogmar ?? NaN);

        const rightOverall = Number.isFinite(rightLog)
            ? (rightLog <= 0.1 ? 'Normal' : rightLog <= 0.3 ? 'Mild Amblyopia' : 'Moderate Amblyopia')
            : 'N/A';
        const leftOverall = Number.isFinite(leftLog)
            ? (leftLog <= 0.1 ? 'Normal' : leftLog <= 0.3 ? 'Mild Amblyopia' : 'Moderate Amblyopia')
            : 'N/A';

        const weakerEye =
            Number.isFinite(rightLog) && Number.isFinite(leftLog)
                ? (rightLog > leftLog ? 'Right eye' : leftLog > rightLog ? 'Left eye' : 'Both eyes similar')
                : '—';

        const diff =
            Number.isFinite(rightLog) && Number.isFinite(leftLog)
                ? Math.abs(rightLog - leftLog) * 100
                : null;

        let summaryText = '';
        if (!Number.isFinite(rightLog) || !Number.isFinite(leftLog)) {
            summaryText = 'Vision test summary available, but detailed values are incomplete.';
        } else if (Math.abs(rightLog - leftLog) < 0.1) {
            summaryText =
                'Both eyes show similar visual acuity. Continue regular eye exercises to maintain good vision.';
        } else {
            const strongerEye = rightLog > leftLog ? 'Left eye' : 'Right eye';
            summaryText = `${weakerEye} is approximately ${diff.toFixed(
                0
            )}% weaker than the ${strongerEye}. Training games can be focused on the weaker eye to improve its strength.`;
        }

        const dateStr = when.toISOString().split('T')[0];
        const timeStr = when.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const patientName = latest.patientName ? ` - ${latest.patientName}` : '';
        const patientAge = latest.patientAge ? ` (Age: ${latest.patientAge})` : '';

        container.innerHTML = `
            <div class="vt-result" style="margin:0;">
                <div class="result-summary">${summaryText}</div>
                <div class="results-table-container">
                    <h3>${title}${patientName}${patientAge}</h3>
                    <div class="test-info">
                        <span>Date: ${dateStr}</span>
                        <span>Time: ${timeStr}</span>
                    </div>
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th>Right Eye</th>
                                <th>Left Eye</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Visual Acuity</td>
                                <td>${latest.rightEye ?? '-'}</td>
                                <td>${latest.leftEye ?? '-'}</td>
                            </tr>
                            <tr>
                                <td>Visual Acuity (LogMAR)</td>
                                <td>${Number.isFinite(rightLog) ? rightLog.toFixed(1) : '-'}</td>
                                <td>${Number.isFinite(leftLog) ? leftLog.toFixed(1) : '-'}</td>
                            </tr>
                            <tr class="overall-result">
                                <td><strong>Overall Result</strong></td>
                                <td>${rightOverall}</td>
                                <td>${leftOverall}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    async function loadVisionReport() {
        container.style.display = 'block';
        container.innerHTML = '<p>Loading your latest vision test…</p>';
        try {
            if (window.VisionDB && typeof window.VisionDB.initFirebase === 'function') {
                window.VisionDB.initFirebase();
            }

            const latest = await window.VisionDB?.getLatestVisionResult();
            if (!latest) {
                container.innerHTML =
                    '<p>No vision tests found yet. Please complete a vision test first.</p>';
                return;
            }

            displayVisionReport(latest, 'Latest Vision Test');
        } catch (e) {
            console.error('Error loading latest vision result:', e);
            container.innerHTML =
                '<p>Could not load vision test results. Please try running a new vision test.</p>';
        }
    }

    async function searchByPatientName(patientName) {
        if (!patientName || patientName.trim() === '') {
            searchResults.style.display = 'none';
            return;
        }

        searchResults.style.display = 'block';
        searchResults.innerHTML = '<p>Searching...</p>';

        try {
            if (window.VisionDB && typeof window.VisionDB.initFirebase === 'function') {
                window.VisionDB.initFirebase();
            }

            const results = await window.VisionDB?.getVisionResultsByPatientName(patientName.trim());
            
            console.log('Search results:', results);
            
            if (!results || results.length === 0) {
                searchResults.innerHTML = `
                    <div class="search-message">
                        <p>No tests found for patient: <strong>${patientName}</strong></p>
                        <p style="margin-top: 10px; font-size: 14px; color: var(--text-muted);">
                            Make sure the patient name was entered when taking the test. 
                            If tests were taken before adding name/age, they may not be searchable.
                        </p>
                    </div>
                `;
                container.innerHTML = '<p>Search for a patient name above or view your latest test result.</p>';
                return;
            }

            // Display list of test dates
            const resultsList = results.map((result, index) => {
                const when = result.when ? new Date(result.when) : new Date();
                const dateStr = when.toISOString().split('T')[0];
                const timeStr = when.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const resultId = result.id || `local-${index}`;
                
                return `
                    <div class="test-date-item" data-result-index="${index}">
                        <div class="test-date-info">
                            <span class="test-date">${dateStr}</span>
                            <span class="test-time">${timeStr}</span>
                        </div>
                        <button class="btn-view-report" data-result-index="${index}">
                            View Report
                        </button>
                    </div>
                `;
            }).join('');

            searchResults.innerHTML = `
                <div class="search-header">
                    <h3>Found ${results.length} test${results.length > 1 ? 's' : ''} for: <strong>${patientName}</strong></h3>
                    ${results.length > 1 ? `<button id="btn-show-graph" class="btn btn-primary" style="margin-top: 15px;">Show Progress Graph</button>` : ''}
                </div>
                <div class="test-dates-list">
                    ${resultsList}
                </div>
            `;

            // Store results globally for access by viewSpecificReport
            window.currentSearchResults = results;
            window.currentPatientName = patientName;

            // Add click handlers to view report buttons
            setTimeout(() => {
                document.querySelectorAll('.btn-view-report').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const index = parseInt(this.getAttribute('data-result-index'));
                        viewSpecificReport(index);
                    });
                });
                
                // Add graph button handler if multiple results
                const graphBtn = document.getElementById('btn-show-graph');
                if (graphBtn && results.length > 1) {
                    graphBtn.addEventListener('click', () => {
                        displayVisionGraph(results, patientName);
                    });
                }
            }, 0);

            // Show report toggle and clear data buttons after search
            const reportToggle = document.getElementById('report-toggle');
            const clearDataContainer = document.getElementById('clear-data-container');
            if (reportToggle) reportToggle.style.display = 'flex';
            if (clearDataContainer) clearDataContainer.style.display = 'block';
            
            // Hide report container until a date is clicked
            container.style.display = 'none';
            container.innerHTML = '<p>Click on a test date above to view the report, or click "Show Progress Graph" to see all results over time.</p>';

        } catch (e) {
            console.error('Error searching for patient:', e);
            searchResults.innerHTML = `
                <div class="search-message error">
                    <p>Error searching for patient. Please try again.</p>
                </div>
            `;
            container.style.display = 'none';
        }
    }

    // Make viewSpecificReport available globally
    window.viewSpecificReport = function(index) {
        if (!window.currentSearchResults || !window.currentSearchResults[index]) {
            console.error('Report not found');
            return;
        }

        const result = window.currentSearchResults[index];
        const patientName = result.patientName || 'Unknown';
        container.style.display = 'block';
        displayVisionReport(result, `Vision Test Report - ${patientName}`);
        
        // Scroll to report
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Display vision test progress graph
    function displayVisionGraph(results, patientName) {
        // Sort results by date
        const sortedResults = [...results].sort((a, b) => {
            const dateA = new Date(a.when || 0);
            const dateB = new Date(b.when || 0);
            return dateA - dateB;
        });

        // Prepare data for chart
        const labels = sortedResults.map(r => {
            const date = new Date(r.when || Date.now());
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const rightLogmarData = sortedResults.map(r => {
            const val = Number(r.rightLogmar);
            return Number.isFinite(val) ? val : null;
        });

        const leftLogmarData = sortedResults.map(r => {
            const val = Number(r.leftLogmar);
            return Number.isFinite(val) ? val : null;
        });

        // Calculate average LogMAR (lower is better)
        const avgLogmarData = sortedResults.map(r => {
            const right = Number(r.rightLogmar);
            const left = Number(r.leftLogmar);
            if (Number.isFinite(right) && Number.isFinite(left)) {
                return (right + left) / 2;
            }
            return null;
        });

        // Destroy existing chart if it exists
        if (window.visionChartInstance) {
            window.visionChartInstance.destroy();
        }

        container.style.display = 'block';
        container.innerHTML = `
            <div class="vt-result" style="margin:0;">
                <div class="results-table-container">
                    <h3>Vision Test Progress - ${patientName}</h3>
                    <p style="margin-bottom: 20px; color: var(--text-muted);">
                        Lower LogMAR values indicate better vision. This graph shows your vision test results over time.
                    </p>
                    <canvas id="visionChart" style="max-height: 400px;"></canvas>
                    <div style="margin-top: 20px;">
                        <button class="btn btn-secondary" onclick="window.viewSpecificReport(0)">View Latest Report</button>
                    </div>
                </div>
            </div>
        `;

        const ctx = document.getElementById('visionChart').getContext('2d');
        window.visionChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Right Eye (LogMAR)',
                        data: rightLogmarData,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Left Eye (LogMAR)',
                        data: leftLogmarData,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Average (LogMAR)',
                        data: avgLogmarData,
                        borderColor: 'rgb(255, 205, 86)',
                        backgroundColor: 'rgba(255, 205, 86, 0.2)',
                        tension: 0.4,
                        fill: false,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Vision Test Results Over Time',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        reverse: false,
                        title: {
                            display: true,
                            text: 'LogMAR (Lower is Better)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Test Date'
                        }
                    }
                }
            }
        });

        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Display lazy eye progress graph
    async function displayLazyEyeGraph(patientName) {
        try {
            if (window.LazyDB && typeof window.LazyDB.initLazyFirebase === 'function') {
                window.LazyDB.initLazyFirebase();
            }

            const results = await window.LazyDB?.getLazySessionsByPatientName(patientName);
            
            if (!results || results.length === 0) {
                container.innerHTML = `
                    <div class="vt-result" style="margin:0;">
                        <p>No lazy eye sessions found for ${patientName}.</p>
                    </div>
                `;
                return;
            }

            // Sort by date
            const sortedResults = [...results].sort((a, b) => {
                const dateA = new Date(a.when || 0);
                const dateB = new Date(b.when || 0);
                return dateA - dateB;
            });

            const labels = sortedResults.map(r => {
                const date = new Date(r.when || Date.now());
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });

            const totalScores = sortedResults.map(r => {
                return typeof r.sessionTotal === 'number' ? r.sessionTotal : 0;
            });

            // Destroy existing chart if it exists
            if (window.lazyChartInstance) {
                window.lazyChartInstance.destroy();
            }

            container.style.display = 'block';
            container.innerHTML = `
                <div class="vt-result" style="margin:0;">
                    <div class="results-table-container">
                        <h3>Lazy Eye Game Progress - ${patientName}</h3>
                        <p style="margin-bottom: 20px; color: var(--text-muted);">
                            This graph shows your total scores across all lazy eye training sessions.
                        </p>
                        <canvas id="lazyChart" style="max-height: 400px;"></canvas>
                    </div>
                </div>
            `;

            const ctx = document.getElementById('lazyChart').getContext('2d');
            window.lazyChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Total Score',
                        data: totalScores,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Lazy Eye Training Scores Over Time',
                            font: { size: 16, weight: 'bold' }
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Total Score'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Session Date'
                            }
                        }
                    }
                }
            });

            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {
            console.error('Error loading lazy eye graph:', e);
            container.innerHTML = '<p>Error loading lazy eye progress graph.</p>';
        }
    }

    // Make displayLazyEyeGraph available globally
    window.displayLazyEyeGraph = displayLazyEyeGraph;

    async function loadLazyReport() {
        container.style.display = 'block';
        container.innerHTML = '<p>Loading your latest lazy eye session…</p>';
        try {
            if (window.LazyDB && typeof window.LazyDB.initLazyFirebase === 'function') {
                window.LazyDB.initLazyFirebase();
            }

            const latest = await window.LazyDB?.getLatestLazySession();
            if (!latest) {
                container.innerHTML =
                    '<p>No lazy eye sessions found yet. Please finish all games at least once.</p>';
                return;
            }

            const when = latest.when ? new Date(latest.when) : new Date();
            const games = Array.isArray(latest.games) ? latest.games : [];
            const sessionTotal = typeof latest.sessionTotal === 'number'
                ? latest.sessionTotal
                : games.reduce((sum, g) => sum + (typeof g.score === 'number' ? g.score : 0), 0);

            const dateStr = when.toISOString().split('T')[0];
            const timeStr = when.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const patientName = latest.patientName || 'Unknown';

            const rows = games.map(g => `
                <tr>
                    <td>Level ${g.level ?? '-'}</td>
                    <td>${g.gameName ?? '-'}</td>
                    <td>${typeof g.score === 'number' ? g.score : '-'}</td>
                </tr>
            `).join('');

            // Check if there are multiple sessions for this patient
            let graphButton = '';
            if (patientName && patientName !== 'Unknown') {
                try {
                    const allSessions = await window.LazyDB?.getLazySessionsByPatientName(patientName);
                    if (allSessions && allSessions.length > 1) {
                        const safeName = patientName.replace(/'/g, "\\'");
                        graphButton = `
                            <div style="margin-top: 20px;">
                                <button class="btn btn-primary" id="btn-lazy-graph" data-patient-name="${safeName}">
                                    Show Progress Graph (${allSessions.length} sessions)
                                </button>
                            </div>
                        `;
                    }
                } catch (e) {
                    console.warn('Could not check for multiple sessions:', e);
                }
            }

            container.innerHTML = `
                <div class="vt-result" style="margin:0;">
                    <div class="result-summary">
                        This report shows your most recent lazy eye training session.
                        Total score across all games: <strong>${sessionTotal}</strong>.
                    </div>
                    <div class="results-table-container">
                        <h3>Latest Lazy Eye Session${patientName && patientName !== 'Unknown' ? ` - ${patientName}` : ''}</h3>
                        <div class="test-info">
                            <span>Date: ${dateStr}</span>
                            <span>Time: ${timeStr}</span>
                        </div>
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Level</th>
                                    <th>Game</th>
                                    <th>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows || '<tr><td colspan="3">No game scores found.</td></tr>'}
                                <tr class="overall-result">
                                    <td colspan="2"><strong>Total Score</strong></td>
                                    <td><strong>${sessionTotal}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                        ${graphButton}
                    </div>
                </div>
            `;

            // Add event listener for lazy eye graph button
            setTimeout(() => {
                const lazyGraphBtn = document.getElementById('btn-lazy-graph');
                if (lazyGraphBtn) {
                    lazyGraphBtn.addEventListener('click', () => {
                        const patientName = lazyGraphBtn.getAttribute('data-patient-name');
                        displayLazyEyeGraph(patientName);
                    });
                }
            }, 0);
        } catch (e) {
            console.error('Error loading latest lazy-eye session:', e);
            container.innerHTML =
                '<p>Could not load lazy eye session results. Please finish all games at least once.</p>';
        }
    }

    // Search functionality
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', async () => {
            const patientName = searchInput.value.trim();
            if (patientName) {
                currentView = 'search';
                setActive(null);
                await searchByPatientName(patientName);
            }
        });

        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const patientName = searchInput.value.trim();
                if (patientName) {
                    currentView = 'search';
                    setActive(null);
                    await searchByPatientName(patientName);
                }
            }
        });
    }

    btnVision.addEventListener('click', () => {
        currentView = 'latest';
        setActive(btnVision);
        searchResults.style.display = 'none';
        container.style.display = 'block';
        loadVisionReport();
    });
    
    btnLazy.addEventListener('click', () => {
        currentView = 'latest';
        setActive(btnLazy);
        searchResults.style.display = 'none';
        container.style.display = 'block';
        loadLazyReport();
    });

    // Clear all data functionality
    const clearDataBtn = document.getElementById('btn-clear-data');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', async () => {
            // Show confirmation dialog
            const confirmed = confirm(
                '⚠️ WARNING: This will permanently delete ALL vision test data!\n\n' +
                'This action cannot be undone.\n\n' +
                'Are you sure you want to continue?'
            );
            
            if (!confirmed) {
                return;
            }
            
            // Double confirmation
            const doubleConfirm = confirm(
                'This will delete ALL test records from both local storage and Firebase.\n\n' +
                'Click OK to confirm deletion, or Cancel to abort.'
            );
            
            if (!doubleConfirm) {
                return;
            }
            
            // Disable button and show loading
            clearDataBtn.disabled = true;
            clearDataBtn.textContent = 'Clearing...';
            
            try {
                // Initialize both Firebase instances
                if (window.VisionDB && typeof window.VisionDB.initFirebase === 'function') {
                    window.VisionDB.initFirebase();
                }
                if (window.LazyDB && typeof window.LazyDB.initLazyFirebase === 'function') {
                    window.LazyDB.initLazyFirebase();
                }
                
                // Clear both vision test data and lazy eye session data
                const [visionResult, lazyResult] = await Promise.all([
                    window.VisionDB?.clearAllVisionResults(),
                    window.LazyDB?.clearAllLazySessions()
                ]);
                
                const visionOk = visionResult && visionResult.ok;
                const lazyOk = lazyResult && lazyResult.ok;
                
                if (visionOk && lazyOk) {
                    // Show success message
                    container.innerHTML = `
                        <div class="clear-success-message">
                            <h3>✅ All Data Cleared Successfully</h3>
                            <p>All vision test data and lazy eye session data have been deleted.</p>
                            <p style="margin-top: 10px; font-size: 14px; color: var(--text-muted);">
                                ✅ Vision tests: ${visionResult.message || 'Cleared'}
                            </p>
                            <p style="margin-top: 5px; font-size: 14px; color: var(--text-muted);">
                                ✅ Lazy eye sessions: ${lazyResult.message || 'Cleared'}
                            </p>
                            <p style="margin-top: 10px; font-size: 14px; color: var(--text-muted);">
                                Note: If Firestore deletion failed, some data may still exist in the cloud database.
                            </p>
                        </div>
                    `;
                } else if (visionOk || lazyOk) {
                    // Partial success
                    container.innerHTML = `
                        <div class="clear-success-message">
                            <h3>⚠️ Partial Clear</h3>
                            <p>Some data was cleared, but there were issues:</p>
                            <p style="margin-top: 10px; font-size: 14px; color: var(--text-muted);">
                                ${visionOk ? '✅ Vision tests: Cleared' : '❌ Vision tests: Failed to clear'}
                            </p>
                            <p style="margin-top: 5px; font-size: 14px; color: var(--text-muted);">
                                ${lazyOk ? '✅ Lazy eye sessions: Cleared' : '❌ Lazy eye sessions: Failed to clear'}
                            </p>
                        </div>
                    `;
                } else {
                    throw new Error('Failed to clear data');
                }
                
                // Clear search results
                searchResults.style.display = 'none';
                searchInput.value = '';
                window.currentSearchResults = null;
                
                // Reset button after delay
                setTimeout(() => {
                    clearDataBtn.disabled = false;
                    clearDataBtn.textContent = 'Clear All Test Data';
                    container.innerHTML = '<p>All test data has been cleared. Take a new test to see results here.</p>';
                }, 3000);
            } catch (e) {
                console.error('Error clearing data:', e);
                container.innerHTML = `
                    <div class="clear-error-message">
                        <h3>❌ Error Clearing Data</h3>
                        <p>An error occurred while clearing data: ${e.message}</p>
                    </div>
                `;
                
                clearDataBtn.disabled = false;
                clearDataBtn.textContent = 'Clear All Test Data';
            }
        });
    }

    // Nothing shown initially - user must search by name first
    container.style.display = 'none';
});
