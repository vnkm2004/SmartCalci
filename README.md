# ⚡ Smart AI Voice Calculator & Cyber Synth Studio 🎵

> A futuristic, voice-powered, multilingual AI calculator paired with a 128-column multi-track music production studio and dynamic full-spectrum audio visualizer. Built with modern Spring Boot and ultra-pure, zero-dependency Liquid Glassmorphism web technologies.

---

## 💡 Origin Story & Motivation

> *"It all started after failing to solve lengthy, convoluted math expressions in a TCS placement exam in time... I thought to myself: Why struggle doing this by hand under pressure when I could build an ultra-smart calculator where complex expressions can be spoken via voice or copied & pasted directly, solved instantly with step-by-step mathematical breakdowns?"*

What began as a relatable coding revenge on lengthy competitive exam arithmetic evolved into a **full-blown cybernetic workstation** combining:
1. **High-Precision Multi-Lingual Voice & NLP Math Solver** (with optional Google Gemini AI step-by-step reasoning & interactive graphing).
2. **Cyber Beat & Synth Studio** — an embedded, in-browser digital audio workstation (DAW) with 128-column step sequencing, drag-to-paint beat creation, and authentic Indian classical & electronic synthesizer instruments.

---

## 🛠️ Tech Stack & Architecture

SmartCalculator is built with an ultra-lightweight, high-performance architecture that delivers instant boot speeds and 60 FPS fluidity with **zero bloated frontend frameworks** and **zero backend databases**.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Browser)                           │
│  • Vanilla HTML5 & ES6+ JavaScript (Zero NPM Bloat, Zero Node Modules)  │
│  • Liquid Glassmorphism Design System (Specular reflections & frosted) │
│  • Web Audio API (100% Procedural Synthesis, Oscillators, Biquad DSP)  │
│  • Web Speech API (Multilingual SpeechRecognition & SpeechSynthesis)    │
│  • HTML5 Canvas 2D (60 FPS Multi-Band Audio Spectrum Visualizer)       │
│  • Robotic Typography (Orbitron & Share Tech Mono from Google Fonts)    │
│  • 100% Vector SVG Icons (Zero Emojis, pure cyber aesthetic)            │
└────────────────────────────────────▲────────────────────────────────────┘
                                     │  REST API (JSON)
┌────────────────────────────────────▼────────────────────────────────────┐
│                       BACKEND (Spring Boot 3.4)                         │
│  • Java 21 / 25 (Modern Virtual Threads & High-Efficiency Processing)   │
│  • Spring Boot 3.4.3 (Embedded Tomcat Web Server)                       │
│  • exp4j Engine (Fast Abstract Syntax Tree Expression Evaluator)        │
│  • Local NLP Pre-processor (Math keyword parser & natural language)     │
│  • Google Gemini 1.5 Flash REST Client (AI Explanations & LaTeX Steps)  │
│  • Zero Database Storage (No SQL, No Mongo, Pure Stateless Security)   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Technologies
- **Backend**: **Java 21/25**, **Spring Boot 3.4.3**, **Maven**, **exp4j**, **Spring Web MVC**.
- **Frontend**: **Vanilla Modern JavaScript (ES6+)**, **Vanilla CSS3** (Custom Properties, Glassmorphism, GPU Hardware Acceleration), **HTML5**.
- **Audio Engine**: Native **Web Audio API** (`AudioContext`, `OscillatorNode`, `BiquadFilterNode`, `GainNode`, `PeriodicWave`).
- **Voice System**: Native **Web Speech API** (`SpeechRecognition` & `SpeechSynthesis`).
- **AI Integration**: **Google Gemini REST API** (`gemini-1.5-flash`).

---

## 🔒 100% Privacy & Zero Database Architecture

> [!IMPORTANT]
> **Zero User Data Collected or Stored.**  
> SmartCalculator has **NO database** (no MySQL, PostgreSQL, MongoDB, or Redis). Your calculations, voice audio, mathematical inputs, and preferences never leave your session.

- **Local Storage Only**: System configurations and optional user API keys are stored solely inside your browser's private `localStorage`.
- **Stateless Backend**: The Spring Boot server operates strictly in memory — no logs of your math equations, no tracking, and no external telemetry.
- **Zero Third-Party Trackers**: No Google Analytics, no tracking pixels, and no ad libraries.

---

## 🚀 How to Upgrade to Advanced AI Mode (Gemini API)

Out of the box, SmartCalculator features a lightning-fast offline math solver (`LocalNlpMathService` + `exp4j`) that can evaluate complex algebraic, trigonometric, logarithmic, and arithmetic expressions instantly.

To unlock **Advanced AI Reasoning** (step-by-step pedagogical explanations, natural language word problems, calculus guidance, and interactive 2D function graphing):

