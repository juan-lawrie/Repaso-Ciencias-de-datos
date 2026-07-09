const STORAGE_KEY = "estadistica-exam-progress-v2";

const state = {
  total: 0,
  correct: 0,
  focusMode: false,
  currentQuestion: null,
  currentQuestionLock: false,
  wrongQueue: [],
  byTopic: {},
  exam: {
    active: false,
    size: 20,
    durationSec: 30 * 60,
    answered: 0,
    correct: 0,
    startMs: null,
    timerId: null,
  },
};

const totalEl = document.getElementById("total");
const correctEl = document.getElementById("correct");
const accuracyEl = document.getElementById("accuracy");
const topicEl = document.getElementById("topic");
const questionEl = document.getElementById("question");
const visualAreaEl = document.getElementById("visual-area");
const answerAreaEl = document.getElementById("answer-area");
const feedbackEl = document.getElementById("feedback");
const weakTopicsEl = document.getElementById("weak-topics");
const resultBoxEl = document.getElementById("result-box");
const formEl = document.getElementById("answer-form");
const submitBtn = document.getElementById("submit-btn");
const nextBtn = document.getElementById("next-btn");
const focusToggle = document.getElementById("focus-toggle");
const startExamBtn = document.getElementById("start-exam-btn");
const finishExamBtn = document.getElementById("finish-exam-btn");
const examSizeEl = document.getElementById("exam-size");
const examTimeEl = document.getElementById("exam-time");
const examProgressLabelEl = document.getElementById("exam-progress-label");
const timerLabelEl = document.getElementById("timer-label");
const examProgressBarEl = document.getElementById("exam-progress-bar");

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(values) {
  return [...values].sort(() => Math.random() - 0.5);
}

function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(sortedValues) {
  const arr = [...sortedValues].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  if (arr.length % 2 === 0) return (arr[mid - 1] + arr[mid]) / 2;
  return arr[mid];
}

