const STORAGE_KEY = "estadistica-trainer-progress-v1";

const state = {
  total: 0,
  correct: 0,
  focusMode: false,
  currentQuestion: null,
  wrongQueue: [],
  byTopic: {},
};

const topicGenerators = {
  "Población y muestra": [genPoblacionMuestra],
  "Tipos de datos": [genTipoDato],
  "Medidas de tendencia central": [genMedia, genMediana, genModa],
  "Dispersión y cuartiles": [genIQR, genOutlier, genVarianza],
  "Frecuencias": [genFrecuencia],
  "Interpretación de gráficos": [genRelacion],
};

const totalEl = document.getElementById("total");
const correctEl = document.getElementById("correct");
const accuracyEl = document.getElementById("accuracy");
const topicEl = document.getElementById("topic");
const questionEl = document.getElementById("question");
const answerAreaEl = document.getElementById("answer-area");
const feedbackEl = document.getElementById("feedback");
const weakTopicsEl = document.getElementById("weak-topics");
const formEl = document.getElementById("answer-form");
const nextBtn = document.getElementById("next-btn");
const focusToggle = document.getElementById("focus-toggle");

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
    .slice(0, 5);

  if (!ordered.length) {
    weakTopicsEl.innerHTML = "<li>Todavía no hay errores registrados.</li>";
    return;
  }

  for (const item of ordered) {
    const li = document.createElement("li");
    li.textContent = `${item.topic}: ${Math.round(item.rate * 100)}% de error (${item.errors}/${item.attempts})`;
    weakTopicsEl.appendChild(li);
  }
}

function topicWeights() {
  const topics = Object.keys(topicGenerators);
  return topics.map((topic) => {
    ensureTopic(topic);
    const info = state.byTopic[topic];
    const rate = info.attempts ? info.errors / info.attempts : 0;
    const base = 1;
    const penalty = info.errors * 2 + rate * 4;
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
  if (state.wrongQueue.length && (state.focusMode || Math.random() < 0.5)) {
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
      row.className = "option";
      row.innerHTML = `<input type="radio" name="answer" value="${idx}" required /> ${option}`;
      answerAreaEl.appendChild(row);
    });
    return;
  }
  const input = document.createElement("input");
  input.required = true;
  input.name = "answer";
  input.type = question.type === "number" ? "number" : "text";
  if (question.type === "number") input.step = "any";
  answerAreaEl.appendChild(input);
}

function renderQuestion() {
  feedbackEl.textContent = "";
  const question = createQuestion();
  state.currentQuestion = question;
  ensureTopic(question.topic);
  topicEl.textContent = `Tema: ${question.topic}`;
  questionEl.textContent = question.prompt;
  renderAnswerInput(question);
}

function readAnswer(question, formData) {
  const raw = formData.get("answer");
  if (question.type === "number") return Number(raw);
  if (question.type === "choice") return Number(raw);
  return String(raw).trim().toLowerCase();
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      total: state.total,
      correct: state.correct,
      byTopic: state.byTopic,
      wrongQueue: state.wrongQueue.slice(-30),
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
    state.wrongQueue = saved.wrongQueue || [];
    state.focusMode = Boolean(saved.focusMode);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function addWrongQuestion(question) {
  state.wrongQueue.push({
    ...question,
    options: question.options ? [...question.options] : undefined,
  });
  if (state.wrongQueue.length > 50) state.wrongQueue.shift();
}

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.currentQuestion) return;
  const question = state.currentQuestion;
  const topicInfo = state.byTopic[question.topic];
  const answer = readAnswer(question, new FormData(formEl));

  state.total += 1;
  topicInfo.attempts += 1;
  const ok = question.check(answer);

  if (ok) {
    state.correct += 1;
    feedbackEl.textContent = "✅ Correcto.";
  } else {
    topicInfo.errors += 1;
    addWrongQuestion(question);
    feedbackEl.textContent = `❌ Incorrecto. ${question.explanation}`;
  }

  updateStatsView();
  updateWeakTopicsView();
  saveState();
});

nextBtn.addEventListener("click", () => {
  renderQuestion();
});

focusToggle.addEventListener("click", () => {
  state.focusMode = !state.focusMode;
  updateStatsView();
  saveState();
});

