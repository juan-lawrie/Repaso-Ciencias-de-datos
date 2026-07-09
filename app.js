const questions = [
  {
    id: "q1",
    topic: "Clasificación de variables",
    type: "choice",
    prompt:
      "En una app de delivery se registra la variable 'nivel de satisfacción' con categorías: Muy baja, Baja, Media, Alta y Muy alta. ¿Cómo se clasifica?",
    options: [
      "Cuantitativa continua",
      "Cuantitativa discreta",
      "Cualitativa ordinal",
      "Cualitativa nominal",
    ],
    correctIndex: 2,
    explanation:
      "Es cualitativa ordinal porque son categorías con orden natural, pero sin distancia numérica medible entre niveles.",
  },
  {
    id: "q2",
    topic: "Clasificación de variables",
    type: "choice",
    prompt:
      "Una fintech mide la cantidad de reclamos recibidos por sucursal durante una semana. ¿Tipo de variable?",
    options: [
      "Cuantitativa discreta",
      "Cuantitativa continua",
      "Cualitativa nominal",
      "Cualitativa ordinal",
    ],
    correctIndex: 0,
    explanation:
      "Es cuantitativa discreta: cuenta eventos enteros (0, 1, 2, ...), no valores continuos.",
  },
  {
    id: "q3",
    topic: "Tipos de muestreo",
    type: "choice",
    prompt:
      "Una cadena minorista divide sus clientes por región (Norte, Centro, Sur) y luego selecciona al azar clientes dentro de cada región proporcionalmente. ¿Qué muestreo es?",
    options: ["Conveniencia", "Sistemático", "Estratificado", "Conglomerados"],
    correctIndex: 2,
    explanation:
      "Es estratificado: primero se forman estratos homogéneos (regiones) y luego se toma muestra aleatoria dentro de cada uno.",
  },
  {
    id: "q4",
    topic: "Tipos de muestreo",
    type: "choice",
    prompt:
      "Un banco ordena a sus 10.000 clientes por ID y encuestan al cliente 15, 35, 55, 75, ... hasta completar la muestra. ¿Qué muestreo es?",
    options: ["Sistemático", "Aleatorio simple", "Conveniencia", "Estratificado"],
    correctIndex: 0,
    explanation:
      "Es muestreo sistemático: se elige un inicio y luego cada k-ésima unidad.",
  },
  {
    id: "q5",
    topic: "Media, mediana y moda",
    type: "choice",
    prompt:
      "Para los tiempos (min) 2, 3, 3, 4, 20, ¿cuál opción muestra correctamente media, mediana y moda?",
    options: [
      "Media = 6.4, Mediana = 3, Moda = 3",
      "Media = 4, Mediana = 3.2, Moda = 20",
      "Media = 6.4, Mediana = 4, Moda = 3",
      "Media = 3, Mediana = 6.4, Moda = 2",
    ],
    correctIndex: 0,
    explanation:
      "Media = (2+3+3+4+20)/5 = 6.4; mediana = 3 (valor central ordenado); moda = 3 (valor más frecuente).",
  },
  {
    id: "q6",
    topic: "Media, mediana y moda",
    type: "choice",
    prompt:
      "Si en el conjunto 2, 3, 3, 4, 20 reemplazás 20 por 200, ¿qué afirmación es correcta?",
    options: [
      "La media cambia mucho y la mediana casi no cambia.",
      "La mediana cambia mucho y la media casi no cambia.",
      "Ni la media ni la mediana cambian.",
      "La moda desaparece y por eso no se puede analizar robustez.",
    ],
    correctIndex: 0,
    explanation:
      "La mediana es robusta frente a atípicos porque depende de posición; la media es sensible porque usa magnitud de todos los datos.",
  },
  {
    id: "q7",
    topic: "IQR y límites de atípicos",
    type: "multi-number",
    prompt:
      "En un análisis salarial se obtuvo Q1 = 40 y Q3 = 64. Completá IQR y límites para atípicos usando la regla 1.5·IQR.",
    fields: [
      { key: "iqr", label: "IQR" },
      { key: "lower", label: "Límite inferior (Q1 - 1.5·IQR)" },
      { key: "upper", label: "Límite superior (Q3 + 1.5·IQR)" },
    ],
    check: (ans) => near(ans.iqr, 24) && near(ans.lower, 4) && near(ans.upper, 100),
    explanation:
      "IQR = 64 - 40 = 24. Límites: inferior = 40 - 1.5·24 = 4, superior = 64 + 1.5·24 = 100.",
  },
  {
    id: "q8",
    topic: "IQR y límites de atípicos",
    type: "choice",
    prompt:
      "Con límites de atípicos [4, 100], ¿qué dato es atípico en la lista 12, 45, 50, 61, 99, 104?",
    options: ["99", "61", "104", "45"],
    correctIndex: 2,
    explanation: "104 supera el límite superior (100), por eso es atípico según la regla del IQR.",
  },
  {
    id: "q9",
    topic: "Tabla de contingencia",
    type: "multi-number",
    prompt:
      "Observá la tabla de contingencia y completá: (a) frecuencia marginal de 'Compra Sí', (b) frecuencia conjunta de 'Sin Email y Compra No'.",
    visual: () => contingencyTable(),
    fields: [
      { key: "marginal", label: "Frecuencia marginal de Compra Sí" },
      { key: "joint", label: "Frecuencia conjunta Sin Email & Compra No" },
    ],
    check: (ans) => near(ans.marginal, 54) && near(ans.joint, 42),
    explanation:
      "Marginal de Compra Sí = 36 + 18 = 54. Conjunta (Sin Email, Compra No) = 42.",
  },
  {
    id: "q10",
    topic: "Tabla de contingencia",
    type: "number",
    prompt:
      "Usando la misma tabla, ¿qué proporción de compra hay dentro del grupo 'Sin Email'? (podés responder en proporción o porcentaje)",
    visual: () => contingencyTable(),
    check: (value) => {
      const prop = normalizeProportion(value);
      return Number.isFinite(prop) && near(prop, 0.3, 0.01);
    },
    explanation:
      "Dentro de Sin Email: 18 compran de 60 totales. Proporción condicional = 18/60 = 0.30 = 30%.",
  },
  {
    id: "q11",
    topic: "Gráfico de torta / barras",
    type: "number",
    prompt:
      "El gráfico de torta muestra el reparto de gastos mensuales de 400 clientes. Si 'Streaming' representa 35%, ¿cuántos clientes corresponden a esa categoría?",
    visual: () => pieVisual(),
    check: (value) => near(value, 140),
    explanation: "Frecuencia absoluta = 0.35 × 400 = 140 clientes.",
  },
  {
    id: "q12",
    topic: "Histograma de densidad",
    type: "number",
    prompt:
      "En el histograma de densidad, ¿qué proporción cae en el intervalo [5, 15]? (proporción o porcentaje)",
    visual: () => densityHistogramVisual(),
    check: (value) => {
      const prop = normalizeProportion(value);
      return Number.isFinite(prop) && near(prop, 0.5, 0.01);
    },
    explanation:
      "La proporción es el área: base × altura. Para [5,15], base = 10 y altura = 0.05, entonces área = 0.50 (50%). Mirar solo la altura (0.05) es un error clásico.",
  },
  {
    id: "q13",
    topic: "Boxplot",
    type: "choice",
    prompt:
      "El histograma es asimétrico a la derecha (cola larga a la derecha). ¿Qué boxplot lo representa mejor?",
    visual: () => skewedHistogramWithLegend(),
    options: [boxplotOptionA(), boxplotOptionB(), boxplotOptionC(), boxplotOptionD()],
    correctIndex: 1,
    explanation:
      "En asimetría positiva, el bigote derecho suele ser más largo y la mediana tiende a quedar más cerca de Q1 que de Q3.",
    allowHtmlOptions: true,
  },
  {
    id: "q14",
    topic: "Boxplot y 5 números resumen",
    type: "multi-number",
    prompt:
      "A partir del boxplot, ingresá los 5 números resumen (mínimo, Q1, mediana, Q3, máximo).",
    visual: () => fullBoxplotVisual(10, 18, 22, 30, 46),
    fields: [
      { key: "min", label: "Mínimo" },
      { key: "q1", label: "Q1" },
      { key: "med", label: "Mediana" },
      { key: "q3", label: "Q3" },
      { key: "max", label: "Máximo" },
    ],
    check: (ans) =>
      near(ans.min, 10) && near(ans.q1, 18) && near(ans.med, 22) && near(ans.q3, 30) && near(ans.max, 46),
    explanation:
      "Los 5 números resumen son: mínimo 10, Q1 18, mediana 22, Q3 30 y máximo 46.",
  },
  {
    id: "q15",
    topic: "Correlación de Pearson (r)",
    type: "choice",
    prompt:
      "Según la nube de puntos, ¿qué valor de r describe mejor la fuerza y dirección de la relación lineal?",
    visual: () => scatterVisual(),
    options: [
      "r ≈ +0.85 (positiva fuerte)",
      "r ≈ -0.10 (casi nula)",
      "r ≈ -0.85 (negativa fuerte)",
      "r ≈ +0.30 (positiva débil)",
    ],
    correctIndex: 2,
    explanation:
      "La nube desciende con poca dispersión alrededor de una recta: relación lineal negativa y fuerte, consistente con r cercano a -1.",
  },
];