function variance(values) {
  const m = mean(values);
  return values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fmtPct(value) {
  return `${Math.round(value * 100)}%`;
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const m = String(Math.floor(safe / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function ensureTopic(topic) {
  if (!state.byTopic[topic]) state.byTopic[topic] = { attempts: 0, errors: 0 };
}

function updateStatsView() {
  totalEl.textContent = state.total;
  correctEl.textContent = state.correct;
  const accuracy = state.total ? Math.round((state.correct / state.total) * 100) : 0;
  accuracyEl.textContent = `${accuracy}%`;
  focusToggle.textContent = `Modo enfoque: ${state.focusMode ? "ON" : "OFF"}`;
}

function updateWeakTopicsView() {
  weakTopicsEl.innerHTML = "";
  const ordered = Object.entries(state.byTopic)
    .map(([topic, values]) => ({
      topic,
      attempts: values.attempts,
      errors: values.errors,
      rate: values.attempts ? values.errors / values.attempts : 0,
    }))
    .sort((a, b) => b.rate - a.rate || b.errors - a.errors)
    .slice(0, 6);

  if (!ordered.length) {
    weakTopicsEl.innerHTML = "<li class='text-slate-500'>Todavía no hay datos de error.</li>";
    return;
  }

  ordered.forEach((item) => {
    const li = document.createElement("li");
    li.className = "rounded-lg bg-slate-50 p-2";
    li.textContent = `${item.topic}: ${Math.round(item.rate * 100)}% de error (${item.errors}/${item.attempts})`;
    weakTopicsEl.appendChild(li);
  });
}

function updateExamView() {
  const exam = state.exam;
  if (!exam.active) {
    examProgressLabelEl.textContent = "Examen no iniciado";
    timerLabelEl.textContent = "00:00";
    examProgressBarEl.style.width = "0%";
    return;
  }

  const answered = exam.answered;
  const progress = exam.size ? (answered / exam.size) * 100 : 0;
  examProgressLabelEl.textContent = `Examen en curso: ${answered}/${exam.size}`;
  examProgressBarEl.style.width = `${clamp(progress, 0, 100)}%`;
}

function topicWeights() {
  const topics = Object.keys(topicGenerators);
  return topics.map((topic) => {
    ensureTopic(topic);
    const info = state.byTopic[topic];
    const errorRate = info.attempts ? info.errors / info.attempts : 0;
    const base = 1;
    const penalty = info.errors * 2 + errorRate * 4;
    return { topic, weight: base + penalty };
  });
}

function weightedPick(items) {
  const sum = items.reduce((acc, item) => acc + item.weight, 0);
  let pick = Math.random() * sum;
  for (const item of items) {
    pick -= item.weight;
    if (pick <= 0) return item.topic;
  }
  return items[items.length - 1].topic;
}

function createQuestion() {
  if (state.wrongQueue.length && (state.focusMode || Math.random() < 0.35)) {
    return state.wrongQueue.shift();
  }
  const selectedTopic = weightedPick(topicWeights());
  const generators = topicGenerators[selectedTopic];
  const generator = generators[randInt(0, generators.length - 1)];
  return generator();
}

function renderAnswerInput(question) {
  answerAreaEl.innerHTML = "";
  if (question.type === "choice") {
    question.options.forEach((option, idx) => {
      const row = document.createElement("label");
      row.className = "flex items-center gap-2 rounded-lg border border-slate-200 p-2 hover:bg-slate-50";
      row.innerHTML = `<input type="radio" name="answer" value="${idx}" required /> ${option}`;
      answerAreaEl.appendChild(row);
    });
    return;
  }

  if (question.type === "multi-number") {
    question.fields.forEach((field) => {
      const row = document.createElement("div");
      row.className = "grid gap-1";
      row.innerHTML = `
        <label for="${field.key}" class="text-sm font-medium text-slate-700">${field.label}</label>
        <input id="${field.key}" name="${field.key}" type="number" step="any" required
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
      `;
      answerAreaEl.appendChild(row);
    });
    return;
  }

  const input = document.createElement("input");
  input.required = true;
  input.name = "answer";
  input.type = question.type === "number" ? "number" : "text";
  if (question.type === "number") input.step = "any";
  input.className =
    "w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";
  answerAreaEl.appendChild(input);
}

function renderQuestion() {
  feedbackEl.textContent = "";
  const question = createQuestion();
  state.currentQuestion = question;
  state.currentQuestionLock = false;
  ensureTopic(question.topic);

  topicEl.textContent = question.topic;
  questionEl.textContent = question.prompt;
  visualAreaEl.innerHTML = question.visual ?? "<p class='text-sm text-slate-500'>Sin recurso visual para este ejercicio.</p>";

  renderAnswerInput(question);
  submitBtn.disabled = false;
  nextBtn.disabled = true;
}

function readAnswer(question, formData) {
  if (question.type === "choice") return Number(formData.get("answer"));
  if (question.type === "number") return Number(formData.get("answer"));
  if (question.type === "multi-number") {
    const payload = {};
    question.fields.forEach((field) => {
      payload[field.key] = Number(formData.get(field.key));
    });
    return payload;
  }
  return String(formData.get("answer")).trim().toLowerCase();
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      total: state.total,
      correct: state.correct,
      byTopic: state.byTopic,
      focusMode: state.focusMode,
    })
  );
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    state.total = saved.total || 0;
    state.correct = saved.correct || 0;
    state.byTopic = saved.byTopic || {};
    state.focusMode = Boolean(saved.focusMode);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function addWrongQuestion(question) {
  if (state.wrongQueue.length > 60) state.wrongQueue.shift();
  state.wrongQueue.push({ ...question });
}

function gradeCurrentQuestion(answer) {
  const question = state.currentQuestion;
  const ok = question.check(answer);
  const topicInfo = state.byTopic[question.topic];

  state.total += 1;
  topicInfo.attempts += 1;

  if (ok) {
    state.correct += 1;
  } else {
    topicInfo.errors += 1;
    addWrongQuestion(question);
  }

  if (state.exam.active) {
    state.exam.answered += 1;
    if (ok) state.exam.correct += 1;
  }

  updateStatsView();
  updateWeakTopicsView();
  updateExamView();
  saveState();
  return ok;
}

function runTimerTick() {
  if (!state.exam.active) return;
  const elapsed = (Date.now() - state.exam.startMs) / 1000;
  const remaining = state.exam.durationSec - elapsed;
  timerLabelEl.textContent = formatTime(remaining);
  if (remaining <= 0) finishExam("Tiempo agotado.");
}

function startExam() {
  state.exam.active = true;
  state.exam.size = Number(examSizeEl.value);
  state.exam.durationSec = Number(examTimeEl.value) * 60;
  state.exam.answered = 0;
  state.exam.correct = 0;
  state.exam.startMs = Date.now();

  if (state.exam.timerId) clearInterval(state.exam.timerId);
  state.exam.timerId = setInterval(runTimerTick, 500);

  resultBoxEl.innerHTML = "<p class='text-slate-600'>Examen iniciado. ¡Concentrate y resolvé cada ejercicio!</p>";
  updateExamView();
  runTimerTick();
  renderQuestion();
}

function finishExam(reason = "Examen finalizado.") {
  if (!state.exam.active) return;
  state.exam.active = false;
  if (state.exam.timerId) {
    clearInterval(state.exam.timerId);
    state.exam.timerId = null;
  }
  const pct = state.exam.answered ? Math.round((state.exam.correct / state.exam.answered) * 100) : 0;
  resultBoxEl.innerHTML = `
    <p class="font-semibold text-slate-800">${reason}</p>
    <p class="mt-1">Resultado: <strong>${state.exam.correct}/${state.exam.answered}</strong> (${pct}%).</p>
    <p class="mt-1 text-slate-600">Revisá “Temas donde más fallás” y activá Modo enfoque para reforzar.</p>
  `;
  updateExamView();
}

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.currentQuestion || state.currentQuestionLock) return;

  const answer = readAnswer(state.currentQuestion, new FormData(formEl));
  const ok = gradeCurrentQuestion(answer);
  if (ok) {
    feedbackEl.textContent = "✅ Correcto.";
    feedbackEl.className = "mt-3 text-sm font-semibold text-emerald-700";
  } else {
    feedbackEl.textContent = `❌ Incorrecto. ${state.currentQuestion.explanation}`;
    feedbackEl.className = "mt-3 text-sm font-semibold text-rose-700";
  }

  state.currentQuestionLock = true;
  submitBtn.disabled = true;
  nextBtn.disabled = false;

  if (state.exam.active && state.exam.answered >= state.exam.size) {
    finishExam("Completaste todas las preguntas del examen.");
  }
});