function genPoblacionMuestra() {
  const cases = [
    {
      scenario: "En una ciudad hay 45.000 estudiantes y se encuestan 600 para estimar horas de estudio.",
      answer: "muestra",
    },
    {
      scenario: "Un censo releva a todos los hogares de una provincia.",
      answer: "población",
    },
    {
      scenario: "Una fábrica revisa 80 focos de un lote de 4.000 para estimar defectos.",
      answer: "muestra",
    },
    {
      scenario: "Una app analiza los datos de los 12.000 usuarios activos del mes.",
      answer: "población",
    },
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
  const data = Array.from({ length: 5 }, () => randInt(8, 40));
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
  const data = Array.from({ length: 7 }, () => randInt(10, 60)).sort((a, b) => a - b);
  const result = median(data);
  return {
    topic: "Medidas de tendencia central",
    type: "number",
    prompt: `Calculá la mediana de: ${data.join(", ")}.`,
    check: (value) => Math.abs(value - result) < 0.01,
    explanation: `Mediana = ${result}.`,
  };
}

function genModa() {
  const base = [randInt(1, 5), randInt(1, 5), randInt(1, 5)];
  const modeValue = randInt(2, 9);
  const data = shuffle([...base, modeValue, modeValue, modeValue, randInt(1, 9)]);
  return {
    topic: "Medidas de tendencia central",
    type: "number",
    prompt: `Indicá la moda del siguiente conjunto: ${data.join(", ")}.`,
    check: (value) => Number(value) === modeValue,
    explanation: `Moda = ${modeValue}.`,
  };
}

function genIQR() {
  const data = Array.from({ length: 8 }, () => randInt(10, 50)).sort((a, b) => a - b);
  const lower = data.slice(0, 4);
  const upper = data.slice(4);
  const q1 = median(lower);
  const q3 = median(upper);
  const iqr = q3 - q1;
  return {
    topic: "Dispersión y cuartiles",
    type: "number",
    prompt: `Datos ordenados: ${data.join(", ")}. Calculá el rango intercuartil (Q3 - Q1).`,
    check: (value) => Math.abs(value - iqr) < 0.01,
    explanation: `Q1=${q1}, Q3=${q3}, IQR=${iqr}.`,
  };
}

function genOutlier() {
  const q1 = randInt(15, 30);
  const q3 = q1 + randInt(8, 18);
  const iqr = q3 - q1;
  const low = q1 - 1.5 * iqr;
  const high = q3 + 1.5 * iqr;
  const candidate = Math.random() < 0.5 ? randInt(Math.floor(low) - 8, Math.floor(low) - 1) : randInt(Math.ceil(high) + 1, Math.ceil(high) + 10);
  return {
    topic: "Dispersión y cuartiles",
    type: "choice",
    prompt: `Si Q1=${q1}, Q3=${q3} e IQR=${iqr}, ¿el valor ${candidate} es atípico según 1.5*IQR?`,
    options: ["Sí", "No"],
    check: (value) => value === 0,
    explanation: `Es atípico porque queda fuera del intervalo [${low.toFixed(2)}, ${high.toFixed(2)}].`,
  };
}

function genVarianza() {
  const data = [randInt(2, 6), randInt(2, 6), randInt(2, 6), randInt(2, 6)];
  const result = variance(data);
  return {
    topic: "Dispersión y cuartiles",
    type: "number",
    prompt: `Calculá la varianza poblacional de: ${data.join(", ")}.`,
    check: (value) => Math.abs(value - result) < 0.01,
    explanation: `Varianza poblacional = ${result.toFixed(2)}.`,
  };
}

function genFrecuencia() {
  const total = randInt(20, 60);
  const freq = randInt(2, total - 2);
  const target = freq / total;
  return {
    topic: "Frecuencias",
    type: "number",
    prompt: `En una muestra de ${total} personas, ${freq} prefieren entrenar por la mañana. Calculá la frecuencia relativa.`,
    check: (value) => Math.abs(value - target) < 0.01,
    explanation: `Frecuencia relativa = ${freq}/${total} = ${target.toFixed(2)}.`,
  };
}

function genRelacion() {
  const cases = [
    {
      prompt: "En un diagrama de dispersión, al aumentar X también aumenta Y de forma clara.",
      answer: "positiva",
    },
    {
      prompt: "En un diagrama de dispersión, al aumentar X, Y tiende a disminuir.",
      answer: "negativa",
    },
    {
      prompt: "En un diagrama de dispersión, los puntos están dispersos sin patrón visible.",
      answer: "nula",
    },
  ];
  const selected = cases[randInt(0, cases.length - 1)];
  const options = ["positiva", "negativa", "nula"];
  return {
    topic: "Interpretación de gráficos",
    type: "choice",
    prompt: `${selected.prompt} ¿Qué tipo de relación describís?`,
    options,
    check: (value) => options[value] === selected.answer,
    explanation: `La relación es ${selected.answer}.`,
  };
}

loadState();
updateStatsView();
updateWeakTopicsView();
renderQuestion();
