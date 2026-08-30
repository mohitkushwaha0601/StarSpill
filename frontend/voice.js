/**
 * StarSpill - Voice Input Module (v2)
 * Fixed: race conditions, stuck states, fallback to form
 */

const QUESTIONS = [
  { key: "name", text: "What is your name?" },
  { key: "dob", text: "What is your date of birth?", parse: parseDob },
  { key: "obsession", text: "What are you obsessed with?" },
  { key: "intensity", text: "What roast intensity do you want? Say low, mid, or no mercy.", parse: parseIntensity },
];

const INTENSITY_MAP = {
  low: "mild",
  mid: "savage",
  no_mercy: "nuclear",
};

function parseDob(text) {
  const cleaned = text.toLowerCase().trim();
  const months = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
    jan: "01", feb: "02", mar: "03", apr: "04",
    jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };

  const matchSlash = cleaned.match(/(\d{1,2})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{2,4})/);
  if (matchSlash) {
    const [, a, b, y] = matchSlash;
    const year = y.length === 2 ? `20${y}` : y;
    const month = a.padStart(2, "0");
    const day = b.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const spoken = cleaned.replace(/(\d+)(st|nd|rd|th)/g, "$1");
  for (const [name, num] of Object.entries(months)) {
    if (spoken.includes(name)) {
      const allNums = spoken.match(/\d{1,2}/g) || [];
      const dayNum = allNums.find((n) => parseInt(n) >= 1 && parseInt(n) <= 31 && n !== allNums[allNums.length - 1]);
      const yearMatch = spoken.match(/(\d{4})/);
      const year = yearMatch ? yearMatch[1] : "2000";
      const day = dayNum || "01";
      return `${year}-${num}-${day.padStart(2, "0")}`;
    }
  }

  return text;
}

function parseIntensity(text) {
  const lower = text.toLowerCase().trim();
  if (lower.includes("no mercy") || lower.includes("mercy")) return "no_mercy";
  if (lower.includes("mid")) return "mid";
  if (lower.includes("low") || lower.includes("soft") || lower.includes("gentle")) return "low";
  return "mid";
}

function hasSpeechSynthesis() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function hasSpeechRecognition() {
  return typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
}

function speakText(text, maxMs = 15000) {
  return new Promise((resolve) => {
    if (!hasSpeechSynthesis()) { resolve(); return; }

    const synth = window.speechSynthesis;
    synth.cancel();

    let done = false;
    function finish() {
      if (done) return;
      done = true;
      try { synth.cancel(); } catch {}
      resolve();
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 0.9;
    const voice = synth
      .getVoices()
      .find((v) => /en-GB|Daniel|Google UK|Samantha/i.test(`${v.lang} ${v.name}`));
    if (voice) utter.voice = voice;
    utter.onend = finish;
    utter.onerror = finish;
    synth.speak(utter);

    setTimeout(finish, maxMs);
  });
}

function stopSpeaking() {
  if (hasSpeechSynthesis()) {
    window.speechSynthesis.cancel();
  }
}

function listenOnce(timeoutMs = 10000) {
  return new Promise((resolve) => {
    if (!hasSpeechRecognition()) {
      console.warn("[Voice] No SpeechRecognition API available");
      resolve("");
      return;
    }

    stopSpeaking();

    let resolved = false;
    let recognition = null;
    let timeoutId = null;

    function cleanup() {
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
      if (recognition) {
        try { recognition.abort(); } catch {}
        recognition = null;
      }
    }

    function finish(value) {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(value);
    }

    timeoutId = setTimeout(() => {
      console.warn("[Voice] listenOnce timed out");
      finish("");
    }, timeoutMs);

    try {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          }
        }
        if (final) {
          console.log("[Voice] Recognized:", final);
          finish(final.trim());
        }
      };

      recognition.onerror = (e) => {
        console.warn("[Voice] Recognition error:", e.error);
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          finish("");
        }
        // For other errors (no-speech, aborted), the timeout will handle it
      };

      recognition.onend = () => {
        // If it ends without a final result, the timeout will resolve
        console.log("[Voice] Recognition ended");
      };

      console.log("[Voice] Starting speech recognition...");
      recognition.start();
    } catch (err) {
      console.error("[Voice] Failed to start recognition:", err);
      finish("");
    }
  });
}

