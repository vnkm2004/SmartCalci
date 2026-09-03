/**
 * Studio Musical Graphic Equalizer & Voice Spectrum Visualizer
 * Exact replication of high-end studio rackmount LED capsule visualizers:
 * - Rounded pill capsule frame with metallic chrome/silver bezel
 * - 36 columns of 13-row 3D glossy LED capsules with individual glass reflections
 * - Inactive matrix in smoked charcoal (Dark) or pearl frost (Light)
 * - Hyper-vibrant 5-stage neon spectrum (Red-Orange -> Golden Yellow -> Neon Magenta -> Cobalt Blue -> Cyber Cyan)
 * - Pure brilliant floating white peak hold caps with slow graceful gravity decay
 * - Authentic sweeping diagonal liquid glass visor glare
 * - Piano-black (Dark) or liquid pearl (Light) mirrored bottom floor reflection
 * - Dynamic audio stream reactivity + calm cinematic idle breathing
 */
class AudioWaveVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.analyser = null;
        this.dataArray = null;
        this.frequencyArray = null;
        this.isRecording = false;
        this.animationId = null;

        // Rhythmic, calm studio meter timing
        this.idlePhase = 0;
        this.numBars = 46;
        this.numSegments = 16;
        this.peaks = new Array(this.numBars).fill(0);
        this.peakHoldTimes = new Array(this.numBars).fill(0);
        this.smoothedLevels = new Array(this.numBars).fill(0.08);

        if (this.canvas) {
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.startLoop();
        }
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = Math.floor(rect.width * (window.devicePixelRatio || 1));
        this.canvas.height = Math.floor(rect.height * (window.devicePixelRatio || 1));
    }

    connectStream(audioStream, audioContext) {
        if (!audioContext || !audioStream) return;
        try {
            this.analyser = audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.82;
            const source = audioContext.createMediaStreamSource(audioStream);
            source.connect(this.analyser);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.frequencyArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.isRecording = true;
        } catch (e) {
            console.warn('AudioVisualizer connectStream notice:', e);
        }
    }

    connectAudioNode(sourceNode, audioContext) {
        if (!audioContext || !sourceNode) return;
        try {
            this.analyser = audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.70;
            sourceNode.connect(this.analyser);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.frequencyArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.isRecording = true;
        } catch (e) {
            console.warn('AudioVisualizer connectAudioNode notice:', e);
        }
    }

    injectEnergy(instrument, pitch = 440) {
        this.isRecording = true;
        const numCols = this.numBars;
        let startCol = 0;
        let endCol = 12;
        let power = 0.95;

        if (instrument === 'kick') {
            startCol = 0;
            endCol = 12;
            power = 1.0;
        } else if (instrument === 'sub_bass' || instrument === 'jazz_bass') {
            startCol = 4;
            endCol = 18;
            power = 0.94;
        } else if (instrument === 'snare' || instrument === 'clap') {
            startCol = 18;
            endCol = 32;
            power = 0.95;
        } else if (instrument === 'tom') {
            startCol = 12;
            endCol = 24;
            power = 0.88;
        } else if (instrument === 'hihat_cl' || instrument === 'hihat_op') {
            startCol = 32;
            endCol = 46;
            power = 0.85;
        } else if (instrument === 'crash') {
            startCol = 20;
            endCol = 46;
            power = 0.98;
        } else {
            // Melodic (violin, harmonium, guitar, piano, sax, synth)
            const normPitch = Math.max(0, Math.min(1, (pitch - 130) / 700));
            const centerCol = Math.floor(normPitch * (numCols - 14)) + 7;
            startCol = Math.max(0, centerCol - 5);
            endCol = Math.min(numCols, centerCol + 6);
            power = 0.92;
        }

        for (let i = startCol; i < endCol; i++) {
            const dist = Math.abs(i - (startCol + endCol) / 2) / Math.max(1, (endCol - startCol) / 2);
            const boost = power * (1 - dist * 0.35);
            this.smoothedLevels[i] = Math.min(1.0, Math.max(this.smoothedLevels[i], boost));
            if (this.smoothedLevels[i] > this.peaks[i]) {
                this.peaks[i] = this.smoothedLevels[i];
                this.peakHoldTimes[i] = 36;
            }
        }
    }

    disconnect() {
        this.isRecording = false;
        this.analyser = null;
        this.dataArray = null;
        this.frequencyArray = null;
    }

    startLoop() {
        const render = () => {
            this.draw();
            this.animationId = requestAnimationFrame(render);
        };
        render();
    }

    safeRoundRect(x, y, w, h, r) {
        if (!this.ctx || w <= 0 || h <= 0) return;
        const rad = Math.max(0, Math.min(r || 0, w / 2, h / 2));
        if (typeof this.ctx.roundRect === 'function') {
            this.ctx.roundRect(x, y, w, h, rad);
        } else {
            this.ctx.rect(x, y, w, h);
        }
    }

    draw() {
        if (!this.ctx || !this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const expectedW = Math.floor(rect.width * dpr);
        const expectedH = Math.floor(rect.height * dpr);

        if (expectedW <= 0 || expectedH <= 0) return;

        if (this.canvas.width !== expectedW || this.canvas.height !== expectedH) {
            this.canvas.width = expectedW;
            this.canvas.height = expectedH;
        }

        const width = this.canvas.width;
        const height = this.canvas.height;
        const isWhite = document.documentElement.getAttribute('data-theme') === 'white';

        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        // Overall canvas background - transparent
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.0)';
        this.ctx.fillRect(0, 0, width, height);

        // Layout Geometry:
        // Reserve bottom 22% for the dark mirrored floor reflection
        const reflectionHeight = height * 0.22;
        const capsuleMarginTop = 4 * dpr;
        const capsuleMarginSide = 6 * dpr;
        const capsuleWidth = Math.max(10, width - capsuleMarginSide * 2);
        const capsuleHeight = Math.max(10, height - capsuleMarginTop - reflectionHeight);
        const capsuleRadius = capsuleHeight / 2;

        const numCols = 46;
        const numRows = 16;

        this.idlePhase += 0.026;

        if (this.analyser && this.frequencyArray) {
            this.analyser.getByteFrequencyData(this.frequencyArray);
        }

        for (let i = 0; i < numCols; i++) {
            const norm = i / numCols;
            let audioSignal = 0;
            if (this.analyser && this.frequencyArray) {
                const freqIndex = Math.min(
                    this.frequencyArray.length - 1,
                    Math.floor(Math.pow(norm, 1.15) * (this.frequencyArray.length * 0.70))
                );
                const rawVal = (this.frequencyArray[freqIndex] || 0) / 255.0;
                audioSignal = rawVal * 0.90;
            }

            const p1 = Math.exp(-Math.pow((norm - 0.14) / 0.12, 2)) * 0.38;
            const p2 = Math.exp(-Math.pow((norm - 0.44) / 0.14, 2)) * 0.32;
            const p3 = Math.exp(-Math.pow((norm - 0.76) / 0.16, 2)) * 0.48;
            const w1 = Math.sin(this.idlePhase * 1.5 + norm * 5.0) * 0.5 + 0.5;
            const w2 = Math.cos(this.idlePhase * 1.0 - norm * 3.5) * 0.5 + 0.5;
            const dynamicWave = (p1 + p2 + p3) * 0.65 + (w1 * 0.6 + w2 * 0.4) * 0.18 + 0.10;

            const target = Math.min(0.95, Math.max(dynamicWave, audioSignal, this.smoothedLevels[i] * 0.86));
            this.smoothedLevels[i] = this.smoothedLevels[i] * 0.65 + target * 0.35;

            if (this.smoothedLevels[i] >= this.peaks[i]) {
                this.peaks[i] = this.smoothedLevels[i];
                this.peakHoldTimes[i] = 30;
            } else if (this.peakHoldTimes[i] > 0) {
                this.peakHoldTimes[i]--;
            } else {
                this.peaks[i] = Math.max(0.15, this.peaks[i] - 0.012);
            }
        }

        this.drawCapsuleFrame(capsuleMarginSide, capsuleMarginTop, capsuleWidth, capsuleHeight, capsuleRadius, isWhite, dpr);

        this.ctx.save();
        this.ctx.beginPath();
        this.safeRoundRect(capsuleMarginSide + 2 * dpr, capsuleMarginTop + 2 * dpr, capsuleWidth - 4 * dpr, capsuleHeight - 4 * dpr, capsuleRadius - 2 * dpr);
        this.ctx.clip();

        const innerBgGrad = this.ctx.createLinearGradient(0, capsuleMarginTop, 0, capsuleMarginTop + capsuleHeight);
        if (isWhite) {
            innerBgGrad.addColorStop(0, '#060810');
            innerBgGrad.addColorStop(0.22, '#141824');
            innerBgGrad.addColorStop(0.58, '#dce3ee');
            innerBgGrad.addColorStop(1, '#ffffff');
        } else {
            innerBgGrad.addColorStop(0, '#020306');
            innerBgGrad.addColorStop(0.45, '#070a12');
            innerBgGrad.addColorStop(1, '#020306');
        }
        this.ctx.fillStyle = innerBgGrad;
        this.ctx.fillRect(capsuleMarginSide, capsuleMarginTop, capsuleWidth, capsuleHeight);

        const gridPadX = capsuleRadius * 0.72;
        const gridPadY = 5 * dpr;
        const gridW = capsuleWidth - gridPadX * 2;
        const gridH = capsuleHeight - gridPadY * 2;
        const baselineY = capsuleMarginTop + gridPadY + gridH;

        const colGap = 2.2 * dpr;
        const totalGap = colGap * (numCols - 1);
        const colWidth = Math.max(2 * dpr, (gridW - totalGap) / numCols);
        const segGap = 1.6 * dpr;
        const segHeight = Math.max(2 * dpr, (gridH - (segGap * (numRows - 1))) / numRows);
        const segRadius = Math.min(colWidth / 3, segHeight / 3);

        for (let i = 0; i < numCols; i++) {
            const x = capsuleMarginSide + gridPadX + i * (colWidth + colGap);
            for (let r = 0; r < numRows; r++) {
                const y = baselineY - (r + 1) * segHeight - (r * segGap);
                this.drawInactivePill(x, y, colWidth, segHeight, segRadius, isWhite, dpr);
            }
        }

        this.ctx.save();
        this.ctx.globalCompositeOperation = isWhite ? 'source-over' : 'screen';
        for (let i = 0; i < numCols; i++) {
            const colFraction = i / numCols;
            const colColor = this.getSpectrumColor(colFraction);
            const x = capsuleMarginSide + gridPadX + i * (colWidth + colGap);
            const level = Math.min(1.0, Math.max(0.08, this.smoothedLevels[i]));
            const activeCount = Math.min(numRows, Math.max(1, Math.round(level * numRows)));
            const plumeH = activeCount * (segHeight + segGap);
            const plumeY = baselineY - plumeH;

            const auraGrad = this.ctx.createLinearGradient(x, baselineY, x, plumeY - 8 * dpr);
            const alphaBase = isWhite ? 0.35 : 0.55;
            auraGrad.addColorStop(0, `rgba(${colColor.r}, ${colColor.g}, ${colColor.b}, ${alphaBase})`);
            auraGrad.addColorStop(0.5, `rgba(${colColor.r}, ${colColor.g}, ${colColor.b}, ${alphaBase * 0.45})`);
            auraGrad.addColorStop(1, `rgba(${colColor.r}, ${colColor.g}, ${colColor.b}, 0.0)`);

            this.ctx.fillStyle = auraGrad;
            this.ctx.shadowColor = `rgb(${colColor.r}, ${colColor.g}, ${colColor.b})`;
            this.ctx.shadowBlur = Math.max(8, 16 * dpr);
            this.ctx.fillRect(x - colGap * 0.5, plumeY - 8 * dpr, colWidth + colGap, plumeH + 8 * dpr);
        }
        this.ctx.restore();

        for (let i = 0; i < numCols; i++) {
            const colFraction = i / numCols;
            const colColor = this.getSpectrumColor(colFraction);
            const x = capsuleMarginSide + gridPadX + i * (colWidth + colGap);
            const level = Math.min(1.0, Math.max(0.08, this.smoothedLevels[i]));
            const activeCount = Math.min(numRows, Math.max(1, Math.round(level * numRows)));

            for (let r = 0; r < activeCount; r++) {
                const y = baselineY - (r + 1) * segHeight - (r * segGap);
                const segFraction = r / numRows;
                this.drawActiveSegment(x, y, colWidth, segHeight, segRadius, colColor, segFraction, dpr, isWhite);
            }

            const peakRow = Math.min(numRows - 1, Math.max(0, Math.round(this.peaks[i] * numRows)));
            const peakY = baselineY - (peakRow + 1) * segHeight - (peakRow * segGap);
            this.drawPeakPill(x, peakY, colWidth, segHeight, segRadius, dpr);
        }

        this.drawBaselineLaserBeam(capsuleMarginSide + gridPadX, baselineY, gridW, dpr);
        this.drawVisorGlare(capsuleMarginSide, capsuleMarginTop, capsuleWidth, capsuleHeight, isWhite, dpr);

        this.ctx.restore();
        this.drawChassisFloorReflection(capsuleMarginSide + gridPadX, baselineY + 4 * dpr, colWidth, colGap, segHeight, segGap, segRadius, numCols, numRows, isWhite, dpr);
    }

    drawCapsuleFrame(x, y, w, h, r, isWhite, dpr) {
        const strokeGrad = this.ctx.createLinearGradient(x, y, x + w, y + h);
        if (isWhite) {
            strokeGrad.addColorStop(0, '#ffffff');
            strokeGrad.addColorStop(0.3, '#c8d4e4');
            strokeGrad.addColorStop(0.7, '#ffffff');
            strokeGrad.addColorStop(1, '#8fa0ba');
        } else {
            strokeGrad.addColorStop(0, '#424c65');
            strokeGrad.addColorStop(0.25, '#1e2433');
            strokeGrad.addColorStop(0.5, '#5c698a');
            strokeGrad.addColorStop(0.75, '#121622');
            strokeGrad.addColorStop(1, '#3b445c');
        }

        this.ctx.lineWidth = 2 * dpr;
        this.ctx.strokeStyle = strokeGrad;
        this.ctx.beginPath();
        this.safeRoundRect(x, y, w, h, r);
        this.ctx.stroke();

        this.ctx.lineWidth = 1 * dpr;
        this.ctx.strokeStyle = isWhite ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.10)';
        this.ctx.beginPath();
        this.safeRoundRect(x + 2.5 * dpr, y + 2.5 * dpr, w - 5 * dpr, h - 5 * dpr, r - 1.5 * dpr);
        this.ctx.stroke();
    }

    drawInactivePill(x, y, w, h, r, isWhite, dpr) {
        this.ctx.fillStyle = isWhite ? '#1e2434' : '#141824';
        this.ctx.beginPath();
        this.safeRoundRect(x, y, w, h, r);
        this.ctx.fill();

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
        this.ctx.beginPath();
        this.safeRoundRect(x + 0.3 * dpr, y + 0.2 * dpr, Math.max(1, w - 0.6 * dpr), Math.max(1, h * 0.45), r * 0.7);
        this.ctx.fill();
    }

    drawActiveSegment(x, y, w, h, r, colColor, segFraction, dpr, isWhite) {
        this.ctx.shadowColor = `rgba(${colColor.r}, ${colColor.g}, ${colColor.b}, 0.95)`;
        this.ctx.shadowBlur = Math.max(5, 11 * dpr);

        const baseGrad = this.ctx.createLinearGradient(x, y, x, y + h);
        if (segFraction < 0.16) {
            baseGrad.addColorStop(0, `rgb(${Math.min(255, colColor.r + 140)}, ${Math.min(255, colColor.g + 140)}, ${Math.min(255, colColor.b + 140)})`);
            baseGrad.addColorStop(0.45, '#ffffff');
            baseGrad.addColorStop(1, `rgb(${colColor.r}, ${colColor.g}, ${colColor.b})`);
        } else {
            baseGrad.addColorStop(0, `rgb(${Math.min(255, colColor.r + 55)}, ${Math.min(255, colColor.g + 55)}, ${Math.min(255, colColor.b + 55)})`);
            baseGrad.addColorStop(0.40, `rgb(${colColor.r}, ${colColor.g}, ${colColor.b})`);
            baseGrad.addColorStop(1, `rgb(${Math.floor(colColor.r * 0.65)}, ${Math.floor(colColor.g * 0.65)}, ${Math.floor(colColor.b * 0.65)})`);
        }

        this.ctx.fillStyle = baseGrad;
        this.ctx.beginPath();
        this.safeRoundRect(x, y, w, h, r);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.40)';
        this.ctx.lineWidth = 0.5 * dpr;
        this.ctx.stroke();

        const coreAlpha = segFraction < 0.25 ? 0.85 : 0.40;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha})`;
        this.ctx.beginPath();
        this.safeRoundRect(x + 0.5 * dpr, y + 0.5 * dpr, Math.max(1, w - 1.0 * dpr), Math.max(1, h * 0.5), r * 0.7);
        this.ctx.fill();

        const glossGrad = this.ctx.createLinearGradient(x, y, x, y + h * 0.55);
        glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        glossGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.30)');
        glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        this.ctx.fillStyle = glossGrad;
        this.ctx.beginPath();
        this.safeRoundRect(x + 0.3 * dpr, y + 0.2 * dpr, Math.max(1, w - 0.6 * dpr), Math.max(1, h * 0.4), r * 0.7);
        this.ctx.fill();
    }

    drawPeakPill(x, y, w, h, r, dpr) {
        this.ctx.shadowColor = 'rgba(255, 255, 255, 1.0)';
        this.ctx.shadowBlur = 12 * dpr;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.safeRoundRect(x, y, w, Math.max(2 * dpr, h * 0.9), r);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        this.ctx.beginPath();
        this.safeRoundRect(x + 0.3 * dpr, y + 0.2 * dpr, Math.max(1, w - 0.6 * dpr), Math.max(1, h * 0.4), r * 0.7);
        this.ctx.fill();
    }

    drawBaselineLaserBeam(startX, baselineY, gridW, dpr) {
        this.ctx.save();
        const beamGrad = this.ctx.createLinearGradient(startX, baselineY, startX + gridW, baselineY);
        beamGrad.addColorStop(0.00, 'rgba(0, 255, 90, 0.95)');
        beamGrad.addColorStop(0.25, 'rgba(0, 225, 255, 0.98)');
        beamGrad.addColorStop(0.48, 'rgba(30, 90, 255, 0.98)');
        beamGrad.addColorStop(0.66, 'rgba(255, 0, 140, 0.98)');
        beamGrad.addColorStop(0.85, 'rgba(255, 50, 20, 0.98)');
        beamGrad.addColorStop(1.00, 'rgba(255, 185, 0, 0.95)');

        this.ctx.strokeStyle = beamGrad;
        this.ctx.lineWidth = 2.5 * dpr;
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 10 * dpr;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, baselineY + 0.5 * dpr);
        this.ctx.lineTo(startX + gridW, baselineY + 0.5 * dpr);
        this.ctx.stroke();

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        this.ctx.lineWidth = 1 * dpr;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, baselineY + 0.5 * dpr);
        this.ctx.lineTo(startX + gridW, baselineY + 0.5 * dpr);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawVisorGlare(cx, cy, cw, ch, isWhite, dpr) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy);
        this.ctx.lineTo(cx + cw, cy);
        this.ctx.lineTo(cx + cw, cy + ch * 0.38);
        this.ctx.bezierCurveTo(
            cx + cw * 0.65, cy + ch * 0.52,
            cx + cw * 0.30, cy + ch * 0.18,
            cx, cy + ch * 0.58
        );
        this.ctx.closePath();

        const glareGrad = this.ctx.createLinearGradient(0, cy, 0, cy + ch * 0.58);
        glareGrad.addColorStop(0, isWhite ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.28)');
        glareGrad.addColorStop(0.5, isWhite ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)');
        glareGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        this.ctx.fillStyle = glareGrad;
        this.ctx.fill();

        this.ctx.strokeStyle = isWhite ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.25)';
        this.ctx.lineWidth = 1 * dpr;
        this.ctx.beginPath();
        this.ctx.moveTo(cx + ch * 0.3, cy + 2 * dpr);
        this.ctx.lineTo(cx + cw - ch * 0.3, cy + 2 * dpr);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawChassisFloorReflection(startX, floorY, colW, colGap, segH, segGap, segR, numCols, numRows, isWhite, dpr) {
        for (let i = 0; i < numCols; i++) {
            const colFraction = i / numCols;
            const colColor = this.getSpectrumColor(colFraction);
            const x = startX + i * (colW + colGap);
            const level = Math.min(1.0, Math.max(0.04, this.smoothedLevels[i]));
            const activeCount = Math.round(level * numRows);
            const reflectRows = Math.min(8, activeCount);

            for (let rf = 0; rf < reflectRows; rf++) {
                const refY = floorY + (rf * (segH + segGap));
                const alpha = Math.max(0, 0.55 * Math.pow(1 - (rf / 8), 1.3));

                this.ctx.fillStyle = `rgba(${colColor.r}, ${colColor.g}, ${colColor.b}, ${isWhite ? alpha * 0.5 : alpha})`;
                this.ctx.shadowColor = `rgba(${colColor.r}, ${colColor.g}, ${colColor.b}, ${alpha})`;
                this.ctx.shadowBlur = Math.max(3, 7 * dpr);
                this.ctx.beginPath();
                this.safeRoundRect(x, refY, colW, segH * 0.85, segR);
                this.ctx.fill();
            }
        }
        this.ctx.shadowBlur = 0;
    }

    getSpectrumColor(fraction) {
        const STOPS = [
            { pos: 0.00, r: 0,   g: 255, b: 90 },
            { pos: 0.16, r: 0,   g: 240, b: 140 },
            { pos: 0.28, r: 0,   g: 225, b: 255 },
            { pos: 0.42, r: 30,  g: 90,  b: 255 },
            { pos: 0.54, r: 150, g: 0,   b: 255 },
            { pos: 0.66, r: 255, g: 0,   b: 140 },
            { pos: 0.78, r: 255, g: 30,  b: 30 },
            { pos: 0.88, r: 255, g: 110, b: 0 },
            { pos: 1.00, r: 255, g: 185, b: 0 }
        ];

        const f = Math.max(0, Math.min(1, fraction));
        let lower = STOPS[0];
        let upper = STOPS[STOPS.length - 1];

        for (let i = 0; i < STOPS.length - 1; i++) {
            if (f >= STOPS[i].pos && f <= STOPS[i + 1].pos) {
                lower = STOPS[i];
                upper = STOPS[i + 1];
                break;
            }
        }

        const span = upper.pos - lower.pos;
        const t = span > 0 ? (f - lower.pos) / span : 0;
        return {
            r: Math.round(lower.r + (upper.r - lower.r) * t),
            g: Math.round(lower.g + (upper.g - lower.g) * t),
            b: Math.round(lower.b + (upper.b - lower.b) * t)
        };
    }
}

window.AudioWaveVisualizer = AudioWaveVisualizer;