nextBtn.addEventListener("click", () => {
  renderQuestion();
});

focusToggle.addEventListener("click", () => {
  state.focusMode = !state.focusMode;
  updateStatsView();
  saveState();
});

startExamBtn.addEventListener("click", () => {
  startExam();
});

finishExamBtn.addEventListener("click", () => {
  finishExam("Examen finalizado manualmente.");
});

const palette = ["#4f46e5", "#0ea5e9", "#14b8a6", "#22c55e", "#eab308", "#ef4444"];

function pieVisual(labels, values) {
  const total = values.reduce((a, b) => a + b, 0);
  let offset = 0;
  const parts = values.map((v, i) => {
    const start = (offset / total) * 360;
    offset += v;
    const end = (offset / total) * 360;
    return `${palette[i % palette.length]} ${start}deg ${end}deg`;
  });
  const legend = labels
    .map(
      (label, i) =>
        `<li class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-full" style="background:${palette[i % palette.length]}"></span>${label}: ${values[i]}</li>`
    )
    .join("");

  return `
    <div class="flex flex-wrap items-center gap-5">
      <div class="h-44 w-44 rounded-full border border-slate-200" style="background: conic-gradient(${parts.join(", ")});"></div>
      <ul class="space-y-1 text-sm">${legend}</ul>
    </div>
  `;
}

