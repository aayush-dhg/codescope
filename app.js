const topics = [
  {
    id: "variables",
    category: "BASICS",
    title: "Variables",
    description: "Watch a value get stored in a variable.",
    editable: true,
    realPython: true,
    guided: true,
    editorHint: "Edit the code, then click Run Python. Watch x change from its old value to its new value.",
    defaultCode: "x = 5\nx = x + 2\nprint(x)"
  },
  {
    id: "multiple-variables",
    category: "BASICS",
    title: "Multiple Variables",
    description: "See multiple values exist in program state at the same time.",
    editable: true,
    realPython: true,
    guided: true,
    editorHint: "Click Run Python to explore variables. Use expressions, reassign names, and print as often as you like.",
    defaultCode: 'name = "Maya"\nage = 24\nprint(name, age)'
  },
  {
    id: "arithmetic",
    category: "BASICS",
    title: "Arithmetic",
    description: "Follow operands through a calculation into a new variable.",
    editable: true,
    realPython: true,
    guided: true,
    editorHint: "Click Run Python, then watch each expression evaluate before its result is assigned.",
    defaultCode: "a = 8\nb = 3\ntotal = a + b\nprint(total)"
  },
  {
    id: "if-statement",
    category: "CONTROL FLOW",
    title: "If Statement",
    description: "Change a condition and see which branch runs.",
    editable: true,
    buildSteps: source => PythonLessons.build(source, "if-statement"),
    editorHint: "Try age = 15. Use if/else with ==, !=, <, >, <=, or >=. Indent each branch with spaces.",
    defaultCode: 'age = 20\nif age >= 18:\n    status = "Adult"\nelse:\n    status = "Minor"\nprint(status)'
  },
  {
    id: "for-loop",
    category: "CONTROL FLOW",
    title: "For Loop",
    description: "Watch each item enter the loop and update the program state.",
    editable: true,
    buildSteps: source => PythonLessons.build(source, "for-loop"),
    editorHint: "Edit the list or loop over range(1, 5). Use assignments, +=, and print(). Maximum 100 items and 300 steps.",
    defaultCode: "numbers = [2, 4, 6]\ntotal = 0\nfor number in numbers:\n    total += number\nprint(total)"
  },
  {
    id: "function",
    category: "FUNCTIONS",
    title: "Functions",
    description: "See arguments enter a local frame and a return value reach the caller.",
    editable: true,
    buildSteps: source => PythonLessons.build(source, "function"),
    editorHint: "Edit parameters, arguments, and the function body. Supports positional calls and return; recursion and default arguments are not supported.",
    defaultCode: "def add(a, b):\n    result = a + b\n    return result\n\nanswer = add(3, 4)\nprint(answer)"
  },
  {
    id: "playground",
    category: "EXPLORE",
    title: "Python Playground",
    description: "Run real Python, then explore its execution one step at a time.",
    editable: true,
    realPython: true,
    editorHint: "Click Run Python. The first run downloads Python; later runs can use your browser’s cache.",
    defaultCode: 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nnumbers = [3, 4, 5]\nresults = {n: factorial(n) for n in numbers}\nfor number, result in results.items():\n    print(f"{number}! = {result}")'
  }
];

let activeTopicIndex = 0;
let activeStepIndex = 0;
let currentSteps = [];
let playTimer = null;
const playground = new PythonPlayground();
let runGeneration = 0;
let pythonRunning = false;

const topicList = document.getElementById("topicList");
const lessonCategory = document.getElementById("lessonCategory");
const lessonTitle = document.getElementById("lessonTitle");
const lessonDescription = document.getElementById("lessonDescription");
const stepCounter = document.getElementById("stepCounter");
const lineNumbers = document.getElementById("lineNumbers");
const codeEditor = document.getElementById("codeEditor");
const executionLine = document.getElementById("executionLine");
const currentLineBadge = document.getElementById("currentLineBadge");
const explanationCard = document.getElementById("explanationCard");
const variablesView = document.getElementById("variablesView");
const objectViewBlock = document.getElementById("objectViewBlock");
const objectViewTitle = document.getElementById("objectViewTitle");
const objectView = document.getElementById("objectView");
const visualEventBadge = document.getElementById("visualEventBadge");
const executionView = document.getElementById("executionView");
const outputView = document.getElementById("outputView");
const editorMessage = document.getElementById("editorMessage");
const applyCodeButton = document.getElementById("applyCodeButton");
const resetCodeButton = document.getElementById("resetCodeButton");
const stopPythonButton = document.getElementById("stopPythonButton");
const playgroundOptions = document.getElementById("playgroundOptions");
const pythonInput = document.getElementById("pythonInput");
const restartButton = document.getElementById("restartButton");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");
const playButton = document.getElementById("playButton");
const speedSelect = document.getElementById("speedSelect");


