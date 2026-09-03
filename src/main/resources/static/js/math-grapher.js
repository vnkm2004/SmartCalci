/**
 * Interactive Mathematical Function Grapher
 * Accurately plots real mathematical functions y = f(x) (trigonometric, algebraic, polynomial)
 * with authentic Cartesian coordinate geometry, sticky curve tracking, and key point markers.
 */
class MathGrapher {
    constructor(canvasId, tooltipId) {
        this.canvas = document.getElementById(canvasId);
        this.tooltip = document.getElementById(tooltipId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

        // Current Function & Evaluation Data
        this.currentFn = 'cos(x)';
        this.displayFormula = 'y = cos(x)';
        this.evalPoint = null; // { x, y, label }

        // Coordinate Viewport Bounds (Auto-scaled for function type)
        this.xMin = -7;
        this.xMax = 7;
        this.yMin = -2.5;
        this.yMax = 2.5;

        // Pan & Interactive Inspection State
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.hoverMouseX = null;

        if (this.canvas) {
            this.initListeners();
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = Math.floor(rect.width * (window.devicePixelRatio || 1));
        this.canvas.height = Math.floor(rect.height * (window.devicePixelRatio || 1));
        this.draw();
    }

    initListeners() {
        // Drag to Pan
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) * (window.devicePixelRatio || 1);
            const mouseY = (e.clientY - rect.top) * (window.devicePixelRatio || 1);

            if (this.isDragging) {
                const dx = (e.clientX - this.dragStartX) * (this.xMax - this.xMin) / rect.width;
                const dy = (e.clientY - this.dragStartY) * (this.yMax - this.yMin) / rect.height;
                this.xMin -= dx;
                this.xMax -= dx;
                this.yMin += dy;
                this.yMax += dy;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.draw();
                return;
            }

            // Real Mathematical Curve Tracking
            this.hoverMouseX = mouseX;
            const mathX = this.canvasToMathX(mouseX);
            const mathY = this.evaluate(mathX);

            this.draw();

            if (this.tooltip && mathY !== null && isFinite(mathY)) {
                const screenX = e.clientX - rect.left;
                const screenY = this.mathToCanvasY(mathY) / (window.devicePixelRatio || 1);
                this.tooltip.style.display = 'block';
                this.tooltip.style.left = `${Math.min(screenX + 14, rect.width - 150)}px`;
                this.tooltip.style.top = `${Math.max(screenY - 32, 10)}px`;
                this.tooltip.innerHTML = `<strong>${this.currentFn}</strong><br>x: ${mathX.toFixed(2)}, y: ${mathY.toFixed(2)}`;
            } else if (this.tooltip) {
                this.tooltip.style.display = 'none';
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoverMouseX = null;
            if (this.tooltip) this.tooltip.style.display = 'none';
            this.draw();
        });

        // Wheel Zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85;
            this.zoom(zoomFactor);
        });
    }

    zoom(factor) {
        const xCenter = (this.xMin + this.xMax) / 2;
        const yCenter = (this.yMin + this.yMax) / 2;
        const xSpan = (this.xMax - this.xMin) * factor / 2;
        const ySpan = (this.yMax - this.yMin) * factor / 2;

        this.xMin = xCenter - xSpan;
        this.xMax = xCenter + xSpan;
        this.yMin = yCenter - ySpan;
        this.yMax = yCenter + ySpan;
        this.draw();
    }

    resetView() {
        this.fitBoundsForFunction(this.currentFn);
        this.draw();
    }

    /**
     * Smartly parses input expression and configures real mathematical function y = f(x)
     */
    plot(rawExpr, resultVal, steps = []) {
        const str = (rawExpr || '').toLowerCase().trim();
        const numResult = parseFloat(resultVal);

        // 1. If user queried a trigonometric function (e.g. "cos(0)", "cos 45", "cos(x)")
        if (str.includes('cos')) {
            this.currentFn = 'cos(x)';
            const match = str.match(/cos\s*\(?\s*([0-9.]+)/);
            if (match) {
                const x0 = parseFloat(match[1]);
                const y0 = !isNaN(numResult) ? numResult : Math.cos(x0);
                this.evalPoint = { x: x0, y: y0, label: `Evaluation: cos(${x0}) = ${y0}` };
            } else {
                this.evalPoint = null;
            }
        } else if (str.includes('sin')) {
            this.currentFn = 'sin(x)';
            const match = str.match(/sin\s*\(?\s*([0-9.]+)/);
            if (match) {
                const x0 = parseFloat(match[1]);
                const y0 = !isNaN(numResult) ? numResult : Math.sin(x0);
                this.evalPoint = { x: x0, y: y0, label: `Evaluation: sin(${x0}) = ${y0}` };
            } else {
                this.evalPoint = null;
            }
        } else if (str.includes('tan')) {
            this.currentFn = 'tan(x)';
            const match = str.match(/tan\s*\(?\s*([0-9.]+)/);
            if (match) {
                const x0 = parseFloat(match[1]);
                const y0 = !isNaN(numResult) ? numResult : Math.tan(x0);
                this.evalPoint = { x: x0, y: y0, label: `Evaluation: tan(${x0}) = ${y0}` };
            } else {
                this.evalPoint = null;
            }
        } else if (str.includes('sqrt')) {
            this.currentFn = 'sqrt(x)';
            const match = str.match(/sqrt\s*\(?\s*([0-9.]+)/);
            if (match) {
                const x0 = parseFloat(match[1]);
                const y0 = !isNaN(numResult) ? numResult : Math.sqrt(x0);
                this.evalPoint = { x: x0, y: y0, label: `Evaluation: √${x0} = ${y0}` };
            } else {
                this.evalPoint = null;
            }
        } else if (str.includes('x')) {
            // Already contains variable x (e.g. "x^2", "2x + 1", "x^3 - 3x")
            this.currentFn = str;
            this.evalPoint = null;
        } else {
            // Arithmetic expression (e.g. "1+2" or complex formula)
            // Mathematically parameterize the first variable number as x:
            // e.g. "1+2" -> f(x) = x + 2, passing through evaluated point (1, 3)!
            const match = str.match(/([0-9.]+)/);
            if (match && !isNaN(numResult)) {
                const firstNum = match[1];
                const fnExpr = str.replace(firstNum, 'x').replace(/×/g, '*').replace(/÷/g, '/');
                this.currentFn = fnExpr;
                this.evalPoint = { x: parseFloat(firstNum), y: numResult, label: `Point (${firstNum}, ${numResult})` };
            } else {
                this.currentFn = 'cos(x)';
                this.evalPoint = null;
            }
        }

        this.fitBoundsForFunction(this.currentFn);
        this.resize();
    }

    plotFunction(fnString) {
        this.currentFn = fnString.trim();
        this.evalPoint = null;
        this.fitBoundsForFunction(this.currentFn);
        this.draw();
    }

    fitBoundsForFunction(fn) {
        const lower = fn.toLowerCase();
        if (lower.includes('cos') || lower.includes('sin')) {
            // Optimal view for sine / cosine waves (-2π to +2π)
            this.xMin = -7;
            this.xMax = 7;
            this.yMin = -2.5;
            this.yMax = 2.5;
        } else if (lower.includes('tan')) {
            this.xMin = -7;
            this.xMax = 7;
            this.yMin = -6;
            this.yMax = 6;
        } else if (lower.includes('^2') || lower.includes('x²')) {
            this.xMin = -6;
            this.xMax = 6;
            this.yMin = -5;
            this.yMax = 25;
        } else if (lower.includes('sqrt')) {
            this.xMin = -2;
            this.xMax = 18;
            this.yMin = -2;
            this.yMax = 6;
        } else if (this.evalPoint) {
            // Center around evaluation point
            const spanX = Math.max(8, Math.abs(this.evalPoint.x) * 2.2);
            const spanY = Math.max(8, Math.abs(this.evalPoint.y) * 2.2);
            this.xMin = this.evalPoint.x - spanX / 2;
            this.xMax = this.evalPoint.x + spanX / 2;
            this.yMin = this.evalPoint.y - spanY / 2;
            this.yMax = this.evalPoint.y + spanY / 2;
        } else {
            this.xMin = -10;
            this.xMax = 10;
            this.yMin = -10;
            this.yMax = 10;
        }
    }

    canvasToMathX(cx) {
        return this.xMin + (cx / this.canvas.width) * (this.xMax - this.xMin);
    }

    canvasToMathY(cy) {
        return this.yMax - (cy / this.canvas.height) * (this.yMax - this.yMin);
    }

    mathToCanvasX(mx) {
        return ((mx - this.xMin) / (this.xMax - this.xMin)) * this.canvas.width;
    }

    mathToCanvasY(my) {
        return ((this.yMax - my) / (this.yMax - this.yMin)) * this.canvas.height;
    }

    evaluate(xVal) {
        try {
            let expr = this.currentFn.toLowerCase()
                .replace(/\^/g, '**')
                .replace(/²/g, '**2')
                .replace(/³/g, '**3')
                .replace(/sin\(/g, 'Math.sin(')
                .replace(/cos\(/g, 'Math.cos(')
                .replace(/tan\(/g, 'Math.tan(')
                .replace(/sqrt\(/g, 'Math.sqrt(')
                .replace(/cbrt\(/g, 'Math.cbrt(')
                .replace(/log\(/g, 'Math.log10(')
                .replace(/ln\(/g, 'Math.log(')
                .replace(/abs\(/g, 'Math.abs(')
                .replace(/\bpi\b/g, 'Math.PI')
                .replace(/\be\b/g, 'Math.E');

            // Replace implicit multiplication e.g. 2x -> 2*x
            expr = expr.replace(/(\d)x/g, '$1*x');
            expr = expr.replace(/x/g, `(${xVal})`);

            const fn = new Function(`return ${expr};`);
            const val = fn();
            return isFinite(val) ? val : null;
        } catch (e) {
            return null;
        }
    }

    draw() {
        if (!this.ctx || !this.canvas) return;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const isWhite = document.documentElement.getAttribute('data-theme') === 'white';
        const dpr = window.devicePixelRatio || 1;

        // Clean Obsidian Background
        this.ctx.fillStyle = isWhite ? '#ffffff' : '#07070b';
        this.ctx.fillRect(0, 0, width, height);

        // 1. Cartesian Grid & Axes
        this.drawCartesianGrid(width, height, isWhite, dpr);

        // 2. Real Mathematical Function Curve y = f(x)
        this.drawMathematicalCurve(width, height, isWhite, dpr);

        // 3. Evaluation Target Point Beacon
        if (this.evalPoint) {
            this.drawEvaluationPoint(this.evalPoint, isWhite, dpr);
        }

        // 4. Sticky Curve Tracker Point (Snaps directly to y = f(x))
        if (this.hoverMouseX !== null) {
            this.drawStickyCurveTracker(this.hoverMouseX, isWhite, dpr);
        }
    }

    drawCartesianGrid(width, height, isWhite, dpr) {
        const ctx = this.ctx;
        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;

        const stepX = this.getNiceStep(xRange / 10);
        const stepY = this.getNiceStep(yRange / 8);

        // Grid lines
        ctx.lineWidth = 1 * dpr;
        ctx.strokeStyle = isWhite ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.08)';
        ctx.fillStyle = isWhite ? '#666666' : '#888899';
        ctx.font = `${10 * dpr}px 'Space Mono', monospace`;

        // Vertical lines
        const firstX = Math.floor(this.xMin / stepX) * stepX;
        for (let x = firstX; x <= this.xMax; x += stepX) {
            const cx = this.mathToCanvasX(x);
            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, height);
            ctx.stroke();

            // X-Axis Number Label
            const cy = Math.min(Math.max(this.mathToCanvasY(0) + 14 * dpr, 14 * dpr), height - 6 * dpr);
            if (Math.abs(x) > 1e-9) {
                ctx.fillText(Number(x.toFixed(2)).toString(), cx + 3 * dpr, cy);
            }
        }

        // Horizontal lines
        const firstY = Math.floor(this.yMin / stepY) * stepY;
        for (let y = firstY; y <= this.yMax; y += stepY) {
            const cy = this.mathToCanvasY(y);
            ctx.beginPath();
            ctx.moveTo(0, cy);
            ctx.lineTo(width, cy);
            ctx.stroke();

            // Y-Axis Number Label
            const cx = Math.min(Math.max(this.mathToCanvasX(0) + 4 * dpr, 4 * dpr), width - 36 * dpr);
            if (Math.abs(y) > 1e-9) {
                ctx.fillText(Number(y.toFixed(2)).toString(), cx, cy - 3 * dpr);
            }
        }

        // Primary X and Y Axes through (0, 0)
        ctx.lineWidth = 2 * dpr;
        ctx.strokeStyle = isWhite ? '#222222' : '#ffffff';

        const originX = this.mathToCanvasX(0);
        const originY = this.mathToCanvasY(0);

        // X Axis
        ctx.beginPath();
        ctx.moveTo(0, originY);
        ctx.lineTo(width, originY);
        ctx.stroke();

        // Y Axis
        ctx.beginPath();
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, height);
        ctx.stroke();

        // Origin (0,0) label
        ctx.fillText('0', originX - 10 * dpr, originY + 12 * dpr);
    }

    drawMathematicalCurve(width, height, isWhite, dpr) {
        const ctx = this.ctx;

        // Vibrant Glossy Gradient Stroke
        const gradStroke = ctx.createLinearGradient(0, 0, width, 0);
        gradStroke.addColorStop(0, '#ff007f'); // Hot Magenta
        gradStroke.addColorStop(0.5, '#00e5ff'); // Electric Cyan
        gradStroke.addColorStop(1, '#ffea00'); // Vivid Yellow

        ctx.lineWidth = 3.5 * dpr;
        ctx.strokeStyle = gradStroke;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 10 * dpr;

        ctx.beginPath();
        let isDrawing = false;
        const totalSteps = width;

        for (let i = 0; i <= totalSteps; i++) {
            const cx = i;
            const mx = this.canvasToMathX(cx);
            const my = this.evaluate(mx);

            if (my !== null && !isNaN(my) && isFinite(my)) {
                const cy = this.mathToCanvasY(my);
                // Clamp excessive jumps for asymptotes (e.g. tan(x))
                if (cy >= -height * 2 && cy <= height * 3) {
                    if (!isDrawing) {
                        ctx.moveTo(cx, cy);
                        isDrawing = true;
                    } else {
                        ctx.lineTo(cx, cy);
                    }
                } else {
                    isDrawing = false;
                }
            } else {
                isDrawing = false;
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    /**
     * Permanent Glowing Beacon for Evaluated Target Point
     */
    drawEvaluationPoint(pt, isWhite, dpr) {
        const ctx = this.ctx;
        const cx = this.mathToCanvasX(pt.x);
        const cy = this.mathToCanvasY(pt.y);

        // Outer Glowing Aura
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 16 * dpr;
        ctx.fillStyle = '#ffe600';
        ctx.beginPath();
        ctx.arc(cx, cy, 7 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // White-hot center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5 * dpr, 0, Math.PI * 2);
        ctx.fill();

        // Label Badge
        ctx.fillStyle = isWhite ? '#111111' : '#ffffff';
        ctx.font = `bold ${10 * dpr}px 'Space Mono', monospace`;
        ctx.fillText(pt.label || `(${pt.x}, ${pt.y})`, cx + 10 * dpr, cy - 10 * dpr);
    }

    /**
     * Sticky curve tracker point that stays strictly pinned to y = f(x)
     */
    drawStickyCurveTracker(mouseX, isWhite, dpr) {
        const mathX = this.canvasToMathX(mouseX);
        const mathY = this.evaluate(mathX);
        if (mathY === null || isNaN(mathY) || !isFinite(mathY)) return;

        const ctx = this.ctx;
        const cx = this.mathToCanvasX(mathX);
        const cy = this.mathToCanvasY(mathY);
        const originY = this.mathToCanvasY(0);
        const originX = this.mathToCanvasX(0);

        // Dashed Projection lines to X and Y axes
        ctx.lineWidth = 1.2 * dpr;
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.strokeStyle = isWhite ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.45)';

        // Drop line to X axis
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, originY);
        ctx.stroke();

        // Projection line to Y axis
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(originX, cy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glowing Tracker Node ON Curve
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 14 * dpr;
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(cx, cy, 6 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Core white glint
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 1.2 * dpr, cy - 1.2 * dpr, 2.2 * dpr, 0, Math.PI * 2);
        ctx.fill();
    }

    getNiceStep(range) {
        const exponent = Math.floor(Math.log10(range));
        const fraction = range / Math.pow(10, exponent);
        let niceFraction;
        if (fraction < 1.5) niceFraction = 1;
        else if (fraction < 3) niceFraction = 2;
        else if (fraction < 7) niceFraction = 5;
        else niceFraction = 10;
        return niceFraction * Math.pow(10, exponent);
    }
}

window.MathGrapher = MathGrapher;