function barVisual(labels, values, title = "Gráfico de barras") {
  const maxV = Math.max(...values);
  const bars = labels
    .map((label, i) => {
      const h = Math.round((values[i] / maxV) * 140);
      return `
        <div class="flex flex-col items-center gap-1">
          <div class="text-xs text-slate-600">${values[i]}</div>
          <div class="w-10 rounded-t bg-sky-500" style="height:${h}px"></div>
          <div class="w-16 text-center text-xs text-slate-600">${label}</div>
        </div>
      `;
    })
    .join("");
  return `
    <p class="mb-2 text-sm font-medium text-slate-700">${title}</p>
    <div class="flex min-h-[180px] items-end gap-3 rounded-lg bg-slate-50 p-3">${bars}</div>
  `;
}

function histogramVisual(labels, freqs) {
  const maxF = Math.max(...freqs);
  const bars = labels
    .map((label, i) => {
      const h = Math.round((freqs[i] / maxF) * 140);
      return `
        <div class="flex flex-col items-center gap-1">
          <div class="text-xs text-slate-600">${freqs[i]}</div>
          <div class="w-12 bg-emerald-500" style="height:${h}px"></div>
          <div class="w-14 text-center text-[10px] text-slate-600">${label}</div>
        </div>
      `;
    })
    .join("");
  return `
    <p class="mb-2 text-sm font-medium text-slate-700">Histograma (clases contiguas)</p>
    <div class="flex min-h-[180px] items-end gap-0 rounded-lg bg-slate-50 p-3">${bars}</div>
  `;
}

function scatterVisual(points) {
  const circles = points
    .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#4f46e5" opacity="0.9"></circle>`)
    .join("");
  return `
    <p class="mb-2 text-sm font-medium text-slate-700">Diagrama de dispersión</p>
    <svg viewBox="0 0 260 180" class="w-full max-w-md rounded-lg bg-slate-50 p-2">
      <line x1="25" y1="150" x2="245" y2="150" stroke="#64748b" stroke-width="2"></line>
      <line x1="25" y1="150" x2="25" y2="20" stroke="#64748b" stroke-width="2"></line>
      ${circles}
    </svg>
  `;
}

function boxplotVisual(minV, q1, med, q3, maxV) {
  const scale = (v) => 20 + ((v - minV) / (maxV - minV || 1)) * 210;
  const minX = scale(minV);
  const q1X = scale(q1);
  const medX = scale(med);
  const q3X = scale(q3);
  const maxX = scale(maxV);
  return `
    <p class="mb-2 text-sm font-medium text-slate-700">Boxplot horizontal</p>
    <svg viewBox="0 0 260 100" class="w-full max-w-md rounded-lg bg-slate-50 p-2">
      <line x1="${minX}" y1="50" x2="${q1X}" y2="50" stroke="#0f766e" stroke-width="3"></line>
      <line x1="${q3X}" y1="50" x2="${maxX}" y2="50" stroke="#0f766e" stroke-width="3"></line>
      <rect x="${q1X}" y="30" width="${Math.max(4, q3X - q1X)}" height="40" fill="#14b8a6" opacity="0.45" stroke="#0f766e"></rect>
      <line x1="${medX}" y1="30" x2="${medX}" y2="70" stroke="#0f766e" stroke-width="3"></line>
      <line x1="${minX}" y1="40" x2="${minX}" y2="60" stroke="#0f766e" stroke-width="3"></line>
      <line x1="${maxX}" y1="40" x2="${maxX}" y2="60" stroke="#0f766e" stroke-width="3"></line>
    </svg>
  `;
}

