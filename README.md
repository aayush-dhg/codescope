# CodeScope

**See what your code is doing.**

CodeScope is an interactive learning platform that helps beginners understand Python by visualizing how code executes step by step.

Instead of only showing the final output, CodeScope aims to show what happens internally as a program runs: variables changing, conditions being evaluated, loops progressing, functions being called, and output being produced.

## Live Demo

https://aayush-dhg.github.io/codescope/

## Project Vision

The core idea is simple:

> **Don’t just show the output. Show how the code gets there.**

CodeScope is starting with Python because Python is widely used in:

- Artificial Intelligence
- Machine Learning
- Data Science
- Automation
- Robotics
- Software Engineering

The long-term direction is:

**Visual Python → Visual Computer Science → Visual AI**

## Current Features

The current prototype includes:

- Beginner-friendly Python topic navigation
- Step-by-step execution playback
- Current execution line indicator
- Variable state visualization
- Animated variable-to-object memory view for numbers, strings, and booleans
- Visual value movement from a variable to `print()`
- Editable code in all six lessons
- Animated arithmetic, branch decisions, loop iterations, and function calls
- Global and local frame visualization in function lessons
- Execution explanations
- Console output
- Previous / Next controls
- Play / Pause
- Restart
- Adjustable playback speed
- Responsive layout with floating playback controls on desktop and mobile

### Current Topics

- Variables
- Multiple Variables
- Arithmetic
- If Statements
- For Loops
- Functions

### Supported Editing

- **Variables / Multiple Variables:** literal assignments followed by `print()`; retain their existing lesson constraints.
- **Arithmetic:** assignments, reassignment, numeric `+ - * / // %`, parentheses, unary signs, string concatenation, and `print()`.
- **If Statements:** the above plus `if` / `else`, a single comparison per expression (`== != < > <= >=`), and nested conditions.
- **For Loops:** the above plus lists and `for item in list` or `for item in range(start, stop, step)`. `range()` is supported directly in loop headers. Empty and descending ranges work.
- **Functions:** top-level `def`, positional arguments, local variables, global reads, `return`, implicit `None`, and the above control flow. Local frames are shown during calls and removed on return.

Use spaces for indentation. Blank lines and comments retain their original source line numbers. Unsupported syntax and invalid input show a line-specific error; editing invalidates the old playback until **Apply changes** is clicked.

This is a teaching subset, not a full Python runtime. Imports, recursion, mutation/indexing, `elif`, `while`, default/keyword arguments, and arbitrary built-ins are not supported. Numbers use JavaScript numeric storage and simplified formatting rather than separate Python integer/float objects. Execution is limited to 12,000 source characters, 120 nonempty lines, 100 values per loop, 300 emitted steps, and eight nested blocks/call frames, with an additional evaluation-work limit. Failed executions clear the visualization rather than showing partial results.

## Current Architecture

The prototype generates execution steps from edited examples. Variables and Multiple Variables use focused lesson builders. Arithmetic, If Statements, For Loops, and Functions use a shared, bounded Python-subset interpreter in `lesson-engine.js`. It parses code into statements and expressions, then produces snapshots and animation events without using `eval()` or running arbitrary Python.

```text
Editable Python Subset
      ↓
Parser / Bounded Lesson Interpreter
      ↓
Execution Snapshots + Visual Events
      ↓
Visualization
      ↓
Animation / Controls
```

The long-term architecture is intended to become:

```text
Python Code
    ↓
Trace Engine
    ↓
Structured Execution Events
    ↓
Visualization Engine
    ↓
Interactive UI
```

Keeping execution separate from visualization will make it easier to support more Python concepts later.

## Tech Stack

The current version intentionally uses a simple stack:

- HTML
- CSS
- JavaScript
- GitHub Pages

This keeps the first version lightweight while the product experience is being validated.

Future versions may introduce technologies such as:

- React
- TypeScript
- Python
- FastAPI
- Pyodide or another sandboxed Python execution approach

Technology will be added only when it solves a real product or engineering need.

## Project Structure

```text
codescope/
├── index.html
├── styles.css
├── app.js
├── lesson-engine.js
├── tests/lesson-engine.test.cjs
├── package.json
├── README.md
└── .gitignore
```

## Run Locally

Clone the repository:

```bash
git clone https://github.com/aayush-dhg/codescope.git
```

Move into the project folder:

```bash
cd codescope
```

For the current static version, you can open `index.html` directly in a browser.

For a better local development experience, you can also use a simple local server such as the VS Code Live Server extension.

## Tests

The execution tests use Node.js's built-in test runner with no dependencies:

```bash
npm test
```

They cover arithmetic precedence, both conditional branches, loops and output history, function frames and returns, source line mapping, invalid input, and execution limits. The site itself still runs as static HTML/CSS/JavaScript without a build step.

## Deployment

CodeScope is currently deployed using GitHub Pages.

The production site is built from the `main` branch and served from the repository root.

After pushing changes:

```bash
git add .
git commit -m "Describe your changes"
git push
```

GitHub Pages automatically deploys the updated version.

## Roadmap

### Phase 1 — Visual Python Fundamentals

- [x] Variables
- [x] Arithmetic
- [x] If statements
- [x] For loops
- [x] Functions
- [x] Editable code panel (focused syntax in all six lessons)
- [ ] Lists
- [ ] Dictionaries
- [ ] Tuples
- [ ] Sets
- [ ] While loops
- [x] Function parameters and return values (positional arguments)
- [x] Scope visualization (global and local function frames)
- [ ] References and mutation
- [ ] Common beginner errors

### Phase 2 — Real Execution Engine

- [x] Parse a focused Python subset
- [x] Generate structured execution events for supported lessons
- [x] Track variable creation and updates for supported lessons
- [x] Track execution line-by-line for supported lessons
- [x] Support user-entered examples within the documented subset
- [x] Add execution limits to the lesson interpreter
- [ ] Expand toward a full sandboxed Python runtime

### Phase 3 — Computer Science Visualization

- [ ] Recursion
- [ ] Call stack
- [ ] Classes and objects
- [ ] Sorting algorithms
- [ ] Searching algorithms
- [ ] Stacks and queues
- [ ] Trees and graphs

### Phase 4 — Data & AI

- [ ] NumPy
- [ ] Pandas
- [ ] Machine learning concepts
- [ ] Neural networks
- [ ] Embeddings
- [ ] Vector databases
- [ ] Transformers
- [ ] Attention
- [ ] RAG concepts

## Product Principles

CodeScope should remain:

- Visual
- Beginner-friendly
- Interactive
- Accurate
- Minimal
- Educational
- Professional
- Easy to experiment with

Animations should explain program behavior rather than simply decorate the interface.

## Security

A future version of CodeScope may allow users to execute arbitrary Python code.

Untrusted Python code should **never** be executed directly on a production server without proper sandboxing or isolation.

Safe execution will be treated as a core architecture requirement before arbitrary code execution is introduced.

## Development Philosophy

The project is being built incrementally:

> **small working feature → test → understand → improve**

The goal is to make each concept work end-to-end before adding major complexity.

## Why This Project Exists

Many beginners can read Python syntax but still struggle to mentally understand what the computer is doing.

CodeScope is designed to bridge that gap.

The goal is for a learner to paste Python code into the platform and eventually say:

> **“Now I understand what the computer is actually doing.”**

## Author

**Aayush Dhungana**

GitHub: https://github.com/aayush-dhg

## License

This project is intended to be released under the MIT License.