function renderTopics() {
  topicList.innerHTML = "";

  topics.forEach((topic, index) => {
    const button = document.createElement("button");
    button.className = "topic-button" + (index === activeTopicIndex ? " active" : "");
    button.textContent = topic.title;

    button.addEventListener("click", () => {
      stopPlayback();
      activeTopicIndex = index;
      loadTopic();
    });

    topicList.appendChild(button);
  });
}

function updateLineNumbers() {
  const lineCount = Math.max(1, codeEditor.value.split("\n").length);

  lineNumbers.replaceChildren(...Array.from({ length: lineCount }, (_, index) => {
    const number = document.createElement("span");
    number.textContent = index + 1;
    return number;
  }));
}

function highlightExecutionLine(line, reveal = false) {
  const style = getComputedStyle(codeEditor);
  const height = parseFloat(style.lineHeight);
  const padding = parseFloat(style.paddingTop);
  const valid = Number.isInteger(line) && line >= 1 && line <= lineNumbers.children.length;
  executionLine.hidden = !valid;
  for (const number of lineNumbers.children) {
    number.classList.toggle("is-current", valid && Number(number.textContent) === line);
  }
  if (!valid) return;
  const top = padding + (line - 1) * height;
  if (reveal && (top < codeEditor.scrollTop || top + height > codeEditor.scrollTop + codeEditor.clientHeight)) {
    codeEditor.scrollTop = Math.max(0, top - codeEditor.clientHeight / 2);
  }
  lineNumbers.scrollTop = codeEditor.scrollTop;
  executionLine.style.top = `${top - codeEditor.scrollTop}px`;
  executionLine.style.height = `${height}px`;
}

function renderVariables(variables) {
  const entries = Object.entries(variables || {});

  variablesView.replaceChildren();

  if (!entries.length) {
    const emptyMessage = document.createElement("span");
    emptyMessage.textContent = "No variables yet.";
    variablesView.appendChild(emptyMessage);
    return;
  }

  entries.forEach(([name, value]) => {
    const card = document.createElement("div");
    card.className = "variable-card";

    const nameElement = document.createElement("div");
    nameElement.className = "variable-name";
    nameElement.textContent = name;

    const valueElement = document.createElement("div");
    valueElement.className = "variable-value";
    valueElement.textContent = value;

    card.append(nameElement, valueElement);
    variablesView.appendChild(card);
  });
}

function createValueObject(visual, extraClass = "") {
  const valueObject = document.createElement("div");
  valueObject.className = `memory-object ${visual.valueType} ${extraClass}`.trim();

  const value = document.createElement("span");
  value.className = "memory-object-value";
  value.textContent = visual.value;

  const type = document.createElement("span");
  type.className = "memory-object-type";
  type.textContent = visual.typeName || visual.valueType;

  valueObject.append(value, type);
  return valueObject;
}

function renderVariableChanges(visual) {
  const updates = (visual.changes || []).filter(change =>
    change.kind === "updated" && change.from && change.to
  );

  if (!updates.length) return;

  const changes = document.createElement("div");
  changes.className = "variable-changes";

  updates.forEach(change => {
    const transition = document.createElement("div");
    transition.className = "variable-change";

    const name = document.createElement("span");
    name.className = "variable-change-name";
    name.textContent = change.name;

    const oldValue = createValueObject(change.from, "previous-value");

    const arrow = document.createElement("span");
    arrow.className = "change-arrow";
    arrow.textContent = "→";
    arrow.setAttribute("aria-label", "changes to");

    const newValue = createValueObject(change.to, "updated-value");

    transition.append(name, oldValue, arrow, newValue);
    changes.appendChild(transition);
  });

  objectView.appendChild(changes);
}