function genPoblacionMuestra() {
  const cases = [
    { scenario: "En una ciudad hay 45.000 estudiantes y se encuestan 600.", answer: "muestra" },
    { scenario: "Un censo releva a todos los hogares de la provincia.", answer: "población" },
    { scenario: "Se revisan 80 focos de un lote de 4.000.", answer: "muestra" },
    { scenario: "Se analizan todos los 12.000 usuarios activos del mes.", answer: "población" },
  ];
  const selected = cases[randInt(0, cases.length - 1)];
  return {
    topic: "Población y muestra",
    type: "choice",
    prompt: `${selected.scenario} ¿El conjunto analizado es población o muestra?`,
    options: ["Población", "Muestra"],
    check: (value) => (selected.answer === "población" ? value === 0 : value === 1),
    explanation: `La respuesta correcta es ${selected.answer}.`,
  };
}

function genTipoDato() {
  const cases = [
    { variable: "Cantidad de hermanos", answer: "cuantitativa discreta" },
    { variable: "Altura de una persona", answer: "cuantitativa continua" },
    { variable: "Nivel de satisfacción (bajo/medio/alto)", answer: "cualitativa ordinal" },
    { variable: "Color favorito", answer: "cualitativa nominal" },
  ];
  const selected = cases[randInt(0, cases.length - 1)];
  const options = shuffle([
    "cuantitativa discreta",
    "cuantitativa continua",
    "cualitativa nominal",
    "cualitativa ordinal",
  ]);
  return {
    topic: "Tipos de datos",
    type: "choice",
    prompt: `Clasificá la variable: "${selected.variable}".`,
    options,
    check: (value) => options[value] === selected.answer,
    explanation: `La clasificación correcta es ${selected.answer}.`,
  };
}

function genMedia() {
  const data = Array.from({ length: 5 }, () => randInt(8, 42));
  const result = mean(data);
  return {
    topic: "Medidas de tendencia central",
    type: "number",
    prompt: `Calculá la media de: ${data.join(", ")}.`,
    check: (value) => Math.abs(value - result) < 0.01,
    explanation: `Media = ${result.toFixed(2)}.`,
  };
}

function genMediana() {
  const data = Array.from({ length: 7 }, () => randInt(10, 70)).sort((a, b) => a - b);
  const result = median(data);
  return {
    topic: "Medidas de tendencia central",
    type: "number",
    prompt: `Calculá la mediana de: ${data.join(", ")}.`,
    check: (value) => Math.abs(value - result) < 0.01,
    explanation: `Mediana = ${result}.`,
  };
}

function genVarianza() {
  const data = [randInt(2, 8), randInt(2, 8), randInt(2, 8), randInt(2, 8)];
  const result = variance(data);
  return {
    topic: "Dispersión y cuartiles",
    type: "number",
    prompt: `Calculá la varianza poblacional de: ${data.join(", ")}.`,
    check: (value) => Math.abs(value - result) < 0.01,
    explanation: `Varianza poblacional = ${result.toFixed(2)}.`,
  };
}

function genPieChart() {
  const labels = ["Matemática", "Programación", "Estadística", "Inglés"];
  const raw = [randInt(10, 35), randInt(10, 35), randInt(10, 35), randInt(10, 35)];
  const sum = raw.reduce((a, b) => a + b, 0);
  const values = raw.map((v) => Math.round((v / sum) * 100));
  values[0] += 100 - values.reduce((a, b) => a + b, 0);
  const maxIndex = values.indexOf(Math.max(...values));
  const options = shuffle(labels);

  return {
    topic: "Análisis de gráfico de torta",
    type: "choice",
    prompt: "Según el gráfico de torta, ¿qué materia tiene la mayor proporción?",
    visual: pieVisual(labels, values),
    options,
    check: (value) => options[value] === labels[maxIndex],
    explanation: `La porción más grande corresponde a ${labels[maxIndex]}.`,
  };
}