1. Get a **Free Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).
2. In the SmartCalculator header, click the **Settings (⚙️)** button to open the **System Config** modal.
3. Paste your Gemini API key into the **Gemini API Key** field.
4. Click **Save Configuration**.
5. *Done!* All complex word problems (e.g., *"If a train travels 60 km/h for 2.5 hours..."* or *"Graph y = x^2 - 4x + 3"*) will now be resolved with deep step-by-step breakdowns, LaTeX mathematical typesetting, and live plotted graphs!

---

## 🎹 Cyber Beat & Synth Studio (Music Features)

SmartCalculator includes a full-featured music production workstation seamlessly embedded into the app. Listen to high-energy beats while crunching numbers, or compose custom tracks using a wide range of world and electronic instruments.

### What You Can Do in the Music Studio:
1. **Multi-Track 128-Step Sequencer**:
   - Up to **8 simultaneous tracks** with dynamic column scaling (**16, 32, 64, or 128 steps**).
   - **DAW Drag-to-Select (Paint & Erase Mode)**: Click/touch any step bit and drag across the grid to rapidly paint beats or erase existing steps without clicking each button individually.
   - **Per-Track Controls**: Individual **Mute (M)**, **Solo (S)**, and **Delete (×)** buttons, plus an **Add Instrument** selector.
   - **Dynamic Tempo (BPM)**: Real-time slider adjusting from 60 BPM up to 180 BPM.
2. **12 Diverse Music Kits & Presets**:
   - **Cyberpunk**: Industrial driving kick, synth stabs, and glitch percussion.
   - **Indian Raga**: Authentic classical Teental/Keherwa rhythms, Bansuri flute melodies, Sitar drones, and multi-tonal Tabla grooves.
   - **Trap 808**: Booming sub bass, rapid rolling hi-hats, and punchy claps.
   - **Lo-Fi Chill**: Warm Rhodes piano chords, vinyl dust, and relaxed groove.
   - **Jazz Lounge**: Walking acoustic upright bass and expressive brass/sax chords.
   - **EDM Techno, Future Bass, Synthwave, Classical Strings, Harmonium Raga, UK Drill, and 8-Bit Arcade**.
3. **Authentic Procedural Instruments (Synthesized Live in AudioContext)**:
   - **Indian Instruments**: *Bansuri Flute* (harmonic breath overtones & vibrato), *Sitar* (sympathetic string resonance & metallic buzz), *Tabla Bayan / Dagga* (pitch-bending bass thump), *Tabla Dayan* (resonant metallic 'tun' rim stroke), *Harmonium* (reed vibrato).
   - **Western & Modern Instruments**: *Grand Piano*, *Sub Bass 808*, *Violin / Strings*, *Lead Synth*, *8-Bit Chiptune*, *Cyber Clap*, *Rimshot*, *Tom Drums*.
4. **Extended 32-Key Piano Keyboard (C3 to G5)**:
   - **Glissando Drag-to-Play**: Drag your mouse or finger across the 32 keys for fluid harp-like sweeps and continuous glissandos.
   - **Sound Switcher**: Instantly switch the keyboard sound to *Grand Piano*, *Bansuri Flute*, *Sitar*, *Harmonium*, *Violin*, *Guitar*, *Lead Synth*, or *8-Bit Arcade*.
   - **Octave Shifter**: Transpose up or down with the `- / +` Octave Shift buttons.
   - **Full QWERTY Hotkey Controls**:
     - *Octave 3 (Low)*: `Z X C V B N M` (White) | `S D G H J` (Black)
     - *Octave 4 (Mid)*: `Q W E R T Y U` (White) | `2 3 5 6 7` (Black)
     - *Octave 5 (High)*: `I O P [ ]` (White) | `9 0 +` (Black)
5. **12-Pad Frosted Glass Drum Machine**:
   - Tactile finger-drumming pads mapped to keyboard hotkeys (`1-9, 0, -, =`) with instant visual feedback.
6. **Floating Mini Player on Calculator Page**:
   - A minimalist, liquid glass media player widget sits right on the main calculator page, letting you Play, Stop, cycle tracks (Prev/Next/Random), and open the Studio without interrupting your math calculations.
7. **60 FPS Full-Spectrum Neon Audio Visualizer**:
   - Multi-band frequency visualizer featuring radiant cyan-to-magenta spectral bars, a white-hot glowing base, and reactive atmospheric aura plumes that pulse with every beat.

---

## 📖 User Guide: How to Use SmartCalculator

### 1. Voice-Activated Math
- Click the **Microphone (🎙️)** button or press `Spacebar`.
- Speak naturally in English, Hindi, Spanish, French, or German:
  - *"What is 45 percent of 1250?"*
  - *"Square root of 144 plus 15 times 3"*
  - *"Calculate 2 to the power 8"*
  - *"Solve 5x + 10 = 35"*
