/**
 * StarSpill - Reveal Page
 * Ported from celestial reveal.tsx
 */

(function () {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('r');

    let roast = null;
    if (r) {
        try { roast = JSON.parse(r); } catch { roast = null; }
    }

    if (!roast || !roast.success) {
        document.getElementById('noReading').style.display = 'block';
        document.getElementById('noReadingMsg').textContent =
            roast?.error || 'No reading found. Start from the beginning.';
        return;
    }

    document.getElementById('revealContent').style.display = 'block';
    document.getElementById('revealZodiac').textContent = `${roast.zodiac} ${roast.zodiac_symbol}`;
    document.getElementById('revealName').textContent = roast.name;

    const roastLines = roast.roast.split(/\n+/).filter((l) => l.trim());
    const container = document.getElementById('roastLines');

    // Build roast line elements
    roastLines.forEach((line) => {
        const p = document.createElement('p');
        p.className = 'roast-line';
        p.textContent = line;
        container.appendChild(p);
    });

    // Verdict
    if (roast.astro_verdict) {
        const v = document.createElement('p');
        v.className = 'roast-line verdict';
        v.textContent = roast.astro_verdict;
        container.appendChild(v);
    }

    const allLines = container.querySelectorAll('.roast-line');

    // Reveal animation
    let revealed = 0;
    const revealInterval = setInterval(() => {
        if (revealed >= allLines.length) {
            clearInterval(revealInterval);
            return;
        }
        allLines[revealed].classList.add('revealed');
        revealed++;
    }, 600);

    // Cosmic field
    const cosmicCanvas = document.getElementById('cosmicCanvas');
    if (cosmicCanvas && window.CosmicField) {
        window.CosmicField.init(cosmicCanvas, 0.7);
    }

    // Voice wave
    const waveCanvas = document.getElementById('revealWaveCanvas');
    let wave = null;
    if (waveCanvas && window.VoiceWave) {
        wave = window.VoiceWave.init(waveCanvas, { active: false });
    }

    // TTS
    let speaking = false;
    const speakBtn = document.getElementById('speakBtn');
    const speakStatus = document.getElementById('revealSpeakStatus');

    function speak() {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        const synth = window.speechSynthesis;

        if (speaking) {
            synth.cancel();
            speaking = false;
            speakBtn.textContent = 'Hear the verdict';
            speakStatus.textContent = 'Silence. For now.';
            if (wave) wave.setActive(false);
            return;
        }

        const fullText = `${roast.name}, here is your cosmic roast. ${roast.roast} ${roast.astro_verdict}`;
        const utter = new SpeechSynthesisUtterance(fullText);
        utter.rate = 0.94;
        utter.pitch = 0.85;
        const voice = synth
            .getVoices()
            .find((v) => /en-GB|Daniel|Google UK|Samantha/i.test(`${v.lang} ${v.name}`));
        if (voice) utter.voice = voice;
        utter.onend = () => {
            speaking = false;
            speakBtn.textContent = 'Hear the verdict';
            speakStatus.textContent = 'Silence. For now.';
            if (wave) wave.setActive(false);
        };
        utter.onerror = () => {
            speaking = false;
            speakBtn.textContent = 'Hear the verdict';
            speakStatus.textContent = 'Silence. For now.';
            if (wave) wave.setActive(false);
        };

        speaking = true;
        speakBtn.textContent = 'Silence it';
        speakStatus.textContent = 'The heavens are speaking.';
        if (wave) wave.setActive(true);
        synth.speak(utter);
    }

    speakBtn.addEventListener('click', speak);

    // Cleanup on leave
    window.addEventListener('beforeunload', () => {
        window.speechSynthesis?.cancel();
    });
})();