function genBarChart() {
  const labels = ["Ene", "Feb", "Mar", "Abr"];
  const values = labels.map(() => randInt(12, 55));
  const maxLabel = labels[values.indexOf(Math.max(...values))];
  const options = shuffle([...labels]);
  return {
    topic: "Análisis de gráfico de barras",
    type: "choice",
    prompt: "Observá el gráfico de barras y elegí el mes con mayor valor.",
    visual: barVisual(labels, values, "Ventas por mes"),
    options,
    check: (value) => options[value] === maxLabel,
    explanation: `El mes con mayor valor es ${maxLabel}.`,
  };
}

function genHistogram() {
  const labels = ["0-10", "10-20", "20-30", "30-40", "40-50"];
  const freqs = labels.map(() => randInt(4, 24));
  const peak = labels[freqs.indexOf(Math.max(...freqs))];
  const options = shuffle([...labels]);
  return {
    topic: "Análisis de histograma",
    type: "choice",
    prompt: "¿En qué intervalo se concentra la mayor frecuencia?",
    visual: histogramVisual(labels, freqs),
    options,
    check: (value) => options[value] === peak,
    explanation: `El intervalo modal es ${peak}.`,
  };
}

function genScatter() {
  const relationTypes = ["positiva", "negativa", "nula"];
  const relation = relationTypes[randInt(0, relationTypes.length - 1)];
  const points = [];
  for (let i = 0; i < 18; i += 1) {
    const x = 30 + i * 11;
    let y;
    if (relation === "positiva") y = 140 - i * 6 + randInt(-10, 10);
    if (relation === "negativa") y = 35 + i * 6 + randInt(-10, 10);
    if (relation === "nula") y = randInt(35, 140);
    points.push({ x, y: clamp(y, 25, 145) });
  }
  const options = ["positiva", "negativa", "nula"];
  return {
    topic: "Análisis de dispersión",
    type: "choice",
    prompt: "¿Qué tipo de relación se observa entre X e Y?",
    visual: scatterVisual(points),
    options,
    check: (value) => options[value] === relation,
    explanation: `La relación observada es ${relation}.`,
  };
}

function genBoxplot() {
  const minV = randInt(8, 20);
  const q1 = minV + randInt(4, 10);
  const med = q1 + randInt(3, 9);
  const q3 = med + randInt(3, 9);
  const maxV = q3 + randInt(4, 12);
  return {
    topic: "Análisis de boxplot",
    type: "number",
    prompt: "Según el boxplot, ¿cuál es la mediana aproximada?",
    visual: boxplotVisual(minV, q1, med, q3, maxV),
    check: (value) => Math.abs(value - med) < 1.1,
    explanation: `La mediana es aproximadamente ${med}.`,
  };
}

function genTablaFrecuencias() {
  const cats = ["A", "B", "C"];
  const abs = [randInt(8, 20), randInt(8, 20), randInt(8, 20)];
  const total = abs.reduce((a, b) => a + b, 0);
  const rA = abs[0] / total;
  const rC = abs[2] / total;

  return {
    topic: "Tablas de frecuencias",
    type: "multi-number",
    prompt: "Completá las frecuencias relativas faltantes (en decimal).",
    visual: `
      <p class="mb-2 text-sm font-medium text-slate-700">Tabla de frecuencias</p>
      <table class="w-full max-w-md border-collapse text-sm">
        <thead>
          <tr>
            <th class="border border-slate-300 bg-slate-50 p-2 text-left">Categoría</th>
            <th class="border border-slate-300 bg-slate-50 p-2 text-left">f absoluta</th>
            <th class="border border-slate-300 bg-slate-50 p-2 text-left">f relativa</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="border border-slate-300 p-2">${cats[0]}</td><td class="border border-slate-300 p-2">${abs[0]}</td><td class="border border-slate-300 p-2">?</td></tr>
          <tr><td class="border border-slate-300 p-2">${cats[1]}</td><td class="border border-slate-300 p-2">${abs[1]}</td><td class="border border-slate-300 p-2">${fmtPct(abs[1] / total)}</td></tr>
          <tr><td class="border border-slate-300 p-2">${cats[2]}</td><td class="border border-slate-300 p-2">${abs[2]}</td><td class="border border-slate-300 p-2">?</td></tr>
          <tr><td class="border border-slate-300 p-2 font-semibold">Total</td><td class="border border-slate-300 p-2 font-semibold">${total}</td><td class="border border-slate-300 p-2 font-semibold">100%</td></tr>
        </tbody>
      </table>
    `,
    fields: [
      { key: "relA", label: `Frecuencia relativa de ${cats[0]}` },
      { key: "relC", label: `Frecuencia relativa de ${cats[2]}` },
    ],
    check: (values) => Math.abs(values.relA - rA) < 0.02 && Math.abs(values.relC - rC) < 0.02,
    explanation: `${cats[0]}=${rA.toFixed(2)} y ${cats[2]}=${rC.toFixed(2)}.`,
  };
}

