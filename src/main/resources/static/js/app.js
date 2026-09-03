/**
 * Smart AI Voice Calculator Main Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const lcdExpression = document.getElementById('lcdExpression');
    const lcdResult = document.getElementById('lcdResult');
    const angleUnitBadge = document.getElementById('angleUnitBadge');
    const memIndicator = document.getElementById('memIndicator');
    const standardTab = document.getElementById('standardTab');
    const scientificTab = document.getElementById('scientificTab');
    const scientificGrid = document.getElementById('scientificGrid');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeToggleIcon = document.getElementById('themeToggleIcon');
    const themeToggleText = document.getElementById('themeToggleText');

    // Voice & AI Elements
    const micButton = document.getElementById('micButton');
    const micPulseRing = document.getElementById('micPulseRing');
    const micStatusText = document.getElementById('micStatusText');
    const liveVoiceWordsStream = document.getElementById('liveVoiceWordsStream');
    const aiEngineBadge = document.getElementById('aiEngineBadge');
    const aiEngineDot = document.getElementById('aiEngineDot');
    const aiEngineText = document.getElementById('aiEngineText');
    const textPromptInput = document.getElementById('textPromptInput');
    const textPromptSubmit = document.getElementById('textPromptSubmit');

    // Live Caption Banner (Below Calculator)
    const liveCaptionCard = document.getElementById('liveCaptionCard');
    const liveCaptionDot = document.getElementById('liveCaptionDot');
    const liveCaptionStatus = document.getElementById('liveCaptionStatus');
    const liveCaptionText = document.getElementById('liveCaptionText');

    function updateLiveCaption(text, status = 'READY', isSpeaking = false) {
        if (!liveCaptionText) return;
        liveCaptionText.textContent = text;
        if (liveCaptionStatus) liveCaptionStatus.textContent = status;
        if (liveCaptionDot) {
            if (isSpeaking) {
                liveCaptionDot.classList.add('speaking');
            } else {
                liveCaptionDot.classList.remove('speaking');
            }
        }
    }

    // AI Solution Card Elements
    const aiSolutionCard = document.getElementById('aiSolutionCard');
    const aiDetectedLang = document.getElementById('aiDetectedLang');
    const aiOriginalPrompt = document.getElementById('aiOriginalPrompt');
    const aiFormula = document.getElementById('aiFormula');
    const aiResultVal = document.getElementById('aiResultVal');
    const aiStepsList = document.getElementById('aiStepsList');
    const copyResultBtn = document.getElementById('copyResultBtn');
    const speakResultBtn = document.getElementById('speakResultBtn');
    const loadToCalcBtn = document.getElementById('loadToCalcBtn');

    // History & Settings Elements
    const historyToggleBtn = document.getElementById('historyToggleBtn');
    const historyDrawer = document.getElementById('historyDrawer');
    const historyCloseBtn = document.getElementById('historyCloseBtn');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    const settingsToggleBtn = document.getElementById('settingsToggleBtn');
    const settingsModal = document.getElementById('settingsModal');
    const settingsCloseBtn = document.getElementById('settingsCloseBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const toggleSoundSwitch = document.getElementById('toggleSoundSwitch');
    const toggleTtsSwitch = document.getElementById('toggleTtsSwitch');
    const voiceLangSelect = document.getElementById('voiceLangSelect');
    const voicePersonaSelect = document.getElementById('voicePersonaSelect');
    const testVoiceBtn = document.getElementById('testVoiceBtn');
    const toastMsg = document.getElementById('toastMsg');

    // State Variables
    let audioVisualizer = null;
    let activeStreamStopper = null;
    let lastSpokenText = '';
    let savedApiKey = localStorage.getItem('smartcalc_gemini_key') || '';

    // Funny Themed Gemini API Key Required Modal Elements
    const apiKeyRequiredModal = document.getElementById('apiKeyRequiredModal');
    const closeApiKeyPromptBtn = document.getElementById('closeApiKeyPromptBtn');
    const openSettingsFromPromptBtn = document.getElementById('openSettingsFromPromptBtn');
    const dismissApiKeyPromptBtn = document.getElementById('dismissApiKeyPromptBtn');

    function showApiKeyRequiredPrompt() {
        if (!apiKeyRequiredModal) return;
        window.soundFx.playError();
        apiKeyRequiredModal.classList.add('open');
        apiKeyRequiredModal.setAttribute('aria-hidden', 'false');
    }

    function hideApiKeyRequiredPrompt() {
        if (!apiKeyRequiredModal) return;
        apiKeyRequiredModal.classList.remove('open');
        apiKeyRequiredModal.setAttribute('aria-hidden', 'true');
    }

    if (closeApiKeyPromptBtn) closeApiKeyPromptBtn.addEventListener('click', hideApiKeyRequiredPrompt);
    if (dismissApiKeyPromptBtn) dismissApiKeyPromptBtn.addEventListener('click', hideApiKeyRequiredPrompt);

    if (openSettingsFromPromptBtn) {
        openSettingsFromPromptBtn.addEventListener('click', () => {
            hideApiKeyRequiredPrompt();
            settingsModal.classList.add('open');
            settingsModal.setAttribute('aria-hidden', 'false');
            if (apiKeyInput) {
                setTimeout(() => apiKeyInput.focus(), 150);
            }
        });
    }

    // Initialize Theme immediately
    const initialTheme = localStorage.getItem('smartcalc_theme') || 'dark';
    setTheme(initialTheme);

    // Initialize Audio Wave Visualizer
    audioVisualizer = new AudioWaveVisualizer('audioWaveCanvas');

    // Populate Natural Voices in Dropdown
    function populateVoiceList(voices) {
        if (!voicePersonaSelect || !voices || voices.length === 0) return;
        const currentVal = localStorage.getItem('smartcalc_selected_voice') || '';
        voicePersonaSelect.innerHTML = '<option value="">Auto-Select Best Natural Voice</option>';
        
        // Sort voices nicely
        const sorted = [...voices].sort((a, b) => a.name.localeCompare(b.name));
        sorted.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.voiceURI || v.name;
            const isNatural = v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Neural') || v.name.includes('Google');
            opt.textContent = `${v.name} (${v.lang})${isNatural ? ' ★' : ''}`;
            if (opt.value === currentVal) opt.selected = true;
            voicePersonaSelect.appendChild(opt);
        });
    }

    window.speechEngine.onVoicesLoaded = populateVoiceList;
    if (window.speechEngine.cachedVoices.length > 0) {
        populateVoiceList(window.speechEngine.cachedVoices);
    }

    // Initialize Settings from LocalStorage
    if (apiKeyInput && savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }

    const savedTheme = localStorage.getItem('smartcalc_theme') || 'dark';
    setTheme(savedTheme);

    const savedSound = localStorage.getItem('smartcalc_sound') !== 'false';
    if (toggleSoundSwitch) toggleSoundSwitch.checked = savedSound;
    window.soundFx.setEnabled(savedSound);

    const savedTts = localStorage.getItem('smartcalc_tts') !== 'false';
    if (toggleTtsSwitch) toggleTtsSwitch.checked = savedTts;
    window.speechEngine.ttsEnabled = savedTts;

    const savedLang = localStorage.getItem('smartcalc_lang') || 'auto';
    if (voiceLangSelect) voiceLangSelect.value = savedLang;
    window.speechEngine.setLanguage(savedLang);

    // Fetch backend status
    checkBackendStatus();

    // -------------------------------------------------------------------------
    // CALCULATOR STATE SYNCHRONIZATION
    // -------------------------------------------------------------------------
    window.calcEngine.onStateChange = (state) => {
        lcdExpression.textContent = state.expression || '';
        lcdResult.textContent = state.result || '0';
        angleUnitBadge.textContent = state.angleUnit.toUpperCase();

        if (state.hasMemory) {
            memIndicator.classList.add('active');
        } else {
            memIndicator.classList.remove('active');
        }

        // Adjust font size dynamically for long numbers
        if (state.result.length > 12) {
            lcdResult.style.fontSize = '1.3rem';
        } else if (state.result.length > 8) {
            lcdResult.style.fontSize = '1.7rem';
        } else {
            lcdResult.style.fontSize = '2.1rem';
        }
    };

    // -------------------------------------------------------------------------
    // KEYPAD CLICK HANDLERS
    // -------------------------------------------------------------------------
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-val');
            const action = btn.getAttribute('data-action');
            const fn = btn.getAttribute('data-fn');

            if (action === 'calculate') {
                window.soundFx.playCalculate();
                performCalculation();
            } else if (action === 'clear') {
                window.soundFx.playClick();
                window.calcEngine.clear();
            } else if (action === 'delete') {
                window.soundFx.playClick();
                window.calcEngine.deleteLast();
            } else if (fn) {
                window.soundFx.playOpClick();
                window.calcEngine.appendFunction(fn);
            } else if (val) {
                if (['+', '-', '×', '÷', '*', '/', '%', '^'].includes(val)) {
                    window.soundFx.playOpClick();
                } else {
                    window.soundFx.playClick();
                }
                window.calcEngine.append(val);
            }
        });
    });

    // Memory buttons
    document.querySelectorAll('.mem-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.soundFx.playClick();
            const action = btn.getAttribute('data-action');
            if (action === 'mc') window.calcEngine.memoryClear();
            else if (action === 'mr') window.calcEngine.memoryRecall();
            else if (action === 'm+') window.calcEngine.memoryAdd();
            else if (action === 'm-') window.calcEngine.memorySubtract();
            else if (action === 'ms') window.calcEngine.memoryStore();
        });
    });

    // Angle Unit Toggle (Deg / Rad)
    angleUnitBadge.addEventListener('click', () => {
        window.soundFx.playClick();
        window.calcEngine.toggleAngleUnit();
    });

    // Mode Tabs (Standard / Scientific)
    standardTab.addEventListener('click', () => {
        window.soundFx.playClick();
        standardTab.classList.add('active');
        scientificTab.classList.remove('active');
        scientificGrid.classList.add('collapsed');
    });

    scientificTab.addEventListener('click', () => {
        window.soundFx.playClick();
        scientificTab.classList.add('active');
        standardTab.classList.remove('active');
        scientificGrid.classList.remove('collapsed');
    });

    // -------------------------------------------------------------------------
    // REST API - EVALUATE CALCULATOR EXPRESSION
    // -------------------------------------------------------------------------
    async function performCalculation() {
        const sanitizedExpr = window.calcEngine.getSanitizedExpression();
        if (!sanitizedExpr || sanitizedExpr.trim() === '') return;
        window.calcEngine.expression = sanitizedExpr;
        window.calcEngine.notify();

        try {
            const resp = await fetch('/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expression: sanitizedExpr,
                    angleUnit: window.calcEngine.angleUnit,
                    precision: 10
                })
            });

            const data = await resp.json();
            if (data.success) {
                window.calcEngine.setResult(data.formattedResult);
                updateLiveCaption(`Result is ${data.formattedResult}`, 'CALCULATED', false);
                showToast(`Calculated: ${data.formattedResult}`);
            } else {
                window.soundFx.playError();
                window.calcEngine.setResult('Error');
                showToast(data.error || 'Syntax Error');
            }
        } catch (e) {
            window.soundFx.playError();
            showToast('Calculation error: ' + e.message);
        }
    }

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // VOICE RECORDING & MULTILINGUAL AI DECODING FLOW
    // -------------------------------------------------------------------------
    micButton.addEventListener('click', async () => {
        if (activeStreamStopper) {
            await stopVoiceRecording();
        } else {
            await startVoiceRecording();
        }
    });

    async function startVoiceRecording() {
        try {
            window.soundFx.playMicStart();
            micButton.classList.add('recording');
            micPulseRing.classList.add('recording');
            micStatusText.textContent = 'Listening... Speak your math problem!';

            const audioSession = await window.speechEngine.startRecording(
                (liveText) => {
                    renderLiveWords(liveText);
                },
                () => {
                    // Auto-stop on silence after speaking
                    stopVoiceRecording();
                },
                (err) => {
                    window.soundFx.playError();
                    showToast('Microphone error: ' + err.message);
                    resetMicUI();
                }
            );

            if (audioSession) {
                activeStreamStopper = audioSession.stop;
                if (window.soundFx.ctx) {
                    audioVisualizer.connectStream(audioSession.stream, window.soundFx.ctx);
                }
            }
        } catch (err) {
            resetMicUI();
            showToast('Could not access microphone: ' + err.message);
        }
    }

    async function stopVoiceRecording() {
        if (!activeStreamStopper) return;
        const stopper = activeStreamStopper;
        activeStreamStopper = null;

        window.soundFx.playMicStop();
        micButton.classList.remove('recording');
        micPulseRing.classList.remove('recording');
        micStatusText.textContent = 'Processing with AI...';

        try {
            const audioData = await stopper();
            audioVisualizer.disconnect();

            if (audioData && (audioData.transcript || audioData.audioBase64)) {
                await processVoiceData(audioData);
            } else {
                resetMicUI();
                micStatusText.textContent = 'Click microphone to speak in any language';
            }
        } catch (err) {
            resetMicUI();
            console.error('Error stopping voice session:', err);
        }
    }

    function renderLiveWords(text) {
        if (!liveVoiceWordsStream) return;
        if (!text || !text.trim()) {
            liveVoiceWordsStream.style.display = 'none';
            micStatusText.textContent = 'Listening... Speak your math problem!';
            return;
        }
        micStatusText.textContent = 'Speech detected:';
        updateLiveCaption(text, 'LISTENING...', false);
        liveVoiceWordsStream.style.display = 'flex';
        const words = text.trim().split(/\s+/);
        liveVoiceWordsStream.innerHTML = '';
        words.forEach((w, idx) => {
            const span = document.createElement('span');
            span.className = 'word-chip' + (idx === words.length - 1 ? ' latest' : '');
            span.textContent = w;
            liveVoiceWordsStream.appendChild(span);
        });
        const cursor = document.createElement('span');
        cursor.className = 'voice-cursor';
        liveVoiceWordsStream.appendChild(cursor);
    }

    function resetMicUI() {
        micButton.classList.remove('recording');
        micPulseRing.classList.remove('recording');
        micStatusText.textContent = 'Click microphone to speak in any language';
        if (liveVoiceWordsStream) {
            liveVoiceWordsStream.style.display = 'none';
            liveVoiceWordsStream.innerHTML = '';
        }
        activeStreamStopper = null;
        if (audioVisualizer) audioVisualizer.disconnect();
    }

    async function processVoiceData(audioData) {
        try {
            micStatusText.textContent = 'Decoding mathematical problem...';
            const payload = {
                transcript: audioData.transcript,
                audioBase64: audioData.audioBase64,
                mimeType: audioData.mimeType,
                language: window.speechEngine.selectedLanguage,
                apiKey: savedApiKey
            };

            const resp = await fetch('/api/voice/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await resp.json();
            displayAiResult(data);
        } catch (err) {
            window.soundFx.playError();
            showToast('Voice processing error: ' + err.message);
        } finally {
            resetMicUI();
        }
    }

    // -------------------------------------------------------------------------
    // TEXT PROMPT BAR (NATURAL LANGUAGE MATH SOLVER)
    // -------------------------------------------------------------------------
    textPromptSubmit.addEventListener('click', submitTextPrompt);
    textPromptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitTextPrompt();
    });

    async function submitTextPrompt() {
        const query = textPromptInput.value.trim();
        if (!query) return;

        window.soundFx.playOpClick();
        textPromptInput.disabled = true;
        textPromptSubmit.textContent = 'Solving...';

        try {
            const resp = await fetch('/api/ai/solve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: query,
                    apiKey: savedApiKey
                })
            });

            const data = await resp.json();
            displayAiResult(data);
            textPromptInput.value = '';
        } catch (err) {
            window.soundFx.playError();
            showToast('AI solving error: ' + err.message);
        } finally {
            textPromptInput.disabled = false;
            textPromptSubmit.textContent = 'Solve';
        }
    }

    // -------------------------------------------------------------------------
    // DISPLAY AI RESULT & STEPS
    // -------------------------------------------------------------------------
    function displayAiResult(data) {
        if (!data.success) {
            window.soundFx.playError();
            showToast(data.error || 'Could not solve math problem.');
            const query = data.originalQuery || '';
            const isWordProblem = query.split(' ').length >= 3 || /[a-zA-Z]{4,}/.test(query);
            const isKeyIssue = !savedApiKey || (data.error && (data.error.includes('parse') || data.error.includes('Gemini') || data.error.includes('quota') || data.error.includes('429')));
            if (isWordProblem || isKeyIssue) {
                setTimeout(() => showApiKeyRequiredPrompt(), 350);
            }
            return;
        }

        window.soundFx.playCalculate();
        aiSolutionCard.style.display = 'flex';
        aiDetectedLang.textContent = data.detectedLanguage || 'Auto';
        aiOriginalPrompt.textContent = data.originalQuery || 'Voice input';
        aiFormula.textContent = data.mathExpression || data.result;
        aiResultVal.textContent = data.result;

        // Store for Math Grapher
        lastResolvedExpr = data.mathExpression || data.result || '';
        lastResolvedResult = data.result || '';
        lastResolvedSteps = data.steps || [];

        // Render steps
        aiStepsList.innerHTML = '';
        if (data.steps && data.steps.length > 0) {
            data.steps.forEach(step => {
                const item = document.createElement('div');
                item.className = 'step-item';
                item.textContent = step;
                aiStepsList.appendChild(item);
            });
        }

        // Update calculator display with answer
        window.calcEngine.setResult(data.result, data.mathExpression);

        // Speak result
        lastSpokenText = data.spokenResponse || `The answer is ${data.result}`;
        updateLiveCaption(data.spokenResponse || `Result is ${data.result}`, 'RESULT READY', false);
        window.speechEngine.speak(lastSpokenText, data.detectedLanguage);

        showToast(`Solved: ${data.result}`);
    }

    // Store last resolution data for graphing
    let lastResolvedExpr = '';
    let lastResolvedResult = '';
    let lastResolvedSteps = [];

    // Math Grapher Modal Elements
    const seeGraphBtn = document.getElementById('seeGraphBtn');
    const graphModal = document.getElementById('graphModal');
    const graphCloseBtn = document.getElementById('graphCloseBtn');
    const graphCustomExprInput = document.getElementById('graphCustomExprInput');
    const graphPlotCustomBtn = document.getElementById('graphPlotCustomBtn');
    const graphZoomInBtn = document.getElementById('graphZoomInBtn');
    const graphZoomOutBtn = document.getElementById('graphZoomOutBtn');
    const graphResetBtn = document.getElementById('graphResetBtn');
    const graphStatExpr = document.getElementById('graphStatExpr');
    const graphStatResult = document.getElementById('graphStatResult');

    let mathGrapher = null;
    if (window.MathGrapher) {
        mathGrapher = new window.MathGrapher('mathGraphCanvas', 'graphTooltip');
    }

    // AI Card Buttons
    copyResultBtn.addEventListener('click', () => {
        const res = aiResultVal.textContent;
        navigator.clipboard.writeText(res);
        window.soundFx.playClick();
        showToast('Result copied to clipboard!');
    });

    speakResultBtn.addEventListener('click', () => {
        window.soundFx.playClick();
        const textToSpeak = lastSpokenText || `Result is ${aiResultVal.textContent}`;
        updateLiveCaption(textToSpeak, 'SPEAKING...', true);
        window.speechEngine.speak(textToSpeak);
    });

    loadToCalcBtn.addEventListener('click', () => {
        window.soundFx.playClick();
        window.calcEngine.append(aiResultVal.textContent);
        showToast('Loaded into calculator expression');
    });

    if (seeGraphBtn) {
        seeGraphBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            graphModal.classList.add('open');
            graphModal.setAttribute('aria-hidden', 'false');

            const exprToPlot = lastResolvedExpr || aiFormula.textContent || 'sin(x)';
            if (graphCustomExprInput) graphCustomExprInput.value = exprToPlot;
            if (graphStatExpr) graphStatExpr.textContent = `Formula: ${exprToPlot}`;
            if (graphStatResult) graphStatResult.textContent = `Answer: ${lastResolvedResult || aiResultVal.textContent}`;

            if (mathGrapher) {
                setTimeout(() => {
                    mathGrapher.plot(exprToPlot, lastResolvedResult || aiResultVal.textContent, lastResolvedSteps);
                }, 100);
            }
        });
    }

    if (graphCloseBtn) {
        graphCloseBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            graphModal.classList.remove('open');
            graphModal.setAttribute('aria-hidden', 'true');
        });
    }

    if (graphPlotCustomBtn) {
        graphPlotCustomBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            const expr = graphCustomExprInput.value.trim();
            if (expr && mathGrapher) {
                if (graphStatExpr) graphStatExpr.textContent = `Formula: ${expr}`;
                mathGrapher.plot(expr, '', []);
            }
        });
    }

    if (graphCustomExprInput) {
        graphCustomExprInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && graphPlotCustomBtn) {
                graphPlotCustomBtn.click();
            }
        });
    }

    if (graphZoomInBtn) {
        graphZoomInBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            if (mathGrapher) mathGrapher.zoom(0.75);
        });
    }

    if (graphZoomOutBtn) {
        graphZoomOutBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            if (mathGrapher) mathGrapher.zoom(1.35);
        });
    }

    if (graphResetBtn) {
        graphResetBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            if (mathGrapher) mathGrapher.resetView();
        });
    }

    // Quick Math Function Preset Pills (cos(x), sin(x), tan(x), x^2, etc.)
    document.querySelectorAll('.preset-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            window.soundFx.playClick();
            document.querySelectorAll('.preset-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const fn = btn.getAttribute('data-fn');
            if (graphCustomExprInput) graphCustomExprInput.value = fn;
            if (graphStatExpr) graphStatExpr.textContent = `Formula: y = ${fn}`;
            if (mathGrapher) mathGrapher.plotFunction(fn);
        });
    });

    // =========================================================================
    // 5-TAP SECRET EASTER EGG & MUSIC CREATOR STUDIO CONTROLLER
    // =========================================================================
    let musicEngine = null;
    let studioVisualizer = null;
    let visualizerTapCount = 0;
    let lastVisualizerTapTime = 0;

    const musicStudioModal = document.getElementById('musicStudioModal');
    const musicStudioCloseBtn = document.getElementById('musicStudioCloseBtn');
    const studioPlayBtn = document.getElementById('studioPlayBtn');
    const studioPlayIcon = document.getElementById('studioPlayIcon');
    const studioPlayText = document.getElementById('studioPlayText');
    const studioStopBtn = document.getElementById('studioStopBtn');
    const studioClearBtn = document.getElementById('studioClearBtn');
    const studioRandomBtn = document.getElementById('studioRandomBtn');
    const studioDownloadWavBtn = document.getElementById('studioDownloadWavBtn');
    const studioBpmSlider = document.getElementById('studioBpmSlider');
    const studioBpmVal = document.getElementById('studioBpmVal');
    const sequencerGrid = document.getElementById('sequencerGrid');

    // 5-Tap Detection on Main Calculator Audio Visualizer
    const mainWaveformContainer = document.querySelector('.waveform-container');
    if (mainWaveformContainer) {
        mainWaveformContainer.style.cursor = 'pointer';
        mainWaveformContainer.title = 'Tip: Tap 5 times to unlock Cyber Music Studio!';
        mainWaveformContainer.addEventListener('click', () => {
            const now = Date.now();
            if (now - lastVisualizerTapTime < 650) {
                visualizerTapCount++;
            } else {
                visualizerTapCount = 1;
            }
            lastVisualizerTapTime = now;

            // Subtle tactile visual feedback on tap
            mainWaveformContainer.style.transform = 'scale(0.98)';
            setTimeout(() => { mainWaveformContainer.style.transform = 'scale(1)'; }, 100);

            if (visualizerTapCount === 3) {
                showToast('2 more taps to unlock Cyber Music Studio...');
            }

            if (visualizerTapCount >= 5) {
                visualizerTapCount = 0;
                openMusicStudio();
            }
        });
    }

    function ensureMusicEngine() {
        const EngineClass = window.MusicCreatorEngine || (typeof MusicCreatorEngine !== 'undefined' ? MusicCreatorEngine : null);
        if (!musicEngine && EngineClass) {
            musicEngine = new EngineClass();
            initMusicStudioUI();
        }
        if (musicEngine) {
            musicEngine.initAudio();
            if (audioVisualizer) {
                musicEngine.setVisualizer(audioVisualizer);
            }
            if (studioVisualizer) {
                musicEngine.setVisualizer(studioVisualizer);
            }
        }
        return musicEngine;
    }

    function openMusicStudio() {
        if (!musicStudioModal) return;
        window.soundFx.playCalculate();
        musicStudioModal.classList.add('open');
        musicStudioModal.setAttribute('aria-hidden', 'false');
        showToast('Cyber Beat & Synth Studio Unlocked!');

        ensureMusicEngine();

        const VisClass = window.AudioWaveVisualizer || (typeof AudioWaveVisualizer !== 'undefined' ? AudioWaveVisualizer : null);
        if (!studioVisualizer && VisClass) {
            studioVisualizer = new VisClass('studioVisualizerCanvas');
        }

        if (musicEngine) {
            if (studioVisualizer) {
                musicEngine.setVisualizer(studioVisualizer);
            }
            updatePlayBtnUI(musicEngine.isPlaying);
        }

        setTimeout(() => {
            if (studioVisualizer) {
                studioVisualizer.resize();
                if (typeof studioVisualizer.injectEnergy === 'function') {
                    studioVisualizer.injectEnergy('kick', 120);
                }
            }
        }, 40);
        setTimeout(() => {
            if (studioVisualizer) {
                studioVisualizer.resize();
            }
        }, 250);
    }

    function closeMusicStudio() {
        if (!musicStudioModal) return;
        window.soundFx.playClick();
        musicStudioModal.classList.remove('open');
        musicStudioModal.setAttribute('aria-hidden', 'true');
        updateCalcMiniPlayerUI(musicEngine ? musicEngine.isPlaying : false);
    }

    if (musicStudioCloseBtn) {
        musicStudioCloseBtn.addEventListener('click', closeMusicStudio);
    }

    function updatePlayBtnUI(playing) {
        if (!studioPlayBtn) return;
        if (playing) {
            studioPlayBtn.classList.add('playing');
            studioPlayIcon.innerHTML = `<svg class="svg-icon-pause" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>`;
            studioPlayText.textContent = 'PAUSE';
        } else {
            studioPlayBtn.classList.remove('playing');
            studioPlayIcon.innerHTML = `<svg class="svg-icon-play" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
            studioPlayText.textContent = 'PLAY LOOP';
        }
    }

    function updateCalcMiniPlayerUI(playing) {
        const playBtn = document.getElementById('calcMusicPlayBtn');
        const playIcon = document.getElementById('calcMusicPlayIcon');
        const pulseDot = document.getElementById('calcMusicPulseDot');
        const miniEq = document.getElementById('calcMiniEq');
        const styleLabel = document.getElementById('calcMusicStyleLabel');
        const bpmLabel = document.getElementById('calcMusicBpmLabel');

        if (playBtn && playIcon) {
            if (playing) {
                playBtn.classList.add('playing');
                playIcon.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>`;
                if (pulseDot) pulseDot.classList.add('playing');
                if (miniEq) miniEq.classList.add('active');
            } else {
                playBtn.classList.remove('playing');
                playIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
                if (pulseDot) pulseDot.classList.remove('playing');
                if (miniEq) miniEq.classList.remove('active');
            }
        }
        if (musicEngine) {
            const cur = musicEngine.getCurrentStyle();
            if (styleLabel) styleLabel.textContent = `${cur.name.toUpperCase()} BEAT`;
            if (bpmLabel) bpmLabel.textContent = `${musicEngine.bpm} BPM`;
        }
    }

    function updateAllPlayBtnUIs(playing) {
        updatePlayBtnUI(playing);
        updateCalcMiniPlayerUI(playing);
    }

    function initMusicStudioUI() {
        if (!musicEngine) return;

        // 1. Render Sequencer Grid & Dynamic Header
        renderSequencerGrid();

        // 2. Hook Playhead updates (Ultra high-performance O(1) playhead updating)
        let prevPlayheadStep = -1;
        const headerCol = document.getElementById('seqStepsHeaderCol');
        musicEngine.onStep((step) => {
            if (prevPlayheadStep >= 0 && prevPlayheadStep !== step) {
                const prevBtns = sequencerGrid.querySelectorAll(`.seq-step-btn[data-step="${prevPlayheadStep}"]`);
                prevBtns.forEach(b => b.classList.remove('playhead'));
                if (headerCol) {
                    const prevMark = headerCol.querySelector(`.step-num-mark[data-step="${prevPlayheadStep}"]`);
                    if (prevMark) prevMark.classList.remove('playhead-header');
                }
            }

            if (step >= 0) {
                const activeColBtns = sequencerGrid.querySelectorAll(`.seq-step-btn[data-step="${step}"]`);
                activeColBtns.forEach(btn => btn.classList.add('playhead'));
                if (headerCol) {
                    const mark = headerCol.querySelector(`.step-num-mark[data-step="${step}"]`);
                    if (mark) mark.classList.add('playhead-header');
                }
                prevPlayheadStep = step;
            } else {
                prevPlayheadStep = -1;
            }
        });

        // 3. Step Sequencer Bits: Drag-to-Select / Paint Mode (Mouse & Touch)
        let isSeqDragging = false;
        let seqDragDrawMode = true; // true = paint ON, false = erase OFF
        let seqVisitedSteps = new Set();

        function applyStepDraw(targetBtn) {
            if (!targetBtn || !targetBtn.classList.contains('seq-step-btn')) return;
            const t = parseInt(targetBtn.getAttribute('data-track'));
            const s = parseInt(targetBtn.getAttribute('data-step'));
            if (isNaN(t) || isNaN(s)) return;
            const key = `${t}_${s}`;
            if (seqVisitedSteps.has(key)) return;
            seqVisitedSteps.add(key);

            musicEngine.setStep(t, s, seqDragDrawMode);
            targetBtn.classList.toggle('active', seqDragDrawMode);

            if (seqDragDrawMode) {
                const track = musicEngine.tracks[t];
                if (track) {
                    musicEngine.playInstrument(track.instrument, track.pitches[s] || 440);
                    if (studioVisualizer && typeof studioVisualizer.injectEnergy === 'function') {
                        studioVisualizer.injectEnergy(track.instrument, track.pitches[s] || 440);
                    }
                }
            }
        }

        sequencerGrid.addEventListener('pointerdown', (e) => {
            const stepBtn = e.target.closest('.seq-step-btn');
            if (!stepBtn) return;
            e.preventDefault();
            window.soundFx.playClick();
            isSeqDragging = true;
            seqVisitedSteps.clear();

            const t = parseInt(stepBtn.getAttribute('data-track'));
            const s = parseInt(stepBtn.getAttribute('data-step'));
            const track = musicEngine.tracks[t];
            const currentState = track ? !!track.pattern[s] : false;
            seqDragDrawMode = !currentState; // paint ON if was off, erase OFF if was on

            applyStepDraw(stepBtn);
        });

        sequencerGrid.addEventListener('pointerover', (e) => {
            if (!isSeqDragging) return;
            const stepBtn = e.target.closest('.seq-step-btn');
            if (stepBtn) {
                applyStepDraw(stepBtn);
            }
        });

        // Touch drag across sequencer steps
        sequencerGrid.addEventListener('touchmove', (e) => {
            if (!isSeqDragging || !e.touches || !e.touches[0]) return;
            e.preventDefault();
            const elem = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
            if (elem) {
                const stepBtn = elem.closest('.seq-step-btn');
                if (stepBtn) applyStepDraw(stepBtn);
            }
        }, { passive: false });

        window.addEventListener('pointerup', () => { isSeqDragging = false; seqVisitedSteps.clear(); });
        window.addEventListener('pointercancel', () => { isSeqDragging = false; seqVisitedSteps.clear(); });
        window.addEventListener('touchend', () => { isSeqDragging = false; seqVisitedSteps.clear(); });

        // Mute, Solo, Remove click actions
        sequencerGrid.addEventListener('click', (e) => {
            const muteBtn = e.target.closest('.track-mute-btn');
            if (muteBtn) {
                e.stopPropagation();
                window.soundFx.playClick();
                const t = parseInt(muteBtn.getAttribute('data-track'));
                const muted = musicEngine.toggleMute(t);
                muteBtn.classList.toggle('active', muted);
                return;
            }

            const soloBtn = e.target.closest('.track-solo-btn');
            if (soloBtn) {
                e.stopPropagation();
                window.soundFx.playClick();
                const t = parseInt(soloBtn.getAttribute('data-track'));
                const soloed = musicEngine.toggleSolo(t);
                soloBtn.classList.toggle('active', soloed);
                return;
            }

            const removeBtn = e.target.closest('.track-remove-btn');
            if (removeBtn) {
                e.stopPropagation();
                window.soundFx.playClick();
                const t = parseInt(removeBtn.getAttribute('data-track'));
                if (musicEngine.tracks.length <= 1) {
                    showToast('At least 1 track is required.');
                    return;
                }
                musicEngine.removeTrack(t);
                renderSequencerGrid();
                showToast('Removed track');
                return;
            }
        });

        // 4. Transport Controls
        studioPlayBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            if (musicEngine.isPlaying) {
                musicEngine.stop();
                updatePlayBtnUI(false);
            } else {
                musicEngine.start();
                updatePlayBtnUI(true);
            }
        });

        studioStopBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            musicEngine.stop();
            updatePlayBtnUI(false);
        });

        studioClearBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            musicEngine.clearPattern();
            updateSequencerGridActiveStates();
            showToast('Grid cleared. Create your beat from scratch.');
        });

        // 4 Smart Generative Random Modes
        studioRandomBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            musicEngine.randomizeAll();
            updateSequencerGridActiveStates();
            showToast('New groove generated across all tracks.');
        });

        const randomDrumsBtn = document.getElementById('studioRandomDrumsBtn');
        if (randomDrumsBtn) {
            randomDrumsBtn.addEventListener('click', () => {
                window.soundFx.playClick();
                musicEngine.randomizeDrums();
                updateSequencerGridActiveStates();
                showToast('Fresh drum rhythm generated.');
            });
        }

        const randomMelodyBtn = document.getElementById('studioRandomMelodyBtn');
        if (randomMelodyBtn) {
            randomMelodyBtn.addEventListener('click', () => {
                window.soundFx.playClick();
                musicEngine.randomizeMelody();
                updateSequencerGridActiveStates();
                showToast('Melodies and basslines randomized.');
            });
        }

        const glitchBtn = document.getElementById('studioGlitchBtn');
        if (glitchBtn) {
            glitchBtn.addEventListener('click', () => {
                window.soundFx.playClick();
                musicEngine.randomizeGlitch();
                updateSequencerGridActiveStates();
                showToast('Glitch syncopation pattern generated.');
            });
        }

        // Add Instrument Track Dropdown
        const addTrackDropdownBtn = document.getElementById('addTrackDropdownBtn');
        const addTrackMenu = document.getElementById('addTrackMenu');
        if (addTrackDropdownBtn && addTrackMenu) {
            addTrackDropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.soundFx.playClick();
                const isHidden = addTrackMenu.style.display === 'none';
                addTrackMenu.style.display = isHidden ? 'flex' : 'none';
            });

            document.addEventListener('click', (e) => {
                if (addTrackMenu && !addTrackMenu.contains(e.target) && e.target !== addTrackDropdownBtn) {
                    addTrackMenu.style.display = 'none';
                }
            });

            addTrackMenu.querySelectorAll('.inst-pick-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.soundFx.playClick();
                    const instKey = item.getAttribute('data-inst');
                    addTrackMenu.style.display = 'none';
                    const newTrack = musicEngine.addTrack(instKey);
                    if (newTrack) {
                        renderSequencerGrid();
                        showToast(`Added track: ${newTrack.name}`);
                    } else {
                        showToast('Maximum 16 tracks limit reached.');
                    }
                });
            });
        }

        // Step Length Selector: 16, 32, 64, 128
        document.querySelectorAll('.length-pill[data-steps]').forEach(btn => {
            btn.addEventListener('click', () => {
                window.soundFx.playClick();
                document.querySelectorAll('.length-pill[data-steps]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const steps = parseInt(btn.getAttribute('data-steps'));
                musicEngine.setStepCount(steps);
                renderSequencerGrid();
                showToast(`Sequencer set to ${steps} columns`);
            });
        });

        const addStepBtn = document.getElementById('addStepBtn');
        if (addStepBtn) {
            addStepBtn.addEventListener('click', () => {
                window.soundFx.playClick();
                const newCount = Math.min(128, musicEngine.numSteps + 16);
                musicEngine.setStepCount(newCount);
                highlightActiveLengthPill(newCount);
                renderSequencerGrid();
                showToast(`Sequencer expanded to ${newCount} columns`);
            });
        }

        const removeStepBtn = document.getElementById('removeStepBtn');
        if (removeStepBtn) {
            removeStepBtn.addEventListener('click', () => {
                window.soundFx.playClick();
                const newCount = Math.max(16, musicEngine.numSteps - 16);
                musicEngine.setStepCount(newCount);
                highlightActiveLengthPill(newCount);
                renderSequencerGrid();
                showToast(`Sequencer adjusted to ${newCount} columns`);
            });
        }

        function highlightActiveLengthPill(steps) {
            document.querySelectorAll('.length-pill[data-steps]').forEach(b => {
                const s = parseInt(b.getAttribute('data-steps'));
                b.classList.toggle('active', s === steps);
            });
        }

        studioBpmSlider.addEventListener('input', (e) => {
            const bpm = parseInt(e.target.value);
            musicEngine.setBpm(bpm);
            studioBpmVal.textContent = `${bpm} BPM`;
        });

        // 11 Sound Kit / Genre Pills
        document.querySelectorAll('.kit-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                window.soundFx.playClick();
                document.querySelectorAll('.kit-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const kit = btn.getAttribute('data-kit');
                musicEngine.initDefaultPattern(kit);
                studioBpmSlider.value = musicEngine.bpm;
                studioBpmVal.textContent = `${musicEngine.bpm} BPM`;
                renderSequencerGrid();
                updateCalcMiniPlayerUI(musicEngine.isPlaying);
                showToast(`Loaded ${btn.textContent} Style!`);
            });
        });

        // 5. Download WAV Song
        studioDownloadWavBtn.addEventListener('click', async () => {
            window.soundFx.playClick();
            studioDownloadWavBtn.disabled = true;
            studioDownloadWavBtn.textContent = 'Rendering .WAV...';
            try {
                await musicEngine.exportToWav(2);
                showToast('Song downloaded as 16-bit WAV file!');
            } catch (err) {
                showToast('Export notice: ' + err.message);
            } finally {
                studioDownloadWavBtn.disabled = false;
                studioDownloadWavBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>Download Song (.WAV)</span>';
            }
        });

        // 6. Drum Machine Trigger Pads with Drag-to-Play
        const drumGrid = document.querySelector('.drum-pads-grid');
        let isDrumDragging = false;
        let lastPlayedDrumPad = null;

        function triggerDrumPad(pad) {
            if (!pad || pad === lastPlayedDrumPad) return;
            lastPlayedDrumPad = pad;
            const padIdx = parseInt(pad.getAttribute('data-pad'));
            pad.classList.add('hit');
            setTimeout(() => pad.classList.remove('hit'), 140);
            musicEngine.playDrumPad(padIdx);
        }

        if (drumGrid) {
            drumGrid.addEventListener('pointerdown', (e) => {
                const pad = e.target.closest('.drum-pad');
                if (!pad) return;
                e.preventDefault();
                isDrumDragging = true;
                lastPlayedDrumPad = null;
                triggerDrumPad(pad);
            });

            drumGrid.addEventListener('pointerover', (e) => {
                if (!isDrumDragging) return;
                const pad = e.target.closest('.drum-pad');
                if (pad) triggerDrumPad(pad);
            });

            drumGrid.addEventListener('touchmove', (e) => {
                if (!isDrumDragging || !e.touches || !e.touches[0]) return;
                e.preventDefault();
                const elem = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
                if (elem) {
                    const pad = elem.closest('.drum-pad');
                    if (pad) triggerDrumPad(pad);
                }
            }, { passive: false });
        }

        window.addEventListener('pointerup', () => { isDrumDragging = false; lastPlayedDrumPad = null; });
        window.addEventListener('pointercancel', () => { isDrumDragging = false; lastPlayedDrumPad = null; });
        window.addEventListener('touchend', () => { isDrumDragging = false; lastPlayedDrumPad = null; });

        // 7. Piano Keyboard Instrument Sound Switcher Pills
        document.querySelectorAll('.kbd-inst-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                window.soundFx.playClick();
                document.querySelectorAll('.kbd-inst-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const inst = btn.getAttribute('data-kbd-inst');
                musicEngine.setKeyboardInstrument(inst);
                showToast(`Piano Instrument: ${btn.textContent}`);
            });
        });

        // 8. Octave Shift Controls (- / +)
        let activeOctave = 4;
        const octaveDisplay = document.getElementById('octaveDisplay');
        const octaveDownBtn = document.getElementById('octaveDownBtn');
        const octaveUpBtn = document.getElementById('octaveUpBtn');

        function updatePianoKeyPitches() {
            if (octaveDisplay) octaveDisplay.textContent = `OCT ${activeOctave}`;
            if (musicEngine) musicEngine.setOctave(activeOctave);
            document.querySelectorAll('.piano-key').forEach(key => {
                const offset = parseInt(key.getAttribute('data-note-offset') || 0);
                const midi = 60 + (activeOctave - 4) * 12 + offset;
                const freq = 440 * Math.pow(2, (midi - 69) / 12);
                key.setAttribute('data-note', freq.toFixed(2));
            });
        }

        if (octaveDownBtn) {
            octaveDownBtn.addEventListener('click', () => {
                window.soundFx.playClick();
                if (activeOctave > 2) {
                    activeOctave--;
                    updatePianoKeyPitches();
                    showToast(`Octave shifted down to Octave ${activeOctave}`);
                }
            });
        }
        if (octaveUpBtn) {
            octaveUpBtn.addEventListener('click', () => {
                window.soundFx.playClick();
                if (activeOctave < 6) {
                    activeOctave++;
                    updatePianoKeyPitches();
                    showToast(`Octave shifted up to Octave ${activeOctave}`);
                }
            });
        }
        updatePianoKeyPitches();

        // 9. Full Interactive 32 Piano Keys with Glissando Drag-to-Play (Swipe / Strum)
        const pianoContainer = document.getElementById('pianoRollKeys');
        let isPianoDragging = false;
        let lastPlayedPianoKey = null;

        function triggerPianoKey(key) {
            if (!key || key === lastPlayedPianoKey) return;
            lastPlayedPianoKey = key;
            const note = parseFloat(key.getAttribute('data-note') || 440);
            key.classList.add('pressed');
            setTimeout(() => key.classList.remove('pressed'), 180);
            musicEngine.playNote(note);
        }

        if (pianoContainer) {
            pianoContainer.addEventListener('pointerdown', (e) => {
                const key = e.target.closest('.piano-key');
                if (!key) return;
                e.preventDefault();
                isPianoDragging = true;
                lastPlayedPianoKey = null;
                triggerPianoKey(key);
            });

            pianoContainer.addEventListener('pointerover', (e) => {
                if (!isPianoDragging) return;
                const key = e.target.closest('.piano-key');
                if (key) triggerPianoKey(key);
            });

            pianoContainer.addEventListener('touchmove', (e) => {
                if (!isPianoDragging || !e.touches || !e.touches[0]) return;
                e.preventDefault();
                const elem = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
                if (elem) {
                    const key = elem.closest('.piano-key');
                    if (key) triggerPianoKey(key);
                }
            }, { passive: false });
        }

        window.addEventListener('pointerup', () => { isPianoDragging = false; lastPlayedPianoKey = null; });
        window.addEventListener('pointercancel', () => { isPianoDragging = false; lastPlayedPianoKey = null; });
        window.addEventListener('touchend', () => { isPianoDragging = false; lastPlayedPianoKey = null; });

        // 10. Studio Keyboard Hotkeys (1-9, 0, -, = for 12 Drum Pads; QWERTY for Piano)
        const DRUM_KEY_MAP = {
            '1': 0, '2': 1, '3': 2, '4': 3,
            '5': 4, '6': 5, '7': 6, '8': 7,
            '9': 8, '0': 9, '-': 10, '=': 11
        };

        window.addEventListener('keydown', (e) => {
            if (!musicStudioModal.classList.contains('open')) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

            if (DRUM_KEY_MAP[e.key] !== undefined) {
                const padIdx = DRUM_KEY_MAP[e.key];
                const padBtn = document.querySelector(`.drum-pad[data-pad="${padIdx}"]`);
                if (padBtn) {
                    padBtn.classList.add('hit');
                    setTimeout(() => padBtn.classList.remove('hit'), 120);
                    musicEngine.playDrumPad(padIdx);
                }
                return;
            }

            const keyChar = e.key.toUpperCase();
            const pianoKey = document.querySelector(`.piano-key[data-key="${keyChar}"]`);
            if (pianoKey) {
                const note = parseFloat(pianoKey.getAttribute('data-note') || 440);
                pianoKey.classList.add('pressed');
                setTimeout(() => pianoKey.classList.remove('pressed'), 140);
                musicEngine.playNote(note);
            }
        });
    }

    // =========================================================================
    // MAIN CALCULATOR: LIQUID GLASS MUSIC PLAYER CARD CONTROLLER
    // =========================================================================
    function initCalculatorMusicPlayer() {
        const card = document.getElementById('calcMusicPlayerCard');
        if (!card) return;

        const playBtn = document.getElementById('calcMusicPlayBtn');
        const stopBtn = document.getElementById('calcMusicStopBtn');
        const prevBtn = document.getElementById('calcMusicPrevBtn');
        const nextBtn = document.getElementById('calcMusicNextBtn');
        const randomBtn = document.getElementById('calcMusicRandomBtn');
        const studioBtn = document.getElementById('calcMusicOpenStudioBtn');

        playBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            const engine = ensureMusicEngine();
            if (!engine) return;
            if (engine.isPlaying) {
                engine.stop();
                updateAllPlayBtnUIs(false);
            } else {
                engine.start();
                updateAllPlayBtnUIs(true);
                showToast(`Playing ${engine.getCurrentStyle().name} on Calculator!`);
            }
        });

        stopBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            if (musicEngine) {
                musicEngine.stop();
                updateAllPlayBtnUIs(false);
            }
        });

        prevBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            const engine = ensureMusicEngine();
            if (!engine) return;
            const style = engine.prevStyle();
            updateAllPlayBtnUIs(engine.isPlaying);
            const styleLabel = document.getElementById('calcMusicStyleLabel');
            const bpmLabel = document.getElementById('calcMusicBpmLabel');
            if (styleLabel) styleLabel.textContent = `${style.name.toUpperCase()} BEAT`;
            if (bpmLabel) bpmLabel.textContent = `${engine.bpm} BPM`;
            highlightActiveKitPill(style.key);
            if (typeof renderSequencerGrid === 'function') renderSequencerGrid();
            showToast(`Style: ${style.name}`);
        });

        nextBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            const engine = ensureMusicEngine();
            if (!engine) return;
            const style = engine.nextStyle();
            updateAllPlayBtnUIs(engine.isPlaying);
            const styleLabel = document.getElementById('calcMusicStyleLabel');
            const bpmLabel = document.getElementById('calcMusicBpmLabel');
            if (styleLabel) styleLabel.textContent = `${style.name.toUpperCase()} BEAT`;
            if (bpmLabel) bpmLabel.textContent = `${engine.bpm} BPM`;
            highlightActiveKitPill(style.key);
            if (typeof renderSequencerGrid === 'function') renderSequencerGrid();
            showToast(`Style: ${style.name}`);
        });

        randomBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            const engine = ensureMusicEngine();
            if (!engine) return;
            engine.randomizeAll();
            if (typeof updateSequencerGridActiveStates === 'function') updateSequencerGridActiveStates();
            showToast(`Fresh ${engine.getCurrentStyle().name} groove generated!`);
        });

        studioBtn.addEventListener('click', () => {
            openMusicStudio();
        });

        function highlightActiveKitPill(kitKey) {
            document.querySelectorAll('.kit-pill').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-kit') === kitKey);
            });
        }

        updateCalcMiniPlayerUI(false);
    }

    function renderSequencerGrid() {
        if (!sequencerGrid || !musicEngine) return;
        const steps = musicEngine.numSteps;

        // Update Track & Column Count Badge
        const badge = document.getElementById('activeTrackCountBadge');
        if (badge) {
            badge.textContent = `${musicEngine.tracks.length} Tracks • ${steps} Columns`;
        }

        sequencerGrid.style.setProperty('--seq-steps', steps);

        // Render Dynamic Steps Header in single batch
        const headerCol = document.getElementById('seqStepsHeaderCol');
        if (headerCol) {
            headerCol.style.setProperty('--seq-steps', steps);
            let headerHtml = '';
            for (let s = 0; s < steps; s++) {
                const isGroup = (s % 4 === 0) ? ' beat-start' : '';
                headerHtml += `<span class="step-num-mark${isGroup}" data-step="${s}">${s + 1}</span>`;
            }
            headerCol.innerHTML = headerHtml;
        }

        // Render All Dynamic Instrument Track Rows with DocumentFragment (atomic DOM insert)
        const frag = document.createDocumentFragment();
        musicEngine.tracks.forEach((track, t) => {
            const row = document.createElement('div');
            row.className = 'seq-row';

            let stepsHtml = '';
            for (let s = 0; s < steps; s++) {
                const isActive = track.pattern[s] ? ' active' : '';
                const isGroupStart = (s % 4 === 0) ? ' beat-group-start' : '';
                stepsHtml += `<button class="seq-step-btn track-${track.color || 'cyan'}${isActive}${isGroupStart}" data-track="${t}" data-step="${s}"></button>`;
            }

            row.innerHTML = `
                <div class="seq-track-info">
                    <span class="track-color-dot ${track.color || 'cyan'}"></span>
                    <span class="track-title" title="${track.name}">${track.name}</span>
                    <div class="track-actions">
                        <button class="track-mute-btn ${track.muted ? 'active' : ''}" data-track="${t}" title="Mute Track">M</button>
                        <button class="track-solo-btn ${track.soloed ? 'active' : ''}" data-track="${t}" title="Solo Track">S</button>
                        <button class="track-remove-btn" data-track="${t}" title="Remove Track">×</button>
                    </div>
                </div>
                <div class="seq-steps-row" style="--seq-steps: ${steps}">
                    ${stepsHtml}
                </div>
            `;
            frag.appendChild(row);
        });

        sequencerGrid.innerHTML = '';
        sequencerGrid.appendChild(frag);
    }

    function updateSequencerGridActiveStates() {
        if (!musicEngine || !sequencerGrid) return;
        const allBtns = sequencerGrid.querySelectorAll('.seq-step-btn');
        allBtns.forEach(btn => {
            const t = parseInt(btn.getAttribute('data-track'));
            const s = parseInt(btn.getAttribute('data-step'));
            const track = musicEngine.tracks[t];
            if (track) {
                btn.classList.toggle('active', !!track.pattern[s]);
            }
        });
    }

    // -------------------------------------------------------------------------
    // THEME TOGGLER (BLACK & WHITE / WHITE & BLACK)
    // -------------------------------------------------------------------------
    themeToggleBtn.addEventListener('click', () => {
        window.soundFx.playClick();
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'white' : 'dark';
        setTheme(newTheme);
    });

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('smartcalc_theme', theme);
        if (theme === 'white') {
            themeToggleIcon.innerHTML = `
                <svg class="icon-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
            `;
            themeToggleText.textContent = 'LIGHT';
        } else {
            themeToggleIcon.innerHTML = `
                <svg class="icon-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            `;
            themeToggleText.textContent = 'DARK';
        }
    }

    // -------------------------------------------------------------------------
    // HISTORY DRAWER
    // -------------------------------------------------------------------------
    historyToggleBtn.addEventListener('click', () => {
        window.soundFx.playClick();
        historyDrawer.classList.add('open');
        loadHistory();
    });

    historyCloseBtn.addEventListener('click', () => {
        window.soundFx.playClick();
        historyDrawer.classList.remove('open');
    });

    clearHistoryBtn.addEventListener('click', async () => {
        window.soundFx.playClick();
        await fetch('/api/history', { method: 'DELETE' });
        loadHistory();
        showToast('Calculation history cleared.');
    });

    async function loadHistory() {
        try {
            const resp = await fetch('/api/history');
            const list = await resp.json();
            historyList.innerHTML = '';

            if (list.length === 0) {
                historyList.innerHTML = '<div style="text-align:center; color:var(--text-tertiary); padding:20px; font-family:var(--font-robotic-mono);">No history items yet</div>';
                return;
            }

            list.forEach(item => {
                const card = document.createElement('div');
                card.className = 'history-card';
                card.innerHTML = `
                    <div class="history-top">
                        <span class="history-badge">${item.queryType || 'MATH'}</span>
                        <span style="font-family:var(--font-robotic-mono); font-size:0.7rem; color:var(--text-tertiary);">
                            ${new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                    <div class="history-expr">${item.expression || item.originalPrompt}</div>
                    <div class="history-res">${item.result}</div>
                `;
                card.addEventListener('click', () => {
                    window.soundFx.playClick();
                    window.calcEngine.setResult(item.result, item.expression);
                    historyDrawer.classList.remove('open');
                    showToast(`Restored: ${item.result}`);
                });
                historyList.appendChild(card);
            });
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    }

    // -------------------------------------------------------------------------
    // SETTINGS MODAL
    // -------------------------------------------------------------------------
    settingsToggleBtn.addEventListener('click', () => {
        window.soundFx.playClick();
        settingsModal.classList.add('open');
    });

    settingsCloseBtn.addEventListener('click', () => {
        window.soundFx.playClick();
        settingsModal.classList.remove('open');
    });

    saveApiKeyBtn.addEventListener('click', async () => {
        window.soundFx.playClick();
        const key = apiKeyInput.value.trim();
        savedApiKey = key;
        localStorage.setItem('smartcalc_gemini_key', key);

        try {
            const resp = await fetch('/api/config/key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: key })
            });
            const data = await resp.json();
            checkBackendStatus();
            showToast(data.message || 'API key updated!');
            settingsModal.classList.remove('open');
        } catch (e) {
            showToast('Saved locally.');
            settingsModal.classList.remove('open');
        }
    });

    toggleSoundSwitch.addEventListener('change', (e) => {
        window.soundFx.setEnabled(e.target.checked);
        localStorage.setItem('smartcalc_sound', String(e.target.checked));
    });

    toggleTtsSwitch.addEventListener('change', (e) => {
        window.speechEngine.ttsEnabled = e.target.checked;
        localStorage.setItem('smartcalc_tts', String(e.target.checked));
    });

    voiceLangSelect.addEventListener('change', (e) => {
        window.speechEngine.setLanguage(e.target.value);
        localStorage.setItem('smartcalc_lang', e.target.value);
    });

    if (voicePersonaSelect) {
        voicePersonaSelect.addEventListener('change', (e) => {
            window.speechEngine.setSelectedVoice(e.target.value);
            showToast('Voice updated!');
        });
    }

    if (testVoiceBtn) {
        testVoiceBtn.addEventListener('click', () => {
            window.soundFx.playClick();
            window.speechEngine.speak("Smart voice calculator is ready. The square root of 10 is 3.1623.");
        });
    }

    // -------------------------------------------------------------------------
    // BACKEND STATUS CHECK
    // -------------------------------------------------------------------------
    async function checkBackendStatus() {
        try {
            const resp = await fetch('/api/config/status');
            const data = await resp.json();
            if (data.geminiConfigured || savedApiKey) {
                aiEngineDot.classList.remove('offline');
                aiEngineText.textContent = 'GEMINI AI ACTIVE';
            } else {
                aiEngineDot.classList.add('offline');
                aiEngineText.textContent = 'LOCAL NLP ENGINE READY';
            }
        } catch (e) {
            aiEngineDot.classList.add('offline');
            aiEngineText.textContent = 'OFFLINE MODE';
        }
    }

    // -------------------------------------------------------------------------
    // TOAST NOTIFICATIONS
    // -------------------------------------------------------------------------
    let toastTimeout = null;
    function showToast(msg) {
        if (!toastMsg) return;
        toastMsg.textContent = msg;
        toastMsg.classList.add('show');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastMsg.classList.remove('show');
        }, 2600);
    }

    // Initialize Calculator Liquid Glass Music Player Card
    initCalculatorMusicPlayer();

    // -------------------------------------------------------------------------
    // KEYBOARD SHORTCUTS
    // -------------------------------------------------------------------------
    window.addEventListener('keydown', (e) => {
        if (document.activeElement === textPromptInput || document.activeElement === apiKeyInput) {
            return;
        }

        if (e.key >= '0' && e.key <= '9') {
            window.soundFx.playClick();
            window.calcEngine.append(e.key);
        } else if (e.key === '.') {
            window.soundFx.playClick();
            window.calcEngine.append('.');
        } else if (['+', '-', '*', '/'].includes(e.key)) {
            window.soundFx.playOpClick();
            const map = { '*': '×', '/': '÷' };
            window.calcEngine.append(map[e.key] || e.key);
        } else if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();
            window.soundFx.playCalculate();
            performCalculation();
        } else if (e.key === 'Backspace') {
            window.soundFx.playClick();
            window.calcEngine.deleteLast();
        } else if (e.key === 'Escape') {
            window.soundFx.playClick();
            window.calcEngine.clear();
        } else if (e.key === '(' || e.key === ')') {
            window.soundFx.playClick();
            window.calcEngine.append(e.key);
        }
    });
});