const form = document.getElementById("exam-form");
const questionsContainer = document.getElementById("questions-container");
const resultSummary = document.getElementById("result-summary");

renderExam();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  gradeExam();
});

function renderExam() {
  questionsContainer.innerHTML = "";

  questions.forEach((question, index) => {
    const card = document.createElement("article");
    card.className = "question-card";
    card.dataset.questionId = question.id;

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-slate-900">${index + 1}. ${question.prompt}</h2>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">${question.topic}</span>
      </div>
      <div class="question-visual mt-4"></div>
      <div class="question-input mt-4 space-y-2"></div>
      <div class="feedback hidden"></div>
    `;

    const visualSlot = card.querySelector(".question-visual");
    if (question.visual) {
      visualSlot.innerHTML = question.visual();
    }

    renderInput(question, card.querySelector(".question-input"));
    questionsContainer.appendChild(card);
  });
}

function renderInput(question, container) {
  container.innerHTML = "";

  if (question.type === "choice") {
    question.options.forEach((option, idx) => {
      const optionId = `${question.id}-opt-${idx}`;
      const label = document.createElement("label");
      label.className = "choice-option";
      label.setAttribute("for", optionId);

      const optionContent = question.allowHtmlOptions
        ? option
        : `<span class="text-sm text-slate-700">${escapeHtml(option)}</span>`;

      label.innerHTML = `
        <input id="${optionId}" type="radio" name="${question.id}" value="${idx}" class="mt-1" />
        <div class="flex-1">${optionContent}</div>
      `;

      container.appendChild(label);
    });
    return;
  }

  if (question.type === "multi-number") {
    question.fields.forEach((field) => {
      const fieldId = `${question.id}-${field.key}`;
      const row = document.createElement("div");
      row.className = "space-y-1";
      row.innerHTML = `
        <label for="${fieldId}" class="block text-sm font-medium text-slate-700">${field.label}</label>
        <input
          id="${fieldId}"
          name="${fieldId}"
          type="number"
          step="any"
          class="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      `;
      container.appendChild(row);
    });
    return;
  }

  const input = document.createElement("input");
  input.type = "number";
  input.step = "any";
  input.name = question.id;
  input.className = "w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";
  container.appendChild(input);
}