- The smart voice engine will transcribe your speech in real-time, solve the equation, display the step-by-step result, and speak the answer back using the chosen robotic voice persona.

### 2. Copy & Paste Math Expressions
- Directly paste lengthy formulas copied from exam papers, PDFs, or homework into the display:
  ```text
  ((25 * 4) + sqrt(144)) / (2^3 - 4)
  ```
- Press `Enter` or click the liquid glass `=` button to solve.

### 3. Step-by-Step AI Solutions & 2D Graphs
- If your equation involves functions like $y = x^2 - 4x$ or $\sin(x)$, click the **Graph Visualizer** button to render an interactive Cartesian canvas with smooth coordinate tracing dots.

### 4. Dual Liquid Glass Themes
- Click the **Theme Toggle** button in the header bar:
  - **Dark Mode**: Sleek black & neon aesthetics with liquid frosted glass cards.
  - **Light Mode**: Crisp white & black liquid glass with inverted high-contrast visualizer bars.

---

## 💻 Getting Started (Running Locally)

### Prerequisites
- **Java Development Kit (JDK) 21 or 25** installed and added to your `PATH`.
- **Apache Maven 3.9+** (optional, standard Maven wrapper or direct execution supported).

### 1. Clone the Repository
```bash
git clone https://github.com/vnkm2004/SmartCalculator.git
cd SmartCalculator
```

### 2. Build the Application
```powershell
mvn clean package -DskipTests
```

### 3. Run the Spring Boot Server
```powershell
java -jar target/smart-calculator-1.3.1.jar
```

### 4. Open in Your Browser
Navigate to:
```text
http://localhost:8080/
```

---

## ⚡ Deploy to Cloudflare Pages (100% Free & Serverless)

SmartCalculator is configured for **Zero-Config Cloudflare Pages deployment** with serverless edge functions in `functions/api/`:

### 1-Click Setup via Cloudflare Dashboard:
1. Push your repository to **GitHub**.
2. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) $\rightarrow$ **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
3. Select your `SmartCalculator` repository.
4. Set the build settings:
   - **Framework preset**: `None`
   - **Build command**: *(leave empty)*
   - **Build output directory**: `src/main/resources/static`
5. Click **Save and Deploy**!

Cloudflare will instantly serve the frontend globally via Cloudflare CDN and execute all `/api/*` math routes serverlessly on Cloudflare Workers via [`functions/api/[[path]].js`](file:///c:/Users/vishw/Desktop/PROJECTS/SmartCalculator/functions/api/%5B%5Bpath%5D%5D.js)!

*(Optional)*: In Cloudflare Pages $\rightarrow$ **Settings** $\rightarrow$ **Environment Variables**, add `GEMINI_API_KEY` to provide a global default Gemini AI key for all users!

---

## 📂 Project Structure

```text
SmartCalculator/
├── pom.xml                                    # Maven project configuration (Spring Boot 3.4.3)
├── custommization.txt                         # Design system & strict UI theme rules
├── src/
│   ├── main/
│   │   ├── java/com/smartcalc/
│   │   │   ├── SmartCalculatorApplication.java# Spring Boot Application Entrypoint
│   │   │   ├── controller/
│   │   │   │   └── MathController.java        # REST API endpoints (/api/math/solve, /api/math/ai-solve)
│   │   │   ├── model/
│   │   │   │   ├── MathRequest.java           # Math calculation payload DTO
│   │   │   │   └── MathResponse.java          # Formatted result and step-by-step DTO
│   │   │   └── service/
│   │   │       ├── LocalNlpMathService.java   # Offline AST & regex math evaluator (exp4j)
│   │   │       └── GeminiAiService.java       # Google Gemini 1.5 Flash AI integration
│   │   └── resources/
│   │       ├── application.properties         # Server port (8080) & Spring configs
│   │       └── static/
│   │           ├── index.html                 # Single Page Application layout & Modals
│   │           ├── favicon.svg                # Liquid glass SVG favicon
│   │           ├── css/
│   │           │   └── style.css              # Glassmorphism tokens, themes, animations
│   │           └── js/
│   │               ├── app.js                 # UI glue, event delegation, shortcuts
│   │               ├── calculator.js          # Core calculator state & display manager
│   │               ├── speech.js              # Web Speech API voice recognition & TTS
│   │               ├── music-creator.js       # Procedural Web Audio API synth & sequencer
│   │               ├── audio-visualizer.js    # 60 FPS HTML5 Canvas frequency spectrum
│   │               ├── math-grapher.js        # Cartesian 2D equation graph renderer
│   │               └── sound-effects.js       # Tactile liquid glass UI audio feedback
└── target/                                    # Compiled classes & executable JAR
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute it for personal, academic, or commercial projects!

---

*Made with 💖, pure Java, and modern Web Audio by Vishwajeet.*
