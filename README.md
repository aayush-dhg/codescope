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
- Current-line highlighting
- Variable state visualization
- Animated variable-to-object memory view for numbers, strings, and booleans
- Visual value movement from a variable to `print()`
- Execution explanations
- Console output
- Previous / Next controls
- Play / Pause
- Restart
- Adjustable playback speed
- Responsive layout

### Current Topics

- Variables
- Multiple Variables
- Arithmetic
- If Statements
- For Loops
- Functions

## Current Architecture

The current prototype uses predefined execution steps so the visualization experience can be designed before building a full Python execution engine.

```text
Python Example
      ↓
Predefined Execution Steps
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
- [ ] Editable code panel
- [ ] Lists
- [ ] Dictionaries
- [ ] Tuples
- [ ] Sets
- [ ] While loops
- [ ] Function parameters and return values
- [ ] Scope visualization
- [ ] References and mutation
- [ ] Common beginner errors

### Phase 2 — Real Execution Engine

- [ ] Parse supported Python input
- [ ] Generate structured execution events
- [ ] Track variable creation and updates
- [ ] Track execution line-by-line
- [ ] Support user-entered Python examples
- [ ] Add safe execution limits

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