function gradeExam() {
  let correctCount = 0;

  questions.forEach((question) => {
    const card = questionsContainer.querySelector(`[data-question-id="${question.id}"]`);
    const feedback = card.querySelector(".feedback");

    clearPaint(card);

    const answer = readAnswer(question);
    const isCorrect = evaluate(question, answer);

    if (isCorrect) correctCount += 1;

    paintQuestion(card, question, answer, isCorrect);

    feedback.classList.remove("hidden", "ok", "bad");
    feedback.classList.add(isCorrect ? "ok" : "bad");
    feedback.innerHTML = `${isCorrect ? "✅ Correcta." : "❌ Incorrecta."} ${question.explanation}`;
  });

  const pct = Math.round((correctCount / questions.length) * 100);
  resultSummary.classList.remove("hidden");
  resultSummary.innerHTML = `
    <p class="font-semibold">Puntaje final: ${correctCount} / ${questions.length} (${pct}%)</p>
    <p class="mt-1">Verde = correcto, rojo = incorrecto. Revisá las explicaciones para estudiar cada error.</p>
  `;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearPaint(card) {
  card.querySelectorAll(".choice-option").forEach((el) => el.classList.remove("correct", "incorrect"));
  card.querySelectorAll("input").forEach((input) => {
    input.classList.remove("border-emerald-500", "bg-emerald-50", "border-rose-500", "bg-rose-50");
  });
}

function readAnswer(question) {
  if (question.type === "choice") {
    const selected = form.querySelector(`input[name="${question.id}"]:checked`);
    return selected ? Number(selected.value) : null;
  }

  if (question.type === "multi-number") {
    const answer = {};
    question.fields.forEach((field) => {
      const input = form.querySelector(`input[name="${question.id}-${field.key}"]`);
      const value = input.value.trim();
      answer[field.key] = value === "" ? null : Number(value);
    });
    return answer;
  }

  const input = form.querySelector(`input[name="${question.id}"]`);
  const raw = input.value.trim();
  return raw === "" ? null : Number(raw);
}

function evaluate(question, answer) {
  if (typeof question.check === "function") {
    return question.check(answer);
  }

  if (question.type === "choice") {
    return answer === question.correctIndex;
  }

  return false;
}

function paintQuestion(card, question, answer, isCorrect) {
  if (question.type === "choice") {
    const options = card.querySelectorAll(".choice-option");
    options.forEach((label, idx) => {
      if (idx === question.correctIndex) label.classList.add("correct");
      if (answer === idx && answer !== question.correctIndex) label.classList.add("incorrect");
    });
    return;
  }

  if (question.type === "multi-number") {
    question.fields.forEach((field) => {
      const input = card.querySelector(`input[name="${question.id}-${field.key}"]`);
      input.classList.add(
        isCorrect ? "border-emerald-500" : "border-rose-500",
        isCorrect ? "bg-emerald-50" : "bg-rose-50"
      );
    });
    return;
  }

  const input = card.querySelector(`input[name="${question.id}"]`);
  input.classList.add(isCorrect ? "border-emerald-500" : "border-rose-500", isCorrect ? "bg-emerald-50" : "bg-rose-50");
}

function near(value, target, tolerance = 0.001) {
  if (typeof value !== "number" || Number.isNaN(value)) return false;
  return Math.abs(value - target) <= tolerance;
}

function normalizeProportion(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return NaN;
  if (value > 1 && value <= 100) return value / 100;
  return value;
}

function contingencyTable() {
  return `
    <div class="chart-box">
      <table class="table-clean">
        <thead>
          <tr><th></th><th>Compra Sí</th><th>Compra No</th><th>Total fila</th></tr>
        </thead>
        <tbody>
          <tr><th>Email</th><td>36</td><td>24</td><td>60</td></tr>
          <tr><th>Sin Email</th><td>18</td><td>42</td><td>60</td></tr>
          <tr><th>Total columna</th><td>54</td><td>66</td><td>120</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

function pieVisual() {
  return `
    <div class="chart-box flex flex-wrap items-center gap-6">
      <div class="h-44 w-44 rounded-full border border-slate-300" style="background: conic-gradient(#2563eb 0deg 126deg, #14b8a6 126deg 216deg, #f59e0b 216deg 288deg, #e11d48 288deg 360deg);"></div>
      <ul class="text-sm text-slate-700 space-y-1">
        <li><span class="inline-block h-3 w-3 rounded-full bg-blue-600 mr-2"></span>Streaming: 35%</li>
        <li><span class="inline-block h-3 w-3 rounded-full bg-teal-500 mr-2"></span>Comida: 25%</li>
        <li><span class="inline-block h-3 w-3 rounded-full bg-amber-500 mr-2"></span>Transporte: 20%</li>
        <li><span class="inline-block h-3 w-3 rounded-full bg-rose-600 mr-2"></span>Otros: 20%</li>
      </ul>
    </div>
  `;
}

function densityHistogramVisual() {
  return `
    <div class="chart-box">
      <p class="mb-2 text-sm font-medium text-slate-700">Escala vertical: densidad</p>
      <svg viewBox="0 0 420 190" class="w-full max-w-xl">
        <line x1="40" y1="160" x2="390" y2="160" stroke="#475569" stroke-width="2" />
        <line x1="40" y1="20" x2="40" y2="160" stroke="#475569" stroke-width="2" />

        <rect x="40" y="120" width="80" height="40" fill="#60a5fa" opacity="0.85"></rect>
        <rect x="120" y="60" width="160" height="100" fill="#2563eb" opacity="0.85"></rect>
        <rect x="280" y="110" width="80" height="50" fill="#1d4ed8" opacity="0.85"></rect>

        <text x="62" y="176" font-size="12" fill="#334155">0</text>
        <text x="150" y="176" font-size="12" fill="#334155">5</text>
        <text x="230" y="176" font-size="12" fill="#334155">15</text>
        <text x="308" y="176" font-size="12" fill="#334155">20</text>
        <text x="364" y="176" font-size="12" fill="#334155">25</text>

        <text x="126" y="52" font-size="11" fill="#0f172a">altura = 0.05</text>
        <text x="47" y="114" font-size="11" fill="#0f172a">0.04</text>
        <text x="286" y="104" font-size="11" fill="#0f172a">0.025</text>
      </svg>
    </div>
  `;
}

function skewedHistogramWithLegend() {
  return `
    <div class="chart-box">
      <p class="mb-2 text-sm font-medium text-slate-700">Histograma asimétrico a la derecha</p>
      <svg viewBox="0 0 420 190" class="w-full max-w-xl">
        <line x1="40" y1="160" x2="390" y2="160" stroke="#475569" stroke-width="2" />
        <line x1="40" y1="20" x2="40" y2="160" stroke="#475569" stroke-width="2" />

        <rect x="50" y="55" width="45" height="105" fill="#0ea5e9" />
        <rect x="95" y="45" width="45" height="115" fill="#0284c7" />
        <rect x="140" y="65" width="45" height="95" fill="#0369a1" />
        <rect x="185" y="95" width="45" height="65" fill="#075985" />
        <rect x="230" y="115" width="45" height="45" fill="#0c4a6e" />
        <rect x="275" y="128" width="45" height="32" fill="#164e63" />
        <rect x="320" y="138" width="45" height="22" fill="#155e75" />
      </svg>
    </div>
  `;
}

function fullBoxplotVisual(min, q1, med, q3, max) {
  const left = 30;
  const width = 320;
  const scale = (v) => left + ((v - min) / (max - min)) * width;
  const minX = scale(min);
  const q1X = scale(q1);
  const medX = scale(med);
  const q3X = scale(q3);
  const maxX = scale(max);

  return `
    <div class="chart-box">
      <svg viewBox="0 0 420 120" class="w-full max-w-xl">
        <line x1="${minX}" y1="60" x2="${q1X}" y2="60" stroke="#0f766e" stroke-width="3" />
        <line x1="${q3X}" y1="60" x2="${maxX}" y2="60" stroke="#0f766e" stroke-width="3" />
        <rect x="${q1X}" y="38" width="${Math.max(4, q3X - q1X)}" height="44" fill="#2dd4bf" fill-opacity="0.4" stroke="#0f766e" stroke-width="2" />
        <line x1="${medX}" y1="38" x2="${medX}" y2="82" stroke="#0f766e" stroke-width="3" />
        <line x1="${minX}" y1="46" x2="${minX}" y2="74" stroke="#0f766e" stroke-width="3" />
        <line x1="${maxX}" y1="46" x2="${maxX}" y2="74" stroke="#0f766e" stroke-width="3" />
        <text x="${minX - 8}" y="98" font-size="11" fill="#334155">min</text>
        <text x="${q1X - 6}" y="98" font-size="11" fill="#334155">Q1</text>
        <text x="${medX - 10}" y="98" font-size="11" fill="#334155">Med</text>
        <text x="${q3X - 6}" y="98" font-size="11" fill="#334155">Q3</text>
        <text x="${maxX - 9}" y="98" font-size="11" fill="#334155">max</text>
      </svg>
    </div>
  `;
}

function scatterVisual() {
  const points = [
    [65, 45],
    [90, 58],
    [120, 72],
    [150, 90],
    [180, 105],
    [210, 123],
    [240, 136],
    [270, 150],
    [300, 162],
    [330, 176],
  ];

  const circles = points
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#4f46e5"></circle>`)
    .join("");

  return `
    <div class="chart-box">
      <svg viewBox="0 0 390 220" class="w-full max-w-xl">
        <line x1="45" y1="190" x2="360" y2="190" stroke="#475569" stroke-width="2" />
        <line x1="45" y1="25" x2="45" y2="190" stroke="#475569" stroke-width="2" />
        ${circles}
      </svg>
    </div>
  `;
}

