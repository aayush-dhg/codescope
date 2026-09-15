const topics = [
  {
    id: "variables",
    category: "BASICS",
    title: "Variables",
    description: "Watch a value get stored in a variable.",
    code: ["x = 5", "print(x)"],
    steps: [
      { line: 1, explanation: "Python creates the variable x and stores the value 5.", variables: { x: "5" }, execution: "Assignment\nx ← 5", output: "" },
      { line: 2, explanation: "print(x) reads the current value of x and sends it to the console.", variables: { x: "5" }, execution: "Read x\nSend 5 to print()", output: "5" }
    ]
  },
  {
    id: "multiple-variables",
    category: "BASICS",
    title: "Multiple Variables",
    description: "See multiple values exist in program state at the same time.",
    code: ["name = \"Maya\"", "age = 24", "print(name, age)"],
    steps: [
      { line: 1, explanation: "The string \"Maya\" is stored in name.", variables: { name: "\"Maya\"" }, execution: "Assignment\nname ← \"Maya\"", output: "" },
      { line: 2, explanation: "A second variable, age, is created with the integer 24.", variables: { name: "\"Maya\"", age: "24" }, execution: "Assignment\nage ← 24", output: "" },
      { line: 3, explanation: "Python reads both variables and prints them.", variables: { name: "\"Maya\"", age: "24" }, execution: "Read name\nRead age\nCall print()", output: "Maya 24" }
    ]
  },
  {
    id: "arithmetic",
    category: "BASICS",
    title: "Arithmetic",
    description: "Follow an expression as Python calculates a new value.",
    code: ["a = 8", "b = 3", "total = a + b", "print(total)"],
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
    code: ["age = 20", "if age >= 18:", "    status = \"Adult\"", "print(status)"],
    steps: [
      { line: 1, explanation: "age is set to 20.", variables: { age: "20" }, execution: "age ← 20", output: "" },
      { line: 2, explanation: "Python checks whether age is greater than or equal to 18. The condition is True.", variables: { age: "20" }, execution: "20 >= 18 → True", output: "" },
      { line: 3, explanation: "Because the condition was True, the indented block runs and status is created.", variables: { age: "20", status: "\"Adult\"" }, execution: "Condition passed\nstatus ← \"Adult\"", output: "" },
      { line: 4, explanation: "The status value is printed.", variables: { age: "20", status: "\"Adult\"" }, execution: "print(\"Adult\")", output: "Adult" }
    ]
  },
  {
    id: "for-loop",
    category: "CONTROL FLOW",
    title: "For Loop",
    description: "Watch the loop variable change on each iteration.",
    code: ["numbers = [2, 4, 6]", "total = 0", "for number in numbers:", "    total += number", "print(total)"],
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
    code: ["def add(a, b):", "    result = a + b", "    return result", "", "answer = add(3, 4)", "print(answer)"],
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
const executionView = document.getElementById("executionView");
const outputView = document.getElementById("outputView");
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
      activeStepIndex = 0;
      renderAll();
    });
    topicList.appendChild(button);
  });
}

function renderCode(topic, step) {
  lineNumbers.innerHTML = topic.code.map((_, index) => index + 1).join("<br>");
  codeEditor.innerHTML = topic.code
    .map((line, index) => {
      const isActive = index + 1 === step.line;
      const safeLine = line
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
      return `<span class="code-line ${isActive ? "active" : ""}">${safeLine || " "}</span>`;
    })
    .join("");
}

function renderVariables(variables) {
  const entries = Object.entries(variables || {});
  if (!entries.length) {
    variablesView.innerHTML = "<span>No variables yet.</span>";
    return;
  }
  variablesView.innerHTML = entries
    .map(([name, value]) => `
      <div class="variable-card">
        <div class="variable-name">${name}</div>
        <div class="variable-value">${value}</div>
      </div>
    `)
    .join("");
}

function renderAll() {
  const topic = topics[activeTopicIndex];
  const step = topic.steps[activeStepIndex];

  lessonCategory.textContent = topic.category;
  lessonTitle.textContent = topic.title;
  lessonDescription.textContent = topic.description;
  stepCounter.textContent = `Step ${activeStepIndex + 1} of ${topic.steps.length}`;
  currentLineBadge.textContent = `Line ${step.line}`;
  explanationCard.textContent = step.explanation;
  executionView.innerHTML = step.execution.replaceAll("\n", "<br>");
  outputView.textContent = step.output || "No output yet.";

  renderCode(topic, step);
  renderVariables(step.variables);
  renderTopics();

  previousButton.disabled = activeStepIndex === 0;
  nextButton.disabled = activeStepIndex === topic.steps.length - 1;
}

function nextStep() {
  const topic = topics[activeTopicIndex];
  if (activeStepIndex < topic.steps.length - 1) {
    activeStepIndex += 1;
    renderAll();
  } else {
    stopPlayback();
  }
}

function previousStep() {
  if (activeStepIndex > 0) {
    activeStepIndex -= 1;
    renderAll();
  }
}

function restart() {
  stopPlayback();
  activeStepIndex = 0;
  renderAll();
}

function startPlayback() {
  if (playTimer) {
    stopPlayback();
    return;
  }
  playButton.textContent = "❚❚ Pause";
  const delay = Number(speedSelect.value);

  playTimer = setInterval(() => {
    const topic = topics[activeTopicIndex];
    if (activeStepIndex >= topic.steps.length - 1) {
      stopPlayback();
      return;
    }
    activeStepIndex += 1;
    renderAll();
  }, delay);
}

function stopPlayback() {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
  playButton.textContent = "▶ Play";
}

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

renderAll();