function renderLessonVisual(visual) {
  objectViewBlock.hidden = false;
  objectViewTitle.textContent = visual.title;
  visualEventBadge.textContent = visual.event.replaceAll("_", " ");

  const flow = document.createElement("div");
  flow.className = "lesson-flow";
  visual.flow.forEach((text, index) => {
    const token = document.createElement("span");
    token.className = "lesson-flow-token" + (text === "→" ? " is-arrow" : "");
    token.style.setProperty("--flow-index", index);
    token.textContent = text;
    flow.appendChild(token);
  });
  objectView.appendChild(flow);

  renderVariableChanges(visual);

  visual.scopes.forEach(scope => {
    const frame = document.createElement("section");
    frame.className = "lesson-frame";
    const heading = document.createElement("h5");
    heading.textContent = scope.name;
    frame.appendChild(heading);
    const memory = document.createElement("div");
    memory.className = "memory-map";
    scope.objects.forEach(object => {
      const row = document.createElement("div");
      const isCurrentScope = scope === visual.scopes.at(-1);
      const active = isCurrentScope && visual.activeNames.includes(object.name);
      row.className = "memory-diagram" + (active ? visual.printedValues ? " is-read" : "" : " is-settled");
      const name = document.createElement("div");
      name.className = "variable-node";
      name.textContent = object.name;
      const arrow = document.createElement("div");
      arrow.className = "reference-arrow";
      arrow.setAttribute("aria-hidden", "true");
      row.append(name, arrow, createValueObject(object));
      memory.appendChild(row);
    });
    if (!scope.objects.length) {
      const empty = document.createElement("p");
      empty.className = "object-view-caption";
      empty.textContent = "No variables in this frame yet.";
      memory.appendChild(empty);
    }
    frame.appendChild(memory);
    objectView.appendChild(frame);
  });
  if (visual.printedValues) {
    const journey = document.createElement("div");
    journey.className = "print-journey";
    const values = document.createElement("div");
    values.className = "travelling-values";
    values.setAttribute("aria-hidden", "true");
    visual.printedValues.forEach(value => values.appendChild(createValueObject(value, "travelling-value")));
    const path = document.createElement("div");
    path.className = "journey-line";
    path.setAttribute("aria-hidden", "true");
    const target = document.createElement("div");
    target.className = "print-target";
    target.textContent = "print()";
    journey.append(values, path, target);
    objectView.appendChild(journey);
  }
  const caption = document.createElement("p");
  caption.className = "object-view-caption";
  caption.textContent = visual.detail;
  objectView.appendChild(caption);
}

function renderObjectView(visual) {
  objectView.replaceChildren();
  objectViewBlock.hidden = !visual;
  if (visual) renderLessonVisual(visual);
}

function renderStep() {
  const topic = topics[activeTopicIndex];
  const step = currentSteps[activeStepIndex];
  highlightExecutionLine(step?.line, true);

  lessonCategory.textContent = topic.category;
  lessonTitle.textContent = topic.title;
  lessonDescription.textContent = topic.description;

  if (!step) {
    stepCounter.textContent = "No execution";
    currentLineBadge.textContent = "—";
    explanationCard.textContent = pythonRunning ? "Python is running in the background. Stop execution to cancel." : topic.realPython ? "Run Python to generate an execution timeline." : "Apply valid code to generate execution steps.";
    variablesView.innerHTML = "<span>No variables yet.</span>";
    renderObjectView(null);
    executionView.textContent = pythonRunning ? "Waiting for Python results…" : topic.realPython ? "Ready to run Python." : "Waiting for valid code.";
    outputView.textContent = "No output yet.";
    previousButton.disabled = true;
    nextButton.disabled = true;
    playButton.disabled = true;
    return;
  }

  stepCounter.textContent = `Step ${activeStepIndex + 1} of ${currentSteps.length}`;
  currentLineBadge.textContent = `Line ${step.line}`;
  explanationCard.textContent = step.explanation;
  executionView.textContent = step.execution;
  outputView.textContent = step.hasOutput || step.output ? step.output : "No output yet.";

  renderVariables(step.variables);
  renderObjectView(step.visual);

  previousButton.disabled = activeStepIndex === 0;
  nextButton.disabled = activeStepIndex === currentSteps.length - 1;
  playButton.disabled = false;
}

function setEditorMessage(message, type = "") {
  editorMessage.className = "editor-message";

  if (type) {
    editorMessage.classList.add(type);
  }

  editorMessage.textContent = message;
}

function loadTopic() {
  cancelPython();
  const topic = topics[activeTopicIndex];

  codeEditor.value = topic.defaultCode;
  codeEditor.scrollTop = 0;
  codeEditor.scrollLeft = 0;
  pythonInput.value = "";
  codeEditor.readOnly = !topic.editable;
  applyCodeButton.disabled = !topic.editable;
  applyCodeButton.textContent = topic.realPython ? "Run Python" : "Apply changes";
  stopPythonButton.hidden = !topic.realPython;
  playgroundOptions.hidden = !topic.realPython;

  updateLineNumbers();

  if (topic.realPython) {
    currentSteps = [];
    setEditorMessage(topic.editorHint);
  } else if (topic.editable) {
    try {
      currentSteps = topic.buildSteps(topic.defaultCode);
      setEditorMessage(topic.editorHint);
    } catch {
      currentSteps = [];
    }
  } else {
    currentSteps = topic.steps;
    setEditorMessage("This topic is read-only for now. Editable support will be added later.");
  }

  activeStepIndex = 0;

  renderTopics();
  renderStep();
}

