/**
 * Cyber Beat & Synth Studio - Comprehensive Multi-Instrument Engine
 * Supports:
 * - Configurable columns: 16, 32, 64, up to 128 steps (with +16 / -16 dynamic resize)
 * - Dynamic Instrument Tracks with Add Track & Remove Track capabilities
 * - Authentic Instrument Synthesizers:
 *     * Drums: Kick 808, Snare, Hi-Hat Closed, Hi-Hat Open, Clap, Tom Drum, Crash Cymbal
 *     * Strings & Acoustic: Violin / Strings, Harmonium (Indian Reed/Drone), Acoustic Guitar (Guider)
 *     * Keys & Brass: Grand Piano (Poiono), Jazz Saxophone, Jazz Upright Walking Bass
 *     * Electronic: Sub Bass 808, Synth Pluck, Lead Synth Arp
 * - 11 Diverse Music Genres & Presets (Jazz Lounge, Classical Strings, Harmonium Raga, Cyberpunk, Trap, etc.)
 * - 4 Smart Generative Random Modes (All, Drums, Melodies, Glitch)
 * - Per-track Mute [M], Solo [S], and Volume Controls
 * - 16-bit Stereo PCM WAV Exporter supporting up to 128 columns
 */
class MusicCreatorEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.visualizer = null;
        this.isPlaying = false;
        this.bpm = 120;
        this.currentStep = 0;
        this.nextStepTime = 0;
        this.timerId = null;
        this.currentKit = 'cyberpunk';
        this.currentWaveform = 'sawtooth';

        // Column / Step configuration: default 16, max 128
        this.numSteps = 16;
        this.maxSteps = 128;

        // Instrument definitions catalogue
        this.instrumentCatalogue = {
            'kick': { name: 'Kick 808', color: 'orange', category: 'drums' },
            'snare': { name: 'Snare / Rim', color: 'yellow', category: 'drums' },
            'hihat_cl': { name: 'Hi-Hat Cl', color: 'magenta', category: 'drums' },
            'hihat_op': { name: 'Hi-Hat Op', color: 'magenta', category: 'drums' },
            'clap': { name: 'Cyber Clap', color: 'blue', category: 'drums' },
            'tom': { name: 'Tom Drum', color: 'orange', category: 'drums' },
            'crash': { name: 'Crash Cymbal', color: 'yellow', category: 'drums' },
            'tabla_bayan': { name: 'Tabla Bayan (Bass Dha)', color: 'purple', category: 'drums' },
            'tabla_dayan': { name: 'Tabla Dayan (High Na)', color: 'yellow', category: 'drums' },
            'rimshot': { name: 'Rimshot Click', color: 'blue', category: 'drums' },
            'flute': { name: 'Bansuri Bamboo Flute', color: 'emerald', category: 'acoustic' },
            'sitar': { name: 'Indian Sitar', color: 'orange', category: 'acoustic' },
            'harmonium': { name: 'Harmonium (Reed)', color: 'yellow', category: 'acoustic' },
            'violin': { name: 'Violin / Strings', color: 'purple', category: 'acoustic' },
            'guitar': { name: 'Acoustic Guitar', color: 'cyan', category: 'acoustic' },
            'piano': { name: 'Grand Piano', color: 'emerald', category: 'keys' },
            'jazz_sax': { name: 'Jazz Saxophone', color: 'orange', category: 'keys' },
            'jazz_bass': { name: 'Jazz Upright Bass', color: 'blue', category: 'bass' },
            'sub_bass': { name: 'Sub Bass 808', color: 'cyan', category: 'bass' },
            'synth_pluck': { name: 'Synth Pluck', color: 'purple', category: 'synth' },
            'lead_synth': { name: 'Lead Synth', color: 'emerald', category: 'synth' },
            'chiptune': { name: '8-Bit Chiptune', color: 'cyan', category: 'synth' }
        };

        // Active keyboard instrument sound
        this.activeKeyboardInstrument = 'piano';
        this.currentOctave = 4; // C4 default

        // 12 Presets catalogue for cycling
        this.STYLES = [
            { key: 'cyberpunk', name: 'Cyberpunk' },
            { key: 'trap', name: 'Trap 808' },
            { key: 'lofi', name: 'Lo-Fi Chill' },
            { key: 'jazz', name: 'Jazz Lounge' },
            { key: 'classical', name: 'Classical Strings' },
            { key: 'harmonium', name: 'Harmonium Raga' },
            { key: 'indian_raga', name: 'Indian Raga Fusion' },
            { key: 'techno', name: 'EDM Techno' },
            { key: 'synthwave', name: 'Synthwave' },
            { key: 'futurebass', name: 'Future Bass' },
            { key: 'drill', name: 'UK Drill' },
            { key: 'chiptune', name: '8-Bit Arcade' }
        ];
        this.currentPreset = 'cyberpunk';

        // Active tracks in the sequencer
        this.tracks = [];
        this.initDefaultTracks();

        // Musical scale pitches (C4 to C5)
        this.notePitches = [
            261.63, // C4
            277.18, // C#4
            293.66, // D4
            311.13, // D#4
            329.63, // E4
            349.23, // F4
            369.99, // F#4
            392.00, // G4
            415.30, // G#4
            440.00, // A4
            466.16, // A#4
            493.88, // B4
            523.25  // C5
        ];

        this.stepCallbacks = [];
        this.initDefaultPattern('cyberpunk');
    }

    initDefaultTracks() {
        const defaultInsts = [
            'kick',
            'snare',
            'hihat_cl',
            'clap',
            'sub_bass',
            'piano',
            'violin',
            'lead_synth'
        ];
        this.tracks = defaultInsts.map(instKey => this.createTrackObject(instKey));
    }

    createTrackObject(instKey) {
        const meta = this.instrumentCatalogue[instKey] || { name: instKey, color: 'blue', category: 'synth' };
        return {
            id: 'trk_' + Math.random().toString(36).substr(2, 9),
            instrument: instKey,
            name: meta.name,
            color: meta.color,
            muted: false,
            soloed: false,
            volume: 0.85,
            pattern: new Array(this.maxSteps).fill(false),
            pitches: new Array(this.maxSteps).fill(440)
        };
    }

    addTrack(instKey) {
        if (this.tracks.length >= 16) return null; // Max 16 tracks
        const track = this.createTrackObject(instKey);
        this.tracks.push(track);
        return track;
    }

    removeTrack(trackIndex) {
        if (this.tracks.length <= 1) return false;
        if (trackIndex >= 0 && trackIndex < this.tracks.length) {
            this.tracks.splice(trackIndex, 1);
            return true;
        }
        return false;
    }

    setStepCount(count) {
        const clamped = Math.min(128, Math.max(16, count));
        this.numSteps = clamped;
        if (this.currentStep >= this.numSteps) {
            this.currentStep = 0;
        }
        return this.numSteps;
    }

    initAudio() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (!this.masterGain && this.ctx) {
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

            // Master compressor for studio punch & clarity
            const comp = this.ctx.createDynamicsCompressor();
            comp.threshold.setValueAtTime(-14, this.ctx.currentTime);
            comp.knee.setValueAtTime(10, this.ctx.currentTime);
            comp.ratio.setValueAtTime(4, this.ctx.currentTime);
            comp.attack.setValueAtTime(0.004, this.ctx.currentTime);
            comp.release.setValueAtTime(0.08, this.ctx.currentTime);

            this.masterGain.connect(comp);
            comp.connect(this.ctx.destination);

            if (this.visualizer) {
                this.visualizer.connectAudioNode(this.masterGain, this.ctx);
            }
        }
    }

    setVisualizer(vis) {
        this.visualizer = vis;
        if (this.masterGain && this.ctx && vis) {
            vis.connectAudioNode(this.masterGain, this.ctx);
        }
    }

    onStep(cb) {
        this.stepCallbacks.push(cb);
    }

    setBpm(bpm) {
        this.bpm = Math.max(50, Math.min(240, bpm));
    }

    setWaveform(wave) {
        this.currentWaveform = wave;
    }

    toggleMute(trackIdx) {
        if (trackIdx >= 0 && trackIdx < this.tracks.length) {
            this.tracks[trackIdx].muted = !this.tracks[trackIdx].muted;
            return this.tracks[trackIdx].muted;
        }
        return false;
    }

    toggleSolo(trackIdx) {
        if (trackIdx >= 0 && trackIdx < this.tracks.length) {
            this.tracks[trackIdx].soloed = !this.tracks[trackIdx].soloed;
            return this.tracks[trackIdx].soloed;
        }
        return false;
    }

    isTrackAudible(trackIdx) {
        if (trackIdx < 0 || trackIdx >= this.tracks.length) return false;
        if (this.tracks[trackIdx].muted) return false;
        const hasSolo = this.tracks.some(t => t.soloed);
        if (hasSolo) return this.tracks[trackIdx].soloed;
        return true;
    }

    toggleStep(trackIdx, stepIdx) {
        if (trackIdx >= 0 && trackIdx < this.tracks.length && stepIdx >= 0 && stepIdx < this.maxSteps) {
            this.tracks[trackIdx].pattern[stepIdx] = !this.tracks[trackIdx].pattern[stepIdx];
            return this.tracks[trackIdx].pattern[stepIdx];
        }
        return false;
    }

    setStep(trackIdx, stepIdx, state) {
        if (trackIdx >= 0 && trackIdx < this.tracks.length && stepIdx >= 0 && stepIdx < this.maxSteps) {
            this.tracks[trackIdx].pattern[stepIdx] = Boolean(state);
            return this.tracks[trackIdx].pattern[stepIdx];
        }
        return false;
    }

    clearPattern() {
        this.tracks.forEach(track => {
            track.pattern.fill(false);
        });
    }

    // -------------------------------------------------------------------------
    // 4 SMART GENERATIVE RANDOM MODES
    // -------------------------------------------------------------------------
    randomizeAll() {
        this.clearPattern();
        this.randomizeDrums();
        this.randomizeMelody();
    }

    randomizeDrums() {
        this.tracks.forEach(track => {
            const meta = this.instrumentCatalogue[track.instrument];
            if (meta && meta.category === 'drums') {
                for (let s = 0; s < this.numSteps; s++) {
                    if (track.instrument === 'kick') {
                        if (s % 8 === 0 || (Math.random() < 0.25 && s % 2 === 0)) track.pattern[s] = true;
                    } else if (track.instrument === 'snare' || track.instrument === 'clap') {
                        if (s % 8 === 4) track.pattern[s] = true;
                    } else if (track.instrument === 'hihat_cl') {
                        if (s % 2 === 0 || Math.random() < 0.35) track.pattern[s] = true;
                    } else if (track.instrument === 'hihat_op') {
                        if (s % 4 === 2 && Math.random() < 0.5) track.pattern[s] = true;
                    } else if (track.instrument === 'tom' || track.instrument === 'crash') {
                        if (s === 0 && Math.random() < 0.4) track.pattern[s] = true;
                        if (s % 16 === 14 && Math.random() < 0.3) track.pattern[s] = true;
                    }
                }
            }
        });
    }

    randomizeMelody() {
        const pentatonic = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25];
        this.tracks.forEach(track => {
            const meta = this.instrumentCatalogue[track.instrument];
            if (meta && meta.category !== 'drums') {
                for (let s = 0; s < this.numSteps; s++) {
                    if (meta.category === 'bass') {
                        if (s % 4 === 0 || (Math.random() < 0.3 && s % 2 === 0)) {
                            track.pattern[s] = true;
                            track.pitches[s] = pentatonic[Math.floor(Math.random() * pentatonic.length)] * 0.25;
                        }
                    } else {
                        if (Math.random() < 0.32) {
                            track.pattern[s] = true;
                            track.pitches[s] = pentatonic[Math.floor(Math.random() * pentatonic.length)];
                        }
                    }
                }
            }
        });
    }

    randomizeGlitch() {
        this.clearPattern();
        this.tracks.forEach(track => {
            for (let s = 0; s < this.numSteps; s++) {
                if (Math.random() < 0.28) {
                    track.pattern[s] = true;
                    track.pitches[s] = this.notePitches[Math.floor(Math.random() * this.notePitches.length)];
                }
            }
        });
    }

    // -------------------------------------------------------------------------
    // 11 DIVERSE MUSIC GENRES & PRESETS
    // -------------------------------------------------------------------------
    initDefaultPattern(preset) {
        this.currentKit = preset;
        this.currentPreset = preset;
        this.clearPattern();
        const steps = this.numSteps;
        if (this.ctx && this.isPlaying) {
            this.nextStepTime = this.ctx.currentTime + 0.02;
            this.currentStep = 0;
        }

        // Custom preset tracks setup
        if (preset === 'jazz') {
            this.bpm = 105;
            this.tracks = [
                this.createTrackObject('kick'),
                this.createTrackObject('snare'),
                this.createTrackObject('hihat_cl'),
                this.createTrackObject('jazz_bass'),
                this.createTrackObject('piano'),
                this.createTrackObject('jazz_sax')
            ];
            for (let b = 0; b < steps; b += 16) {
                [0, 6, 10].forEach(s => this.tracks[0].pattern[b + s] = true);
                [4, 12].forEach(s => this.tracks[1].pattern[b + s] = true);
                for (let s = 0; s < 16; s += 2) this.tracks[2].pattern[b + s] = true;
                // Walking jazz bass
                [0, 4, 8, 12].forEach((s, idx) => {
                    this.tracks[3].pattern[b + s] = true;
                    this.tracks[3].pitches[b + s] = [130.81, 146.83, 164.81, 174.61][idx % 4];
                });
                // Piano chords
                [2, 6, 10, 14].forEach(s => {
                    this.tracks[4].pattern[b + s] = true;
                    this.tracks[4].pitches[b + s] = 329.63;
                });
                // Sax lead
                [1, 5, 8, 13].forEach(s => {
                    this.tracks[5].pattern[b + s] = true;
                    this.tracks[5].pitches[b + s] = 392.00;
                });
            }
        } else if (preset === 'classical') {
            this.bpm = 96;
            this.tracks = [
                this.createTrackObject('violin'),
                this.createTrackObject('guitar'),
                this.createTrackObject('piano'),
                this.createTrackObject('sub_bass'),
                this.createTrackObject('clap')
            ];
            for (let b = 0; b < steps; b += 16) {
                // Violin melody
                [0, 3, 6, 8, 11, 14].forEach((s, idx) => {
                    this.tracks[0].pattern[b + s] = true;
                    this.tracks[0].pitches[b + s] = [329.63, 392.00, 440.00, 523.25][idx % 4];
                });
                // Guitar arpeggio
                for (let s = 0; s < 16; s += 2) {
                    this.tracks[1].pattern[b + s] = true;
                    this.tracks[1].pitches[b + s] = 261.63 * (1 + (s % 4) * 0.25);
                }
                // Piano chords
                [0, 8].forEach(s => this.tracks[2].pattern[b + s] = true);
                [0, 8].forEach(s => this.tracks[3].pattern[b + s] = true);
                [4, 12].forEach(s => this.tracks[4].pattern[b + s] = true);
            }
        } else if (preset === 'harmonium') {
            this.bpm = 92;
            this.tracks = [
                this.createTrackObject('harmonium'),
                this.createTrackObject('guitar'),
                this.createTrackObject('kick'),
                this.createTrackObject('clap'),
                this.createTrackObject('sub_bass')
            ];
            for (let b = 0; b < steps; b += 16) {
                // Harmonium sustained drone & melodic phrases
                [0, 2, 4, 6, 8, 10, 12, 14].forEach((s, idx) => {
                    this.tracks[0].pattern[b + s] = true;
                    this.tracks[0].pitches[b + s] = [261.63, 293.66, 329.63, 392.00, 440.00][idx % 5];
                });
                // Guitar plucks
                [1, 5, 9, 13].forEach(s => this.tracks[1].pattern[b + s] = true);
                [0, 8, 10].forEach(s => this.tracks[2].pattern[b + s] = true);
                [4, 12].forEach(s => this.tracks[3].pattern[b + s] = true);
                [0, 6, 8, 14].forEach(s => this.tracks[4].pattern[b + s] = true);
            }
        } else if (preset === 'indian_raga') {
            this.bpm = 104;
            this.tracks = [
                this.createTrackObject('tabla_bayan'),
                this.createTrackObject('tabla_dayan'),
                this.createTrackObject('harmonium'),
                this.createTrackObject('flute'),
                this.createTrackObject('sitar'),
                this.createTrackObject('sub_bass')
            ];
            for (let b = 0; b < steps; b += 16) {
                // Tabla Bayan deep pitch-sliding bass (Dha/Ghe on 0, 6, 8, 14)
                [0, 6, 8, 14].forEach(s => this.tracks[0].pattern[b + s] = true);
                // Tabla Dayan crisp ringing treble (Na/Tin on 2, 4, 10, 12)
                [2, 4, 10, 12].forEach(s => this.tracks[1].pattern[b + s] = true);
                // Harmonium sustained meditative drone (C3 & G3)
                [0, 8].forEach((s, idx) => {
                    this.tracks[2].pattern[b + s] = true;
                    this.tracks[2].pitches[b + s] = [261.63, 392.00][idx % 2];
                });
                // Bansuri Bamboo Flute lyrical phrases (Raag Yaman)
                [0, 3, 7, 10, 13].forEach((s, idx) => {
                    this.tracks[3].pattern[b + s] = true;
                    this.tracks[3].pitches[b + s] = [293.66, 329.63, 392.00, 440.00, 523.25][idx % 5];
                });
                // Sitar intricate ornamentations & meend twang
                [1, 5, 9, 12, 15].forEach((s, idx) => {
                    this.tracks[4].pattern[b + s] = true;
                    this.tracks[4].pitches[b + s] = [392.00, 440.00, 493.88, 523.25, 587.33][idx % 5];
                });
                // Deep acoustic sub drone
                [0, 8].forEach(s => {
                    this.tracks[5].pattern[b + s] = true;
                    this.tracks[5].pitches[b + s] = 65.41;
                });
            }
        } else if (preset === 'lofi') {
            this.bpm = 84;
            this.initDefaultTracks();
            for (let b = 0; b < steps; b += 16) {
                [0, 7, 10].forEach(s => this.tracks[0].pattern[b + s] = true);
                [4, 12].forEach(s => this.tracks[1].pattern[b + s] = true);
                for (let s = 0; s < 16; s += 2) this.tracks[2].pattern[b + s] = true;
                [0, 6, 10].forEach(s => this.tracks[4].pattern[b + s] = true);
                [0, 4, 8, 12].forEach(s => this.tracks[5].pattern[b + s] = true);
                [2, 6, 10, 14].forEach(s => this.tracks[6].pattern[b + s] = true);
            }
        } else if (preset === 'trap') {
            this.bpm = 140;
            this.initDefaultTracks();
            for (let b = 0; b < steps; b += 16) {
                [0, 5, 8, 11].forEach(s => this.tracks[0].pattern[b + s] = true);
                [4, 12].forEach(s => this.tracks[1].pattern[b + s] = true);
                for (let s = 0; s < 16; s++) if (s !== 7 && s !== 15) this.tracks[2].pattern[b + s] = true;
                [4, 12].forEach(s => this.tracks[3].pattern[b + s] = true);
                [0, 5, 8, 11].forEach(s => this.tracks[4].pattern[b + s] = true);
                [3, 7, 11, 15].forEach(s => this.tracks[7].pattern[b + s] = true);
            }
        } else if (preset === 'techno') {
            this.bpm = 135;
            this.tracks = [
                this.createTrackObject('kick'),
                this.createTrackObject('hihat_op'),
                this.createTrackObject('hihat_cl'),
                this.createTrackObject('clap'),
                this.createTrackObject('sub_bass'),
                this.createTrackObject('synth_pluck')
            ];
            for (let b = 0; b < steps; b += 16) {
                // Driving 4/4 Four-on-the-floor Kicks
                [0, 4, 8, 12].forEach(s => this.tracks[0].pattern[b + s] = true);
                // Open offbeat hi-hat (classic techno heartbeat)
                [2, 6, 10, 14].forEach(s => this.tracks[1].pattern[b + s] = true);
                // Rolling closed 16th hats
                for (let s = 0; s < 16; s++) {
                    if (s % 2 !== 0) this.tracks[2].pattern[b + s] = true;
                }
                // Hard techno clap on 4 and 12
                [4, 12].forEach(s => this.tracks[3].pattern[b + s] = true);
                // Rumble sub-bass syncopated pump
                [2, 5, 10, 13].forEach((s, idx) => {
                    this.tracks[4].pattern[b + s] = true;
                    this.tracks[4].pitches[b + s] = [55.00, 65.41][idx % 2];
                });
                // Hypnotic acid techno synth arpeggio
                [0, 3, 6, 8, 11, 14].forEach((s, idx) => {
                    this.tracks[5].pattern[b + s] = true;
                    this.tracks[5].pitches[b + s] = [220.00, 261.63, 329.63, 392.00][idx % 4];
                });
            }
        } else if (preset === 'synthwave') {
            this.bpm = 118;
            this.tracks = [
                this.createTrackObject('kick'),
                this.createTrackObject('snare'),
                this.createTrackObject('hihat_cl'),
                this.createTrackObject('sub_bass'),
                this.createTrackObject('lead_synth'),
                this.createTrackObject('piano')
            ];
            for (let b = 0; b < steps; b += 16) {
                // 80s punchy kick
                [0, 6, 8, 10].forEach(s => this.tracks[0].pattern[b + s] = true);
                // Gated 80s snare on 4 and 12
                [4, 12].forEach(s => this.tracks[1].pattern[b + s] = true);
                // Straight 8th notes
                for (let s = 0; s < 16; s += 2) this.tracks[2].pattern[b + s] = true;
                // 16th-note galloping synthwave bassline
                for (let s = 0; s < 16; s++) {
                    this.tracks[3].pattern[b + s] = true;
                    this.tracks[3].pitches[b + s] = (s % 2 === 0) ? 110.00 : 220.00;
                }
                // Iconic outrun synth lead melody (D minor pentatonic)
                [0, 3, 6, 8, 11, 14].forEach((s, idx) => {
                    this.tracks[4].pattern[b + s] = true;
                    this.tracks[4].pitches[b + s] = [293.66, 349.23, 440.00, 523.25, 440.00, 349.23][idx % 6];
                });
                // Retro warm piano chords
                [0, 8].forEach(s => this.tracks[5].pattern[b + s] = true);
            }
        } else if (preset === 'futurebass') {
            this.bpm = 150;
            this.tracks = [
                this.createTrackObject('kick'),
                this.createTrackObject('clap'),
                this.createTrackObject('hihat_cl'),
                this.createTrackObject('sub_bass'),
                this.createTrackObject('lead_synth'),
                this.createTrackObject('synth_pluck')
            ];
            for (let b = 0; b < steps; b += 16) {
                // Future bass syncopated kicks
                [0, 3, 8, 11].forEach(s => this.tracks[0].pattern[b + s] = true);
                // Big halftime clap on beat 8
                [8].forEach(s => this.tracks[1].pattern[b + s] = true);
                // Trap hat flurries
                [0, 2, 4, 6, 7, 10, 12, 14, 15].forEach(s => this.tracks[2].pattern[b + s] = true);
                // 808 Glide Bass
                [0, 3, 8, 11].forEach(s => {
                    this.tracks[3].pattern[b + s] = true;
                    this.tracks[3].pitches[b + s] = 65.41;
                });
                // Lush pulsing supersaw chords
                [0, 3, 6, 9, 12].forEach((s, idx) => {
                    this.tracks[4].pattern[b + s] = true;
                    this.tracks[4].pitches[b + s] = [329.63, 392.00, 440.00, 493.88, 523.25][idx % 5];
                });
                // High kawaii arpeggio plucks
                [2, 5, 8, 11, 14].forEach((s, idx) => {
                    this.tracks[5].pattern[b + s] = true;
                    this.tracks[5].pitches[b + s] = [587.33, 659.25, 783.99][idx % 3];
                });
            }
        } else if (preset === 'drill') {
            this.bpm = 142;
            this.tracks = [
                this.createTrackObject('kick'),
                this.createTrackObject('snare'),
                this.createTrackObject('hihat_cl'),
                this.createTrackObject('sub_bass'),
                this.createTrackObject('piano'),
                this.createTrackObject('violin')
            ];
            for (let b = 0; b < steps; b += 16) {
                // UK drill sliding kick syncopation
                [0, 5, 8, 10].forEach(s => this.tracks[0].pattern[b + s] = true);
                // True UK drill 3rd/8th bounce snare on 6 and 14
                [6, 14].forEach(s => this.tracks[1].pattern[b + s] = true);
                // Staggered drill hi-hat roll triplets
                [0, 2, 3, 5, 8, 10, 11, 13, 15].forEach(s => this.tracks[2].pattern[b + s] = true);
                // Sliding 808 sub bass with dramatic octave slides
                [0, 4, 8, 11, 14].forEach((s, idx) => {
                    this.tracks[3].pattern[b + s] = true;
                    this.tracks[3].pitches[b + s] = [55.00, 73.42, 55.00, 82.41, 110.00][idx % 5];
                });
                // Dark minor drill piano
                [0, 4, 7, 10, 13].forEach((s, idx) => {
                    this.tracks[4].pattern[b + s] = true;
                    this.tracks[4].pitches[b + s] = [220.00, 261.63, 293.66, 329.63][idx % 4];
                });
                // Eerie drill string accent
                [0, 8].forEach(s => {
                    this.tracks[5].pattern[b + s] = true;
                    this.tracks[5].pitches[b + s] = 440.00;
                });
            }
        } else if (preset === 'chiptune') {
            this.bpm = 160;
            this.tracks = [
                this.createTrackObject('kick'),
                this.createTrackObject('snare'),
                this.createTrackObject('hihat_cl'),
                this.createTrackObject('synth_pluck'),
                this.createTrackObject('lead_synth'),
                this.createTrackObject('sub_bass')
            ];
            for (let b = 0; b < steps; b += 16) {
                // 8-bit arcade punch kick
                [0, 4, 8, 12].forEach(s => this.tracks[0].pattern[b + s] = true);
                // White noise arcade snare
                [4, 12].forEach(s => this.tracks[1].pattern[b + s] = true);
                // Rapid noise ticks
                for (let s = 0; s < 16; s += 2) this.tracks[2].pattern[b + s] = true;
                // Bouncing square-wave bass
                [0, 2, 4, 6, 8, 10, 12, 14].forEach((s, idx) => {
                    this.tracks[3].pattern[b + s] = true;
                    this.tracks[3].pitches[b + s] = [130.81, 164.81, 196.00, 261.63][idx % 4];
                });
                // Blistering fast MegaMan / Mario chiptune arpeggio across all 16 steps
                for (let s = 0; s < 16; s++) {
                    this.tracks[4].pattern[b + s] = true;
                    this.tracks[4].pitches[b + s] = [523.25, 659.25, 783.99, 1046.50][s % 4];
                }
                // Underpinning arcade bass
                [0, 8].forEach(s => {
                    this.tracks[5].pattern[b + s] = true;
                    this.tracks[5].pitches[b + s] = 65.41;
                });
            }
        } else {
            // Default Cyberpunk
            this.bpm = 128;
            this.initDefaultTracks();
            for (let b = 0; b < steps; b += 16) {
                [0, 6, 8, 14].forEach(s => this.tracks[0].pattern[b + s] = true);
                [4, 12].forEach(s => this.tracks[1].pattern[b + s] = true);
                for (let s = 0; s < 16; s += 2) this.tracks[2].pattern[b + s] = true;
                [4, 12].forEach(s => this.tracks[3].pattern[b + s] = true);
                [0, 3, 6, 8, 10, 14].forEach(s => this.tracks[4].pattern[b + s] = true);
                [0, 2, 6, 8, 10, 14].forEach(s => this.tracks[7].pattern[b + s] = true);
            }
        }
    }

    // -------------------------------------------------------------------------
    // AUTHENTIC INSTRUMENT SYNTHESIZERS
    // -------------------------------------------------------------------------
    playInstrument(instKey, freq = 440, time = 0, customCtx = null, customDest = null) {
        switch (instKey) {
            case 'kick': this.playKick(time, customCtx, customDest); break;
            case 'snare': this.playSnare(time, customCtx, customDest); break;
            case 'hihat_cl': this.playHiHat(time, false, customCtx, customDest); break;
            case 'hihat_op': this.playHiHat(time, true, customCtx, customDest); break;
            case 'clap': this.playClap(time, customCtx, customDest); break;
            case 'tom': this.playTom(time, customCtx, customDest); break;
            case 'crash': this.playCrash(time, customCtx, customDest); break;
            case 'flute': this.playFlute(freq, time, customCtx, customDest); break;
            case 'sitar': this.playSitar(freq, time, customCtx, customDest); break;
            case 'tabla_bayan': this.playTabla('bayan', time, customCtx, customDest); break;
            case 'tabla_dayan': this.playTabla('dayan', time, customCtx, customDest); break;
            case 'rimshot': this.playRimshot(time, customCtx, customDest); break;
            case 'violin': this.playViolin(freq, time, customCtx, customDest); break;
            case 'harmonium': this.playHarmonium(freq, time, customCtx, customDest); break;
            case 'guitar': this.playGuitar(freq, time, customCtx, customDest); break;
            case 'piano': this.playPiano(freq, time, customCtx, customDest); break;
            case 'jazz_sax': this.playJazzSax(freq, time, customCtx, customDest); break;
            case 'jazz_bass': this.playJazzBass(freq, time, customCtx, customDest); break;
            case 'sub_bass': this.playSubBass(freq, time, customCtx, customDest); break;
            case 'synth_pluck': this.playPluck(freq, time, customCtx, customDest); break;
            case 'chiptune': this.playChiptune(freq, time, customCtx, customDest); break;
            case 'lead_synth':
            default:
                this.playLead(freq, time, customCtx, customDest); break;
        }
    }

    playKick(time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.setValueAtTime(145, t);
        osc.frequency.exponentialRampToValueAtTime(36, t + 0.08);

        gain.gain.setValueAtTime(1.0, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.32);
    }

    playSnare(time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;

        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
        oscGain.gain.setValueAtTime(0.5, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(oscGain);
        oscGain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.12);

        const bufferSize = Math.floor(ctx.sampleRate * 0.18);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(900, t);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.65, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(dest);
        noise.start(t);
        noise.stop(t + 0.18);
    }

    playHiHat(time = 0, isOpen = false, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;
        const duration = isOpen ? 0.28 : 0.055;

        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7500, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noise.start(t);
        noise.stop(t + duration);
    }

    playClap(time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;

        const duration = 0.22;
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noise.start(t);
        noise.stop(t + duration);
    }

    playTom(time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(65, t + 0.25);
        gain.gain.setValueAtTime(0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.25);
    }

    playCrash(time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;
        const duration = 0.8;

        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(5000, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noise.start(t);
        noise.stop(t + duration);
    }

    // Violin / Strings (Bowed Saw with Warm Vibrato)
    playViolin(freq = 440, time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;
        const duration = 0.45;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, t);
        osc2.frequency.setValueAtTime(freq * 1.004, t); // Detuned warmth

        // Vibrato LFO
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(5.5, t); // 5.5 Hz vibrato
        lfoGain.gain.setValueAtTime(3.5, t);
        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);
        lfo.start(t);
        lfo.stop(t + duration);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq * 2.2, t);
        filter.Q.setValueAtTime(2.0, t);

        // Gentle bowed attack
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.65, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + duration);
        osc2.stop(t + duration);
    }

    // Harmonium (Indian Reed with rich bellows resonance)
    playHarmonium(freq = 261.63, time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;
        const duration = 0.55;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'square';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, t);
        osc2.frequency.setValueAtTime(freq * 2.002, t); // Octave reed

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.Q.setValueAtTime(4.0, t); // Characteristic reed resonance

        gain.gain.setValueAtTime(0.05, t);
        gain.gain.linearRampToValueAtTime(0.55, t + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + duration);
        osc2.stop(t + duration);
    }

    // Acoustic Guitar (Guider - Plucked String Dynamics)
    playGuitar(freq = 330, time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;
        const duration = 0.38;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3600, t);
        filter.frequency.exponentialRampToValueAtTime(400, t + duration);

        gain.gain.setValueAtTime(0.85, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc.start(t);
        osc.stop(t + duration);
    }

    // Grand Piano (Poiono - Acoustic Hammer & Harmonics)
    playPiano(freq = 440, time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;
        const duration = 0.65;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(freq, t);
        osc2.frequency.setValueAtTime(freq * 2, t);

        gain.gain.setValueAtTime(0.9, t);
        gain.gain.exponentialRampToValueAtTime(0.2, t + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(dest);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + duration);
        osc2.stop(t + duration);
    }

    // Jazz Saxophone (Warm reed brass with vibrato)
    playJazzSax(freq = 392, time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;
        const duration = 0.48;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq * 1.8, t);
        filter.Q.setValueAtTime(3.0, t);

        gain.gain.setValueAtTime(0.05, t);
        gain.gain.linearRampToValueAtTime(0.65, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc.start(t);
        osc.stop(t + duration);
    }

    // Jazz Upright Walking Bass
    playJazzBass(freq = 130.81, time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;
        const duration = 0.35;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.96, t + duration);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, t);

        gain.gain.setValueAtTime(0.9, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc.start(t);
        osc.stop(t + duration);
    }

    // Sub Bass 808
    playSubBass(freq = 65.41, time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;
        const duration = 0.32;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, t);

        gain.gain.setValueAtTime(0.85, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc.start(t);
        osc.stop(t + duration);
    }

    playPluck(freq = 330, time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;
        const duration = 0.16;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.65, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + duration);
    }

    playLead(freq = 440, time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;
        const duration = 0.22;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = this.currentWaveform;
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.55, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + duration);
    }

    // Bansuri Bamboo Flute (Soft breath noise, 5Hz vibrato, warm odd harmonics)
    playFlute(freq = 440, time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;
        const duration = 0.55;

        // Fundamental sine + soft triangle overtone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, t);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, t);

        // LFO Vibrato (Bansuri meend at 5.2 Hz)
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(5.2, t);
        lfoGain.gain.setValueAtTime(freq * 0.015, t);
        lfo.connect(osc1.frequency);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(Math.min(2400, freq * 3.5), t);

        // Soft breath attack envelope
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.70, t + 0.06);
        gain.gain.setValueAtTime(0.65, t + duration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        // Breath noise layer (bamboo wind rush)
        const bufferSize = Math.floor(ctx.sampleRate * 0.12);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(freq * 1.5, t);
        noiseFilter.Q.setValueAtTime(4.0, t);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.12, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(dest);

        osc1.start(t);
        osc2.start(t);
        lfo.start(t);
        noise.start(t);

        osc1.stop(t + duration);
        osc2.stop(t + duration);
        lfo.stop(t + duration);
    }

    // Indian Tabla (Bayan bass Dha/Ghe with pitch bend, Dayan high ringing Na/Tin)
    playTabla(stroke = 'bayan', time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;

        if (stroke === 'bayan') {
            // Bayan (Dha/Ghe): Pitch drop from 88 Hz to 48 Hz (signature Indian pitch-bend)
            const duration = 0.38;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(88, t);
            osc.frequency.exponentialRampToValueAtTime(48, t + 0.18);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(320, t);

            gain.gain.setValueAtTime(0.95, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(dest);

            osc.start(t);
            osc.stop(t + duration);
        } else {
            // Dayan (Na/Tin): Clear, resonant ringing metallic bell tone at 330 Hz with harmonic overtone at 660 Hz
            const duration = 0.28;
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(330, t);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(660, t);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(660, t);
            filter.Q.setValueAtTime(5.0, t);

            gain.gain.setValueAtTime(0.85, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

            osc1.connect(gain);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(dest);

            // Crisp skin rim tick
            const click = ctx.createOscillator();
            const clickGain = ctx.createGain();
            click.type = 'triangle';
            click.frequency.setValueAtTime(1400, t);
            clickGain.gain.setValueAtTime(0.4, t);
            clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
            click.connect(clickGain);
            clickGain.connect(dest);

            osc1.start(t);
            osc2.start(t);
            click.start(t);
            osc1.stop(t + duration);
            osc2.stop(t + duration);
            click.stop(t + 0.03);
        }
    }

    // Indian Sitar (Sympathetic strings, jawari buzzing twang, fast filter envelope)
    playSitar(freq = 440, time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;
        const duration = 0.48;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, t);

        // Sympathetic 5th drone
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq * 1.498, t);

        // Jawari bridge buzzing filter sweep
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3600, t);
        filter.frequency.exponentialRampToValueAtTime(freq * 1.2, t + 0.22);
        filter.Q.setValueAtTime(4.5, t);

        gain.gain.setValueAtTime(0.75, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + duration);
        osc2.stop(t + duration);
    }

    // Rimshot Click
    playRimshot(time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;
        const duration = 0.06;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(550, t);
        osc.frequency.exponentialRampToValueAtTime(220, t + duration);

        gain.gain.setValueAtTime(0.75, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(t);
        osc.stop(t + duration);
    }

    // 8-Bit Chiptune Square Wave
    playChiptune(freq = 440, time = 0, customCtx = null, customDest = null) {
        const ctx = customCtx || this.ctx;
        const dest = customDest || this.masterGain;
        if (!ctx) return;
        const t = time || ctx.currentTime;
        const duration = 0.16;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(t);
        osc.stop(t + duration);
    }

    setVisualizer(vis) {
        if (!this.visualizers) this.visualizers = [];
        if (vis && !this.visualizers.includes(vis)) {
            this.visualizers.push(vis);
        }
        this.visualizer = vis;
    }

    dispatchVisualizerEnergy(inst, freq = 440) {
        const list = (this.visualizers && this.visualizers.length) ? this.visualizers : (this.visualizer ? [this.visualizer] : []);
        list.forEach(v => {
            if (v && typeof v.injectEnergy === 'function') {
                v.injectEnergy(inst, freq);
            }
        });
    }

    playNote(freq) {
        this.initAudio();
        const inst = this.activeKeyboardInstrument || 'piano';
        this.playInstrument(inst, freq, this.ctx.currentTime);
        this.dispatchVisualizerEnergy(inst, freq);
    }

    setKeyboardInstrument(instKey) {
        if (this.instrumentCatalogue[instKey]) {
            this.activeKeyboardInstrument = instKey;
        }
    }

    setOctave(oct) {
        this.currentOctave = Math.max(2, Math.min(6, oct));
    }

    nextStyle() {
        const curKey = this.currentPreset || this.currentKit || 'cyberpunk';
        let idx = this.STYLES.findIndex(s => s.key === curKey);
        if (idx === -1) idx = 0;
        const nextIdx = (idx + 1) % this.STYLES.length;
        const style = this.STYLES[nextIdx];
        this.currentPreset = style.key;
        this.currentKit = style.key;
        this.initDefaultPattern(style.key);
        return style;
    }

    prevStyle() {
        const curKey = this.currentPreset || this.currentKit || 'cyberpunk';
        let idx = this.STYLES.findIndex(s => s.key === curKey);
        if (idx === -1) idx = 0;
        const prevIdx = (idx - 1 + this.STYLES.length) % this.STYLES.length;
        const style = this.STYLES[prevIdx];
        this.currentPreset = style.key;
        this.currentKit = style.key;
        this.initDefaultPattern(style.key);
        return style;
    }

    getCurrentStyle() {
        const key = this.currentPreset || this.currentKit || 'cyberpunk';
        return this.STYLES.find(s => s.key === key) || this.STYLES[0];
    }

    playDrumPad(padIndex) {
        this.initAudio();
        const t = this.ctx.currentTime;
        const padInsts = [
            'kick', 'snare', 'hihat_cl', 'hihat_op',
            'clap', 'tabla_bayan', 'tabla_dayan', 'tom',
            'crash', 'sub_bass', 'rimshot', 'flute'
        ];
        const inst = padInsts[padIndex] || 'kick';
        switch (padIndex) {
            case 0: this.playKick(t); break;
            case 1: this.playSnare(t); break;
            case 2: this.playHiHat(t, false); break;
            case 3: this.playHiHat(t, true); break;
            case 4: this.playClap(t); break;
            case 5: this.playTabla('bayan', t); break;
            case 6: this.playTabla('dayan', t); break;
            case 7: this.playTom(t); break;
            case 8: this.playCrash(t); break;
            case 9: this.playSubBass(65.41, t); break;
            case 10: this.playRimshot(t); break;
            case 11: this.playFlute(523.25, t); break;
        }
        this.dispatchVisualizerEnergy(inst, 440);
    }

    // -------------------------------------------------------------------------
    // CONTINUOUS REPEAT LOOP SCHEDULER
    // -------------------------------------------------------------------------
    start() {
        this.initAudio();
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentStep = 0;
        this.nextStepTime = this.ctx.currentTime + 0.05;
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        this.currentStep = 0;
        this.stepCallbacks.forEach(cb => cb(-1));
    }

    scheduler() {
        if (!this.isPlaying) return;

        while (this.nextStepTime < this.ctx.currentTime + 0.1) {
            this.scheduleStep(this.currentStep, this.nextStepTime);
            this.advanceStep();
        }

        this.timerId = setTimeout(() => this.scheduler(), 25);
    }

    advanceStep() {
        const secondsPerBeat = 60.0 / this.bpm;
        const secondsPer16th = secondsPerBeat / 4.0;
        this.nextStepTime += secondsPer16th;
        this.currentStep = (this.currentStep + 1) % this.numSteps;
    }

    scheduleStep(step, time) {
        const delay = Math.max(0, (time - this.ctx.currentTime) * 1000);
        setTimeout(() => {
            if (this.isPlaying) {
                this.stepCallbacks.forEach(cb => cb(step));
                this.tracks.forEach((track, tIdx) => {
                    if (track.pattern[step] && this.isTrackAudible(tIdx)) {
                        this.dispatchVisualizerEnergy(track.instrument, track.pitches[step] || 440);
                    }
                });
            }
        }, delay);

        this.tracks.forEach((track, tIdx) => {
            if (track.pattern[step] && this.isTrackAudible(tIdx)) {
                const pitch = track.pitches[step] || 440;
                this.playInstrument(track.instrument, pitch, time);
            }
        });
    }

    // -------------------------------------------------------------------------
    // OFFLINE WAV AUDIO EXPORTER (Supporting up to 128 columns)
    // -------------------------------------------------------------------------
    async exportToWav(numLoops = 2) {
        this.initAudio();
        const sampleRate = 44100;
        const secondsPer16th = (60.0 / this.bpm) / 4.0;
        const totalDuration = this.numSteps * secondsPer16th * numLoops + 0.5;

        const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        const offCtx = new OfflineCtx(2, Math.ceil(sampleRate * totalDuration), sampleRate);

        for (let loop = 0; loop < numLoops; loop++) {
            const loopOffset = loop * this.numSteps * secondsPer16th;
            for (let s = 0; s < this.numSteps; s++) {
                const t = loopOffset + s * secondsPer16th;
                this.tracks.forEach((track, tIdx) => {
                    if (track.pattern[s] && this.isTrackAudible(tIdx)) {
                        const pitch = track.pitches[s] || 440;
                        this.playInstrument(track.instrument, pitch, t, offCtx, offCtx.destination);
                    }
                });
            }
        }

        const renderedBuffer = await offCtx.startRendering();
        const wavBlob = this.audioBufferToWav(renderedBuffer);

        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `smartcalc-song-${this.currentKit}-${this.numSteps}bars-${this.bpm}bpm.wav`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);

        return true;
    }

    audioBufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1;
        const bitDepth = 16;
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;

        const left = buffer.getChannelData(0);
        const right = numChannels > 1 ? buffer.getChannelData(1) : left;
        const numSamples = left.length;

        const dataSize = numSamples * blockAlign;
        const headerSize = 44;
        const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
        const view = new DataView(arrayBuffer);

        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        this.writeString(view, 8, 'WAVE');

        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);

        this.writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);

        let offset = 44;
        for (let i = 0; i < numSamples; i++) {
            let sL = Math.max(-1, Math.min(1, left[i]));
            let sR = Math.max(-1, Math.min(1, right[i]));
            view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7FFF, true);
            view.setInt16(offset + 2, sR < 0 ? sR * 0x8000 : sR * 0x7FFF, true);
            offset += 4;
        }

        return new Blob([view], { type: 'audio/wav' });
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
}

window.MusicCreatorEngine = MusicCreatorEngine;