function genTablaContingencia() {
  const a = randInt(10, 24);
  const b = randInt(10, 24);
  const c = randInt(10, 24);
  const d = randInt(10, 24);
  const row1 = a + b;
  const total = a + b + c + d;

  return {
    topic: "Tablas de contingencia",
    type: "multi-number",
    prompt: "Completá la tabla de doble entrada calculando los totales faltantes.",
    visual: `
      <p class="mb-2 text-sm font-medium text-slate-700">Tabla de contingencia (Vista x Rapidez)</p>
      <table class="w-full max-w-lg border-collapse text-sm">
        <thead>
          <tr>
            <th class="border border-slate-300 bg-slate-50 p-2"></th>
            <th class="border border-slate-300 bg-slate-50 p-2">Rápida</th>
            <th class="border border-slate-300 bg-slate-50 p-2">Lenta</th>
            <th class="border border-slate-300 bg-slate-50 p-2">Total fila</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="border border-slate-300 p-2">Vista al mar</td><td class="border border-slate-300 p-2">${a}</td><td class="border border-slate-300 p-2">${b}</td><td class="border border-slate-300 p-2">?</td></tr>
          <tr><td class="border border-slate-300 p-2">Sin vista</td><td class="border border-slate-300 p-2">${c}</td><td class="border border-slate-300 p-2">${d}</td><td class="border border-slate-300 p-2">${c + d}</td></tr>
          <tr><td class="border border-slate-300 p-2 font-semibold">Total columna</td><td class="border border-slate-300 p-2">${a + c}</td><td class="border border-slate-300 p-2">${b + d}</td><td class="border border-slate-300 p-2">?</td></tr>
        </tbody>
      </table>
    `,
    fields: [
      { key: "row1", label: "Total fila: Vista al mar" },
      { key: "grand", label: "Total general" },
    ],
    check: (values) => Math.abs(values.row1 - row1) < 0.01 && Math.abs(values.grand - total) < 0.01,
    explanation: `Total fila Vista al mar=${row1} y Total general=${total}.`,
  };
}

const topicGenerators = {
  "Población y muestra": [genPoblacionMuestra],
  "Tipos de datos": [genTipoDato],
  "Medidas de tendencia central": [genMedia, genMediana],
  "Dispersión y cuartiles": [genVarianza],
  "Análisis de gráfico de torta": [genPieChart],
  "Análisis de gráfico de barras": [genBarChart],
  "Análisis de histograma": [genHistogram],
  "Análisis de dispersión": [genScatter],
  "Análisis de boxplot": [genBoxplot],
  "Tablas de frecuencias": [genTablaFrecuencias],
  "Tablas de contingencia": [genTablaContingencia],
};

loadState();
updateStatsView();
updateWeakTopicsView();
updateExamView();
renderQuestion();
