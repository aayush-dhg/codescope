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
    description: "Follow an expression as Python calculates a new value.",
    editable: false,
    defaultCode: "a = 8\nb = 3\ntotal = a + b\nprint(total)",
    steps: [
      { line: 1, explanation: "a is created with the value 8.", variables: { a: "8" }, execution: "a ← 8", output: "" },
      { line: 2, explanation: "b is created with the value 3.", variables: { a: "8", b: "3" }, execution: "b ← 3", output: "" },
      { line: 3, explanation: "Python reads a and b, adds them, then stores the result in total.", variables: { a: "8", b: "3", total: "11" }, execution: "8 + 3 → 11\ntotal ← 11", output: "" },
      { line: 4, explanation: "The value of total is printed.", variables: { a: "8", b: "3", total: "11" }, execution: "print(11)", output: "11" }
    ]
  },
  {
    id: "if-statement",
    category: "CONTROL FLOW",
    title: "If Statement",
    description: "See a condition evaluated before a block runs.",
    editable: false,
    defaultCode: 'age = 20\nif age >= 18:\n    status = "Adult"\nprint(status)',
    steps: [
      { line: 1, explanation: "age is set to 20.", variables: { age: "20" }, execution: "age ← 20", output: "" },
      { line: 2, explanation: "Python checks whether age is greater than or equal to 18. The condition is True.", variables: { age: "20" }, execution: "20 >= 18 → True", output: "" },
      { line: 3, explanation: "Because the condition was True, the indented block runs and status is created.", variables: { age: "20", status: '"Adult"' }, execution: 'Condition passed\nstatus ← "Adult"', output: "" },
      { line: 4, explanation: "The status value is printed.", variables: { age: "20", status: '"Adult"' }, execution: 'print("Adult")', output: "Adult" }
    ]
  },
  {
    id: "for-loop",
    category: "CONTROL FLOW",
    title: "For Loop",
    description: "Watch the loop variable change on each iteration.",
    editable: false,
    defaultCode: "numbers = [2, 4, 6]\ntotal = 0\nfor number in numbers:\n    total += number\nprint(total)",
    steps: [
      { line: 1, explanation: "A list containing three numbers is created.", variables: { numbers: "[2, 4, 6]" }, execution: "Create list", output: "" },
      { line: 2, explanation: "total starts at 0.", variables: { numbers: "[2, 4, 6]", total: "0" }, execution: "total ← 0", output: "" },
      { line: 3, explanation: "The loop begins. number takes the first value: 2.", variables: { numbers: "[2, 4, 6]", total: "0", number: "2" }, execution: "Iteration 1\nnumber ← 2", output: "" },
      { line: 4, explanation: "2 is added to total. total changes from 0 to 2.", variables: { numbers: "[2, 4, 6]", total: "2", number: "2" }, execution: "0 + 2 → 2", output: "" },
      { line: 3, explanation: "The loop continues. number now becomes 4.", variables: { numbers: "[2, 4, 6]", total: "2", number: "4" }, execution: "Iteration 2\nnumber ← 4", output: "" },
      { line: 4, explanation: "4 is added to total. total changes from 2 to 6.", variables: { numbers: "[2, 4, 6]", total: "6", number: "4" }, execution: "2 + 4 → 6", output: "" },
      { line: 3, explanation: "The third iteration begins. number becomes 6.", variables: { numbers: "[2, 4, 6]", total: "6", number: "6" }, execution: "Iteration 3\nnumber ← 6", output: "" },
      { line: 4, explanation: "6 is added to total. total changes from 6 to 12.", variables: { numbers: "[2, 4, 6]", total: "12", number: "6" }, execution: "6 + 6 → 12", output: "" },
      { line: 5, explanation: "The loop is finished, so Python prints the final total.", variables: { numbers: "[2, 4, 6]", total: "12", number: "6" }, execution: "Loop complete\nprint(12)", output: "12" }
    ]
  },
  {
    id: "function",
    category: "FUNCTIONS",
    title: "Functions",
    description: "Follow parameters, local variables, and a return value.",
    editable: false,
    defaultCode: "def add(a, b):\n    result = a + b\n    return result\n\nanswer = add(3, 4)\nprint(answer)",
    steps: [
      { line: 1, explanation: "Python defines add(). The function is stored, but its body does not run yet.", variables: { add: "<function>" }, execution: "Define function add(a, b)", output: "" },
      { line: 5, explanation: "add(3, 4) is called. The arguments become local parameters a = 3 and b = 4.", variables: { add: "<function>", a: "3", b: "4" }, execution: "Call add(3, 4)\nCreate function frame", output: "" },
      { line: 2, explanation: "Inside the function, a + b is calculated and stored in result.", variables: { add: "<function>", a: "3", b: "4", result: "7" }, execution: "3 + 4 → 7\nresult ← 7", output: "" },
      { line: 3, explanation: "The function returns 7 to the line that called it.", variables: { add: "<function>", result: "7" }, execution: "return 7\nClose function frame", output: "" },
      { line: 5, explanation: "The returned value 7 is stored in answer.", variables: { add: "<function>", answer: "7" }, execution: "answer ← 7", output: "" },
      { line: 6, explanation: "answer is printed.", variables: { add: "<function>", answer: "7" }, execution: "print(7)", output: "7" }
    ]
  }
];

let activeTopicIndex = 0;
let activeStepIndex = 0;
let currentSteps = [];
let playTimer = null;

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
  type.textContent = visual.valueType;

  valueObject.append(value, type);
  return valueObject;
}

function renderObjectView(visual) {
  objectView.replaceChildren();

  if (!visual) {
    objectViewBlock.hidden = true;
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
    ? `${activeObject.name} now refers to a ${activeObject.valueType} object; the earlier variable remains in memory.`
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
    relationship.textContent = names.length > 1
      ? `Python reads ${names.join(" and ")}; both values move to print().`
      : `Python reads ${names[0]}; its value moves to print().`;
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
    explanationCard.textContent = "Apply valid code to generate execution steps.";
    variablesView.innerHTML = "<span>No variables yet.</span>";
    renderObjectView(null);
    executionView.textContent = "Waiting for valid code.";
    outputView.textContent = "No output yet.";
    previousButton.disabled = true;
    nextButton.disabled = true;
    playButton.disabled = true;
    return;
  }

  stepCounter.textContent = `Step ${activeStepIndex + 1} of ${currentSteps.length}`;
  currentLineBadge.textContent = `Line ${step.line}`;
  explanationCard.textContent = step.explanation;
  executionView.innerHTML = step.execution.replaceAll("\n", "<br>");
  outputView.textContent = step.output || "No output yet.";

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
  const topic = topics[activeTopicIndex];

  codeEditor.value = topic.defaultCode;
  codeEditor.readOnly = !topic.editable;
  applyCodeButton.disabled = !topic.editable;

  updateLineNumbers();

  if (topic.editable) {
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

codeEditor.addEventListener("input", () => {
  updateLineNumbers();

  const topic = topics[activeTopicIndex];

  if (topic.editable) {
    setEditorMessage("You have unapplied changes.");
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
    setEditorMessage("You have unapplied changes.");
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