function toBackendDob(isoDob) {
  if (!isoDob.includes("-")) return isoDob;
  const [y, m, d] = isoDob.split("-");
  if (!y || !m || !d) return isoDob;
  return `${d}-${m}-${y}`;
}

/**
 * Voice flow controller.
 */
function initVoiceFlow({ onPhaseChange, onComplete, onAnswer, onFallback }) {
  let cancelled = false;
  let currentPhase = "idle";

  function setPhase(phase, data) {
    currentPhase = phase;
    onPhaseChange(phase, data);
  }

  async function askWithVoice(q, collected) {
    console.log(`[Voice] === Asking: ${q.key} ===`);
    setPhase(`asking-${q.key}`, { question: q.text, answer: "" });

    await speakText(q.text);
    if (cancelled) return null;

    console.log(`[Voice] === Listening: ${q.key} ===`);
    setPhase(`listening-${q.key}`, { question: q.text, answer: "" });

    // Small delay to let recognition engine initialize after TTS stops
    await new Promise((r) => setTimeout(r, 200));
    if (cancelled) return null;

    const responseText = await listenOnce(10000);
    if (cancelled) return null;

    console.log(`[Voice] === Got for ${q.key}: "${responseText}" ===`);

    if (!responseText) {
      // Voice failed for this question — trigger fallback
      console.warn(`[Voice] No input for ${q.key}, triggering fallback`);
      return null;
    }

    const parsed = q.parse ? q.parse(responseText) : responseText;
    collected[q.key] = parsed;
    onAnswer({ ...collected });

    await new Promise((r) => setTimeout(r, 200));
    return parsed;
  }

  async function runConversation() {
    cancelled = false;
    onAnswer({});
    setPhase("intro");
    console.log("[Voice] Starting conversation");

    await speakText("Welcome to StarSpill. I'm going to need a few things from you before the cosmos can roast you.");
    if (cancelled) return;

    const collected = {};

    for (const q of QUESTIONS) {
      if (cancelled) return;

      const result = await askWithVoice(q, collected);
      if (result === null) {
        // Voice failed — fallback to form
        console.warn("[Voice] Voice failed, falling back to form");
        cancelled = true;
        stopSpeaking();
        if (onFallback) onFallback(collected);
        return;
      }
    }

    if (cancelled) return;

    console.log("[Voice] All questions answered:", collected);
    setPhase("loading", { text: "Contacting the stars..." });

    const backendDob = toBackendDob(collected.dob || "");
    const intensity = INTENSITY_MAP[collected.intensity || "mid"] || "savage";

    try {
      setPhase("loading", { text: "Generating your roast..." });
      const res = await fetch("http://localhost:8000/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: collected.name,
          dob: backendDob,
          obsession: collected.obsession,
          roast_intensity: intensity,
        }),
      });

      console.log(`[Voice] API status: ${res.status}`);

      if (!cancelled) {
        const data = await res.json();
        console.log("[Voice] Roast result:", data);
        setPhase("done", {});
        await new Promise((r) => setTimeout(r, 500));
        onComplete(data);
      }
    } catch (err) {
      console.error("[Voice] API error:", err);
      if (!cancelled) {
        setPhase("idle", { text: "The stars are offline. Try again." });
      }
    }
  }

  function cancel() {
    cancelled = true;
    stopSpeaking();
  }

  function start() {
    if (currentPhase === "idle" || currentPhase === "done") {
      runConversation();
    }
  }

  return { start, cancel, getPhase: () => currentPhase };
}

window.VoiceFlow = { initVoiceFlow, speakText, listenOnce, hasSpeechRecognition };