function applyCode() {
  const topic = topics[activeTopicIndex];

  if (!topic.editable) return;
  if (topic.realPython) { runPython(); return; }

  stopPlayback();

  try {
    currentSteps = topic.buildSteps(codeEditor.value);
    activeStepIndex = 0;
    setEditorMessage("Changes applied. Step through the updated execution.", "success");
    renderStep();
  } catch (error) {
    currentSteps = [];
    activeStepIndex = 0;
    setEditorMessage(error.message, "error");
    renderStep();
  }
}

function cancelPython() {
  runGeneration++;
  playground.stop();
  pythonRunning = false;
  stopPythonButton.disabled = true;
  applyCodeButton.disabled = false;
}

async function runPython() {
  cancelPython();
  stopPlayback();
  const generation = runGeneration;
  const topic = topics[activeTopicIndex];
  pythonRunning = true;
  currentSteps = [];
  activeStepIndex = 0;
  applyCodeButton.disabled = true;
  stopPythonButton.disabled = false;
  setEditorMessage("Loading Python… The first run may take a moment.");
  renderStep();
  const result = await playground.run(codeEditor.value, pythonInput.value, message => {
    if (generation === runGeneration) setEditorMessage(message);
  }, { guided: Boolean(topic.guided) });
  if (generation !== runGeneration) return;
  pythonRunning = false;
  stopPythonButton.disabled = true;
  applyCodeButton.disabled = false;
  currentSteps = result.steps || [];
  activeStepIndex = topic.guided && !result.error ? 0 : Math.max(0, currentSteps.length - 1);
  setEditorMessage(result.error || (topic.guided ? "Ready. Use Next or Play to see assignments and printed values step by step." : "Finished. Press Play to replay the timeline, or use Previous and Next to inspect each step."), result.error ? "error" : "success");
  renderStep();
}

stopPythonButton.addEventListener("click", () => {
  cancelPython();
  setEditorMessage("Execution stopped. Edit your code or click Run Python to try again.");
  renderStep();
});
pythonInput.addEventListener("input", invalidateExecution);

function nextStep() {
  if (activeStepIndex < currentSteps.length - 1) {
    activeStepIndex += 1;
    renderStep();
  } else {
    stopPlayback();
  }
}

function previousStep() {
  if (activeStepIndex > 0) {
    activeStepIndex -= 1;
    renderStep();
  }
}

function restart() {
  stopPlayback();
  activeStepIndex = 0;
  renderStep();
}

function startPlayback() {
  if (playTimer) {
    stopPlayback();
    return;
  }

  if (!currentSteps.length) return;
  if (activeStepIndex === currentSteps.length - 1) {
    activeStepIndex = 0;
    renderStep();
  }

  playButton.textContent = "❚❚ Pause";
  const delay = Number(speedSelect.value);

  playTimer = setInterval(() => {
    if (activeStepIndex >= currentSteps.length - 1) {
      stopPlayback();
      return;
    }

    activeStepIndex += 1;
    renderStep();
  }, delay);
}

function stopPlayback() {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }

  playButton.textContent = "▶ Play";
}

function invalidateExecution() {
  cancelPython();
  stopPlayback();
  currentSteps = [];
  activeStepIndex = 0;
  setEditorMessage(topics[activeTopicIndex].realPython ? "Code or input changed. Click Run Python to execute." : "You have unapplied changes. Click Apply changes to run this code.");
  renderStep();
}

codeEditor.addEventListener("input", () => {
  updateLineNumbers();

  const topic = topics[activeTopicIndex];

  if (topic.editable) {
    invalidateExecution();
  }
});

codeEditor.addEventListener("scroll", () => {
  lineNumbers.scrollTop = codeEditor.scrollTop;
  highlightExecutionLine(currentSteps[activeStepIndex]?.line);
});

window.addEventListener("resize", () => highlightExecutionLine(currentSteps[activeStepIndex]?.line));

codeEditor.addEventListener("keydown", event => {
  if (codeEditor.readOnly) return;

  if (event.key === "Tab") {
    event.preventDefault();

    const start = codeEditor.selectionStart;
    const end = codeEditor.selectionEnd;

    codeEditor.value =
      codeEditor.value.substring(0, start) +
      "    " +
      codeEditor.value.substring(end);

    codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;

    updateLineNumbers();
    invalidateExecution();
  }
});

applyCodeButton.addEventListener("click", applyCode);

resetCodeButton.addEventListener("click", () => {
  stopPlayback();
  loadTopic();
});

restartButton.addEventListener("click", restart);
previousButton.addEventListener("click", previousStep);
nextButton.addEventListener("click", nextStep);
playButton.addEventListener("click", startPlayback);

speedSelect.addEventListener("change", () => {
  if (playTimer) {
    stopPlayback();
    startPlayback();
  }
});

loadTopic();
