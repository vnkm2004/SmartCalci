/**
 * Multilingual Voice Processing & Text-to-Speech Engine
 * Robust implementation with per-session SpeechRecognition, Silence Detection, and Anti-GC TTS.
 */
class SpeechEngine {
    constructor() {
        this.activeRecognition = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioStream = null;
        this.isRecording = false;
        this.selectedLanguage = 'auto'; // 'auto', 'en-US', 'hi-IN', 'es-ES', etc.
        this.selectedVoiceURI = localStorage.getItem('smartcalc_selected_voice') || '';
        this.ttsEnabled = true;
        this.ttsRate = 1.0;
        this.ttsPitch = 1.0;
        this.cachedVoices = [];
        this.lastSpokenTranscript = '';
        this.currentUtterance = null; // Guard against Chrome V8 Garbage Collection

        this.initVoices();
    }

    initVoices() {
        if (!window.speechSynthesis) return;

        const load = () => {
            const v = window.speechSynthesis.getVoices();
            if (v && v.length > 0) {
                this.cachedVoices = v;
                if (this.onVoicesLoaded) {
                    this.onVoicesLoaded(this.cachedVoices);
                }
            }
        };

        load();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = load;
        }
    }

    setLanguage(langCode) {
        this.selectedLanguage = langCode;
        if (this.activeRecognition && langCode !== 'auto') {
            this.activeRecognition.lang = langCode;
        }
    }

    setSelectedVoice(voiceURI) {
        this.selectedVoiceURI = voiceURI;
        localStorage.setItem('smartcalc_selected_voice', voiceURI);
    }

    async startRecording(onLiveTranscript, onFinish, onError) {
        if (this.isRecording) return null;
        this.audioChunks = [];
        this.lastSpokenTranscript = '';
        let capturedTranscript = '';
        let silenceTimer = null;
        let isStopped = false;

        const resetSilenceTimer = () => {
            if (silenceTimer) clearTimeout(silenceTimer);
            if (capturedTranscript.trim().length > 0) {
                // Auto-stop after 1.8 seconds of silence once speech has been heard
                silenceTimer = setTimeout(() => {
                    if (!isStopped && onFinish) {
                        onFinish();
                    }
                }, 1800);
            }
        };

        try {
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            this.isRecording = true;

            // MediaRecorder format selection
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
                else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
                else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
            }

            this.mediaRecorder = new MediaRecorder(this.audioStream, { mimeType });
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) this.audioChunks.push(e.data);
            };

            // Instantiate a FRESH SpeechRecognition instance for this recording session
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRec) {
                try {
                    this.activeRecognition = new SpeechRec();
                    this.activeRecognition.continuous = true;
                    this.activeRecognition.interimResults = true;
                    this.activeRecognition.maxAlternatives = 1;
                    this.activeRecognition.lang = this.selectedLanguage === 'auto' ? 'en-US' : this.selectedLanguage;

                    this.activeRecognition.onresult = (event) => {
                        let fullText = '';
                        for (let i = 0; i < event.results.length; ++i) {
                            fullText += event.results[i][0].transcript + ' ';
                        }
                        capturedTranscript = fullText.trim();
                        this.lastSpokenTranscript = capturedTranscript;
                        if (onLiveTranscript) onLiveTranscript(capturedTranscript);
                        resetSilenceTimer();
                    };

                    this.activeRecognition.onerror = (event) => {
                        console.warn('SpeechRecognition notice:', event.error);
                        // Do not crash recording; MediaRecorder audio is still safely capturing
                    };

                    this.activeRecognition.onend = () => {
                        // Recognition naturally ended
                    };

                    this.activeRecognition.start();
                } catch (recErr) {
                    console.warn('SpeechRecognition start notice:', recErr);
                }
            }

            this.mediaRecorder.start(100);

            return {
                stream: this.audioStream,
                stop: () => {
                    return new Promise((resolve) => {
                        if (isStopped) {
                            resolve(null);
                            return;
                        }
                        isStopped = true;
                        this.isRecording = false;
                        if (silenceTimer) clearTimeout(silenceTimer);

                        // Stop speech recognition cleanly
                        if (this.activeRecognition) {
                            try { this.activeRecognition.stop(); } catch (e) {}
                            this.activeRecognition = null;
                        }

                        // Give speech recognition 250ms to finish emitting last chunk
                        setTimeout(() => {
                            if (!this.mediaRecorder) {
                                resolve(null);
                                return;
                            }

                            this.mediaRecorder.onstop = () => {
                                const audioBlob = new Blob(this.audioChunks, { type: mimeType });
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    const base64data = reader.result ? reader.result.split(',')[1] : '';
                                    if (this.audioStream) {
                                        this.audioStream.getTracks().forEach(t => t.stop());
                                    }
                                    resolve({
                                        audioBase64: base64data,
                                        mimeType: mimeType.split(';')[0],
                                        transcript: (capturedTranscript || this.lastSpokenTranscript).trim()
                                    });
                                };
                                reader.readAsDataURL(audioBlob);
                            };

                            try {
                                if (this.mediaRecorder.state !== 'inactive') {
                                    this.mediaRecorder.stop();
                                }
                            } catch (e) {
                                resolve(null);
                            }
                        }, 250);
                    });
                }
            };
        } catch (err) {
            this.isRecording = false;
            if (silenceTimer) clearTimeout(silenceTimer);
            if (onError) onError(err);
            throw err;
        }
    }

    /**
     * Cleans and formats numbers in spoken text to at most 3-4 decimal places
     * e.g. 3.1622776602 -> 3.1623
     */
    cleanTextForSpeech(rawText) {
        if (!rawText) return '';
        let s = String(rawText);

        // Find numbers with more than 3 decimal places and round to 3-4 decimals
        s = s.replace(/(\d+)\.(\d{4,})/g, (match, integerPart, decimalPart) => {
            const num = parseFloat(match);
            if (!isNaN(num)) {
                return (Math.round(num * 10000) / 10000).toString();
            }
            return match;
        });

        // Clean up common math symbols for verbal TTS readability
        s = s.replace(/\bsqrt\(([^)]+)\)/g, 'square root of $1')
             .replace(/\bcbrt\(([^)]+)\)/g, 'cube root of $1')
             .replace(/\b([0-9.]+)\^([0-9.]+)/g, '$1 to the power of $2');

        return s;
    }

    /**
     * Selects the highest quality natural/neural voice available
     */
    getBestVoice(targetLang = 'en-US') {
        const voices = this.cachedVoices.length > 0 ? this.cachedVoices : (window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
        if (!voices || voices.length === 0) return null;

        // 1. If user explicitly picked a voice URI
        if (this.selectedVoiceURI) {
            const chosen = voices.find(v => v.voiceURI === this.selectedVoiceURI || v.name === this.selectedVoiceURI);
            if (chosen) return chosen;
        }

        const langPrefix = targetLang.substring(0, 2).toLowerCase();
        const matchingVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
        const pool = matchingVoices.length > 0 ? matchingVoices : voices;

        // Rank by quality: Natural / Neural > Google > Microsoft > others
        const rankVoice = (voice) => {
            let score = 0;
            const name = voice.name.toLowerCase();
            if (name.includes('natural') || name.includes('online (natural)') || name.includes('neural')) score += 60;
            if (name.includes('google')) score += 35;
            if (name.includes('aria') || name.includes('jenny') || name.includes('guy') || name.includes('samantha')) score += 25;
            if (name.includes('microsoft')) score += 15;
            if (voice.lang.toLowerCase().startsWith(langPrefix)) score += 20;
            if (voice.default) score += 5;
            return score;
        };

        pool.sort((a, b) => rankVoice(b) - rankVoice(a));
        return pool[0] || null;
    }

    speak(text, lang = 'en-US') {
        if (!this.ttsEnabled || !window.speechSynthesis || !text) return;

        // Cancel previous speech
        window.speechSynthesis.cancel();

        // 50ms pause prevents Chrome bug where cancel kills immediate follow-up speak
        setTimeout(() => {
            try {
                const formattedText = this.cleanTextForSpeech(text);
                const utterance = new SpeechSynthesisUtterance(formattedText);
                this.currentUtterance = utterance; // Prevent Chrome V8 garbage collection!

                utterance.rate = this.ttsRate;
                utterance.pitch = this.ttsPitch;

                const bestVoice = this.getBestVoice(lang);
                if (bestVoice) {
                    utterance.voice = bestVoice;
                    utterance.lang = bestVoice.lang;
                }

                utterance.onend = () => {
                    this.currentUtterance = null;
                };

                utterance.onerror = (e) => {
                    console.warn('TTS utterance notice:', e);
                    this.currentUtterance = null;
                };

                window.speechSynthesis.speak(utterance);
            } catch (err) {
                console.warn('Speech synthesis speak exception:', err);
            }
        }, 50);
    }
}

window.speechEngine = new SpeechEngine();