function miniBoxplot(config) {
  const { min = 12, q1 = 40, med = 50, q3 = 70, max = 92 } = config;
  return `
    <svg class="boxplot-option" viewBox="0 0 180 30" role="img" aria-label="boxplot">
      <line x1="${min}" y1="15" x2="${q1}" y2="15" stroke="#0f766e" stroke-width="2"></line>
      <line x1="${q3}" y1="15" x2="${max}" y2="15" stroke="#0f766e" stroke-width="2"></line>
      <rect x="${q1}" y="8" width="${q3 - q1}" height="14" fill="#5eead4" stroke="#0f766e"></rect>
      <line x1="${med}" y1="8" x2="${med}" y2="22" stroke="#0f766e" stroke-width="2"></line>
      <line x1="${min}" y1="10" x2="${min}" y2="20" stroke="#0f766e" stroke-width="2"></line>
      <line x1="${max}" y1="10" x2="${max}" y2="20" stroke="#0f766e" stroke-width="2"></line>
    </svg>
  `;
}

function boxplotOptionA() {
  return `<div><div class="text-xs text-slate-600 mb-1">Opción A</div>${miniBoxplot({ min: 12, q1: 45, med: 63, q3: 82, max: 92 })}</div>`;
}

function boxplotOptionB() {
  return `<div><div class="text-xs text-slate-600 mb-1">Opción B</div>${miniBoxplot({ min: 24, q1: 42, med: 49, q3: 58, max: 96 })}</div>`;
}

function boxplotOptionC() {
  return `<div><div class="text-xs text-slate-600 mb-1">Opción C</div>${miniBoxplot({ min: 10, q1: 30, med: 52, q3: 76, max: 94 })}</div>`;
}

function boxplotOptionD() {
  return `<div><div class="text-xs text-slate-600 mb-1">Opción D</div>${miniBoxplot({ min: 8, q1: 26, med: 36, q3: 46, max: 62 })}</div>`;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
