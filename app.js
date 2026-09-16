const topics = [
  {
    id: "variables",
    category: "BASICS",
    title: "Variables",
    description: "Watch a value get stored in a variable.",
    editable: true,
    buildSteps: buildVariableSteps,
    editorHint: "Try changing the variable name or value, then click Apply changes.",
    defaultCode: "x = 5\nprint(x)",
    steps: []
  },
  {
    id: "multiple-variables",
    category: "BASICS",
    title: "Multiple Variables",
    description: "See multiple values exist in program state at the same time.",
    editable: true,
    buildSteps: buildMultipleVariableSteps,
    editorHint: "Try changing the variable names or values, then click Apply changes.",
    defaultCode: 'name = "Maya"\nage = 24\nprint(name, age)',
    steps: []
  },
  {
    id: "arithmetic",
    category: "BASICS",
    title: "Arithmetic",
    description: "Follow operands through a calculation into a new variable.",
    editable: true,
    buildSteps: source => PythonLessons.build(source, "arithmetic"),
    editorHint: "Edit numbers and expressions using +, -, *, /, //, %, and parentheses. Finish with print(...).",
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

function parseLiteral(rawValue) {
  const value = rawValue.trim();

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  if (value === "True") return true;
  if (value === "False") return false;

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  throw new Error("For now, editable lessons support numbers, booleans, and strings.");
}

function displayValue(value) {
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
}

function getValueType(value) {
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "string";
}

function outputValue(value) {
  if (typeof value === "boolean") return displayValue(value);
  return String(value);
}

function displayVariables(variableValues) {
  return Object.fromEntries(
    Object.entries(variableValues).map(([name, value]) => [name, displayValue(value)])
  );
}

function buildVisualObjects(variableValues) {
  return Object.entries(variableValues).map(([name, value]) => ({
    name,
    value: displayValue(value),
    valueType: getValueType(value)
  }));
}

function formatNameList(names) {
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

function buildVariableSteps(sourceCode) {
  const lines = sourceCode
    .replace(/\r/g, "")
    .split("\n")
    .filter(line => line.trim() !== "");

  if (lines.length !== 2) {
    throw new Error("Use exactly two lines: an assignment, then print(variable).");
  }

  const assignmentMatch = lines[0].match(/^\s*([A-Za-z_]\w*)\s*=\s*(.+)\s*$/);

  if (!assignmentMatch) {
    throw new Error("Line 1 should look like: x = 5");
  }

  const variableName = assignmentMatch[1];
  const variableValue = parseLiteral(assignmentMatch[2]);

  const printMatch = lines[1].match(/^\s*print\(\s*([A-Za-z_]\w*)\s*\)\s*$/);

  if (!printMatch) {
    throw new Error(`Line 2 should look like: print(${variableName})`);
  }

  if (printMatch[1] !== variableName) {
    throw new Error(`You created ${variableName}, so print(${variableName}) to display it.`);
  }

  return [
    {
      line: 1,
      explanation: `Python creates the variable ${variableName} and stores ${displayValue(variableValue)}.`,
      variables: {
        [variableName]: displayValue(variableValue)
      },
      execution: `${variableName} ← ${displayValue(variableValue)}`,
      output: "",
      visual: {
        event: "variable_created",
        name: variableName,
        value: displayValue(variableValue),
        valueType: getValueType(variableValue)
      }
    },
    {
      line: 2,
      explanation: `print(${variableName}) reads the current value of ${variableName} and sends it to the console.`,
      variables: {
        [variableName]: displayValue(variableValue)
      },
      execution: `Read ${variableName}\nCall print()`,
      output: outputValue(variableValue),
      visual: {
        event: "variable_read",
        name: variableName,
        value: displayValue(variableValue),
        valueType: getValueType(variableValue),
        target: "print"
      }
    }
  ];
}

function buildMultipleVariableSteps(sourceCode) {
  const sourceLines = sourceCode
    .replace(/\r/g, "")
    .split("\n")
    .map((text, index) => ({ text, lineNumber: index + 1 }))
    .filter(({ text }) => text.trim() !== "");

  if (sourceLines.length < 3 || sourceLines.length > 7) {
    throw new Error("Use 2 to 6 assignment lines followed by one print(...) line.");
  }

  const assignmentLines = sourceLines.slice(0, -1);
  const printLine = sourceLines.at(-1);
  const variableValues = Object.create(null);
  const steps = [];

  assignmentLines.forEach(({ text, lineNumber }) => {
    const assignmentMatch = text.match(/^\s*([A-Za-z_]\w*)\s*=\s*(.+)\s*$/);

    if (!assignmentMatch) {
      throw new Error(`Line ${lineNumber} should look like: name = "Maya"`);
    }

    const variableName = assignmentMatch[1];

    if (Object.hasOwn(variableValues, variableName)) {
      throw new Error(`${variableName} is assigned more than once. Use a unique name for each variable.`);
    }

    const variableValue = parseLiteral(assignmentMatch[2]);
    variableValues[variableName] = variableValue;

    steps.push({
      line: lineNumber,
      explanation: `Python creates ${variableName} and stores ${displayValue(variableValue)}.`,
      variables: displayVariables(variableValues),
      execution: `${variableName} ← ${displayValue(variableValue)}`,
      output: "",
      visual: {
        event: "variable_created",
        objects: buildVisualObjects(variableValues),
        activeNames: [variableName]
      }
    });
  });

  const printMatch = printLine.text.match(/^\s*print\(\s*([^)]*?)\s*\)\s*$/);

  if (!printMatch) {
    throw new Error(`Line ${printLine.lineNumber} should look like: print(name, age)`);
  }

  const printedNames = printMatch[1]
    .split(",")
    .map(name => name.trim())
    .filter(Boolean);

  if (
    printedNames.length < 2 ||
    printedNames.some(name => !/^[A-Za-z_]\w*$/.test(name))
  ) {
    throw new Error("print(...) should contain at least two variable names separated by commas.");
  }

  if (new Set(printedNames).size < 2) {
    throw new Error("Print at least two different variables in this lesson.");
  }

  const undefinedName = printedNames.find(name => !Object.hasOwn(variableValues, name));

  if (undefinedName) {
    throw new Error(`${undefinedName} has not been created yet.`);
  }

  steps.push({
    line: printLine.lineNumber,
    explanation: `Python reads ${formatNameList(printedNames)} and sends their values to the console.`,
    variables: displayVariables(variableValues),
    execution: `${printedNames.map(name => `Read ${name}`).join("\n")}\nCall print()`,
    output: printedNames.map(name => outputValue(variableValues[name])).join(" "),
    visual: {
      event: "variables_read",
      objects: buildVisualObjects(variableValues),
      activeNames: printedNames,
      target: "print"
    }
  });

  return steps;
}

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

  lineNumbers.textContent = Array.from(
    { length: lineCount },
    (_, index) => index + 1
  ).join("\n");
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
      row.className = "memory-diagram" + (active ? "" : " is-settled");
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
  const caption = document.createElement("p");
  caption.className = "object-view-caption";
  caption.textContent = visual.detail;
  objectView.appendChild(caption);
}

function renderObjectView(visual) {
  objectView.replaceChildren();

  if (!visual) {
    objectViewBlock.hidden = true;
    return;
  }

  if (visual.lesson) {
    renderLessonVisual(visual);
    return;
  }

  const objects = visual.objects || [
    {
      name: visual.name,
      value: visual.value,
      valueType: visual.valueType
    }
  ];
  const orderedActiveNames = visual.activeNames || objects.map(object => object.name);
  const activeNames = new Set(orderedActiveNames);
  const isReadEvent = visual.event.includes("read");

  objectViewBlock.hidden = false;
  objectViewTitle.textContent = objects.length > 1 ? "Variables in memory" : "Variable in memory";
  visualEventBadge.textContent = isReadEvent
    ? objects.length > 1 ? "Values read" : "Value read"
    : "Object created";

  const memoryMap = document.createElement("div");
  memoryMap.className = "memory-map";

  objects.forEach(object => {
    const memoryDiagram = document.createElement("div");
    const isActive = activeNames.has(object.name);
    memoryDiagram.className = `memory-diagram${isActive ? "" : " is-settled"}${isReadEvent && isActive ? " is-read" : ""}`;

    const variableNode = document.createElement("div");
    variableNode.className = "variable-node";
    variableNode.textContent = object.name;

    const referenceArrow = document.createElement("div");
    referenceArrow.className = "reference-arrow";
    referenceArrow.setAttribute("aria-hidden", "true");

    const valueObject = createValueObject(object);
    memoryDiagram.append(variableNode, referenceArrow, valueObject);
    memoryMap.appendChild(memoryDiagram);
  });

  objectView.appendChild(memoryMap);

  const relationship = document.createElement("p");
  relationship.className = "object-view-caption";
  const activeObjects = orderedActiveNames
    .map(name => objects.find(object => object.name === name))
    .filter(Boolean);
  const activeObject = activeObjects[0];
  relationship.textContent = objects.length > 1
    ? `${activeObject.name} is created now. Earlier variables stay visible because they still exist in memory.`
    : `${activeObject.name} refers to this ${activeObject.valueType} object in memory.`;
  objectView.appendChild(relationship);

  if (isReadEvent) {
    const printJourney = document.createElement("div");
    printJourney.className = "print-journey";

    const travellingValues = document.createElement("div");
    travellingValues.className = "travelling-values";
    travellingValues.setAttribute("aria-hidden", "true");

    activeObjects.forEach(object => {
      travellingValues.appendChild(createValueObject(object, "travelling-value"));
    });

    const journeyLine = document.createElement("div");
    journeyLine.className = "journey-line";
    journeyLine.setAttribute("aria-hidden", "true");

    const printTarget = document.createElement("div");
    printTarget.className = "print-target";
    printTarget.textContent = "print()";

    printJourney.append(travellingValues, journeyLine, printTarget);
    objectView.appendChild(printJourney);
    const names = activeObjects.map(object => object.name);
    if (names.length === 1) {
      relationship.textContent = `Python reads ${names[0]}; its value moves to print().`;
    } else {
      const valueCount = names.length === 2 ? "Both values" : `All ${names.length} values`;
      relationship.textContent = `Python reads ${formatNameList(names)}. ${valueCount} move to print().`;
    }
  }
}

function renderStep() {
  const topic = topics[activeTopicIndex];
  const step = currentSteps[activeStepIndex];

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
  pythonRunning = true;
  currentSteps = [];
  activeStepIndex = 0;
  applyCodeButton.disabled = true;
  stopPythonButton.disabled = false;
  setEditorMessage("Loading Python… The first run may take a moment.");
  renderStep();
  const result = await playground.run(codeEditor.value, pythonInput.value, message => {
    if (generation === runGeneration) setEditorMessage(message);
  });
  if (generation !== runGeneration) return;
  pythonRunning = false;
  stopPythonButton.disabled = true;
  applyCodeButton.disabled = false;
  currentSteps = result.steps || [];
  activeStepIndex = Math.max(0, currentSteps.length - 1);
  setEditorMessage(result.error || "Finished. Press Play to replay the timeline, or use Previous and Next to inspect each step.", result.error ? "error" : "success");
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
});

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
