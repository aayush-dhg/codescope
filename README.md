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
- Python Playground (real Python)

### Guided Lesson Editing

- **Variables / Multiple Variables:** literal assignments followed by `print()`; retain their existing lesson constraints.
- **Arithmetic:** assignments, reassignment, numeric `+ - * / // %`, parentheses, unary signs, string concatenation, and `print()`.
- **If Statements:** the above plus `if` / `else`, a single comparison per expression (`== != < > <= >=`), and nested conditions.
- **For Loops:** the above plus lists and `for item in list` or `for item in range(start, stop, step)`. `range()` is supported directly in loop headers. Empty and descending ranges work.
- **Functions:** top-level `def`, positional arguments, local variables, global reads, `return`, implicit `None`, and the above control flow. Local frames are shown during calls and removed on return.

Use spaces for indentation. Blank lines and comments retain their original source line numbers. Unsupported syntax and invalid input show a line-specific error; editing invalidates the old playback until **Apply changes** is clicked.

These six guided lessons use a teaching subset, not a full Python runtime. Imports, recursion, mutation/indexing, `elif`, `while`, default/keyword arguments, and arbitrary built-ins are not supported. Numbers use JavaScript numeric storage and simplified formatting rather than separate Python integer/float objects. Execution is limited to 12,000 source characters, 120 nonempty lines, 100 values per loop, 300 emitted steps, and eight nested blocks/call frames, with an additional evaluation-work limit. Failed executions clear the visualization rather than showing partial results.

### Real-Python Playground

Select **Python Playground**, edit the code, and click **Run Python**. It runs CPython through [Pyodide](https://pyodide.org/en/stable/usage/quickstart.html), pinned to version **314.0.7**, in a dedicated module Web Worker. The first run downloads the runtime from jsDelivr; loading requires network access. The existing six lessons do not download Python.

- Supports Python syntax including `while`, `elif`, recursion, comprehensions, indexing/mutation, classes, exception handling, and browser-compatible standard-library imports.
- Enter answers for `input()` in the optional input box, one per line. Exhausted input raises `EOFError`.
- The completed run opens on its final state/output. **Play**, **Previous**, **Next**, and **Restart** replay recorded snapshots; **Stop execution** terminates an in-progress worker.
- Python line trace events show state **before** that line executes. Call, return/yield/unwind, exception, and completion events show frame snapshots. C/native internals and imported module source are not traced. Async programs and dynamically compiled code are not fully visualized in this first version.
- Runtime errors retain the trace and output produced before the error. Syntax errors identify the source line. Forced Stop and wall-clock timeout discard incomplete worker results.
- Every run uses a fresh worker/interpreter. Variables, imports, and the in-memory filesystem do not persist across runs. Browser HTTP caching can avoid repeat runtime downloads.
- Limits: 20,000 source characters, 8,000 input/output characters, 500 trace events plus a terminal event, 2 MB of recorded snapshots, and a **10-second execution timeout** after startup. Runtime loading has a separate 90-second timeout. At most 25 variables per scope and seven local frames are displayed, with bounded previews of collection values. Custom objects show their Python type without invoking user-defined `__repr__`.

This does not mean every Python application can run in a browser. Third-party packages are not automatically installed; desktop GUI/process APIs and the user's local filesystem are unavailable. A normal HTTP/HTTPS server is required; `file://` is insufficient for the worker. The Playground executes ordinary Python scripts, not top-level `await` cells.

## Current Architecture

CodeScope currently has two execution paths. The six guided lessons use focused builders plus the shared, bounded Python-subset interpreter in `lesson-engine.js`. The Python Playground uses Pyodide in a Web Worker and produces snapshots through `sys.settrace`. Both paths emit the same kind of timeline data for the visualization layer, while keeping the beginner lessons predictable and the Playground open-ended.

```text
Guided Lesson Code                 Python Playground Code
      ↓                                      ↓
Lesson Parser / Interpreter          Pyodide Worker + sys.settrace
      ↓
Execution Snapshots + Visual Events
      ↓
Visualization
      ↓
Animation / Controls
```

The Playground implements the next architecture alongside the guided lessons:

```text
Python Code
    ↓
Pyodide Worker + Python sys.settrace
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
- Pyodide / CPython (Playground only)

This keeps the first version lightweight while the product experience is being validated.

Future versions may introduce technologies such as:

- React
- TypeScript
- FastAPI

Technology will be added only when it solves a real product or engineering need.

## Project Structure

```text
codescope/
├── index.html
├── styles.css
├── app.js
├── lesson-engine.js
├── playground.js
├── python-worker.js
├── python-tracer.py
├── tests/
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

Start a static server (or use VS Code Live Server):

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). The guided lessons can also open directly from `index.html`, but the Playground needs HTTP/HTTPS for its worker and tracer assets.

## Tests

The JavaScript tests use Node.js's built-in test runner; the tracer tests use Python's standard-library unittest. Neither requires installed dependencies:

```bash
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
```

They cover guided lessons, worker cancellation/timeouts/retries, real-Python tracing, recursion, mutations, input/output, frame snapshots, invalid input, and execution limits. Tracer unit tests use native Python; browser verification is also needed to exercise the actual Pyodide CDN/Worker path. The site itself still runs as static HTML/CSS/JavaScript without a build step.

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
- [x] Add a real-Python Playground in a cancellable worker
- [ ] Migrate guided lessons to the real-Python engine after validating the Playground

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

Playground code executes locally in the browser, not on a Python server. A fresh Web Worker keeps execution off the UI thread and can be terminated by Stop or timeout. CodeScope itself does not upload editor contents; Pyodide runtime files load from jsDelivr.

A worker and `sys.settrace` are **not a hardened sandbox for hostile code**. Python can access browser-worker APIs via Pyodide's JavaScript bridge, including network APIs, and can modify tracing. Display/trace limits are teaching safeguards, not a strict memory or security boundary. Use the Playground for your own learning code. Do not add server-side execution or automatic execution of untrusted shared code without a separate isolation design.

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
