# 🧬 Hybrid React-Knockout Web Application

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![JavaScript](https://img.shields.io/badge/javascript-%23F7DF1E.svg?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Knockout.js](https://img.shields.io/badge/Knockout.js-BF1D2D?style=flat&logo=knockout.js&logoColor=white)](https://knockoutjs.com/)
[![jQuery](https://img.shields.io/badge/jquery-%230769AD.svg?style=flat&logo=jquery&logoColor=white)](https://jquery.com/)
[![Zustand](https://img.shields.io/badge/zustand-%23443E38.svg?style=flat)](https://github.com/pmndrs/zustand)
[![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2306B6D4.svg?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/vitest-%236E9F18.svg?style=flat&logo=vitest&logoColor=white)](https://vitest.dev/)
[![ESLint](https://img.shields.io/badge/eslint-%234B32C3.svg?style=flat&logo=eslint&logoColor=white)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/prettier-%23F7B93E.svg?style=flat&logo=prettier&logoColor=black)](https://prettier.io/)
[![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/en)
[![React Testing Library](https://img.shields.io/badge/-React%20Testing%20Library-E33332?style=flat&logo=testing-library&logoColor=white)](https://testing-library.com/)

## 💡 About project

A hybrid web application that exemplifies the embedding of independent React components into a framework built using Knockout.js and jQuery. New features are written in React and integrated into existing Knockout templates as independent general React root components. React components are maximally isolated, while Knockout.js manages two-way data exchange using bindings, zustand, event bus and client-side routing with React Context.

## ⚙️ Technology stack

1. **Bundler**: Vite _(v6.4+)_
2. **Language**: JavaScript _(ESM)_, TypeScript _(v5.9+ Strict Mode)_
3. **Infrastructure**: Knockout.js _(v3.5+)_
4. **UI**: React _(v19.2+)_, ReactDOM _(v19.2+)_, jQuery _(v4.0+)_, jQueryUI _(v1.14+)_
5. **Global State Manager**: Zustand _(v5.0+)_
6. **Linter**: ESLint _(v9.39+ Flat Config)_
7. **Formatter**: Prettier _(v3.8+)_
8. **Testing framework**: Vitest _(v4.0+)_, React Testing Library _(v16.3+)_
9. **Styling**: Tailwind CSS _(v4.2+)_, CSS modules
10. **Server**: Node.js _(v22.19+)_

## 🧩 Architecture

A custom binding mechanism is used to render React root components within an application written entirely in Knockout.js. Components are automatically unmounted when the node is removed from the DOM and renders when observable data has changed. To ensure the app loads as quickly as possible, all React widgets can be wrapped in lazy components before passing them to Knockout. Knockout.js uses `ko.observable` to subscribe to the global Zustand state and build a client-side routing mechanism. React uses the hooks to subscribe to the global Zustand store and router context.

## 📜 Development guidelines

1. Linking React and Knockout.js. Rule: Never use ReactDOM.createRoot directly in business logic. Always use binding.

2. Lazy Loading (Code Splitting). Create a wrapper file: `[WidgetName].lazy.tsx` using `React.lazy` and `Suspense`. Import the lazy wrapper into the ViewModel, not the widget itself.

3. Working with jQuery within React. If you need to wrap a jQuery plugin (for example, Datepicker) in a React component: Be sure to import global initialization. Use `useRef` to bind to the DOM element to delegate rendering to jQuery and easily track changes in React.

## 📂 Project structure

```text
├── public/
├── src/
│ ├── app/ # knockout setup
│ │ ├── bindings/
│ │ ├── components/
│ │ ├── extenders/
│ │ ├── loaders/
│ │ ├── models/
│ │ ├── router/
│ │ ├── setup/
│ │ ├── styles/
│ │ └── index.ts
│ ├── modules/ # independent React modules which can be structured using FSD
│ ├── tests/ # files which are important for test environment setup
│ ├── shared/ # reusable logic
│ │ ├── event-bus/
│ │ ├── lib/
│ │ ├── router/
│ │ ├── store/
│ │ ├── types/
│ │ ├── ui/
│ │ └── utils/
│ └── index.ts # main script
├── .prettierrc
├── app.d.ts
├── eslint.config.js
├── index.html
├── nginx.conf
├── package.json
├── README.md
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## 🔧 Installation and setup

1. `git clone https://github.com/your-username/your-repo-name.git`
2. `cd your-repo-name`
3. `npm install`
4. `npm run dev`

## ⌨️ Scripts and commands

- `npm run dev` — Runs a local development server (Vite HMR).
- `npm run build` — Runs strict type checking (tsc) and builds the production version into `dist`.
- `npm run preview` — Runs the built production version locally.
- `npm run ts-check` — Runs type checking (tsc).
- `npm run lint` — Runs code checks (ESLint).
- `npm run format` — Runs formatting checks (Prettier).
- `npm run test` — Runs tests (Vitest).

## 🌐 Building and deploy

The project is configured for maximum load performance:

- Vendor Splitting: Vite automatically splits third-party dependencies into separate chunks (react-vendor, knockout-vendor, jquery-vendor, zustand-vendor).
- Caching: All files in the dist/assets/ folder have unique hashes in their names. On the server (Nginx), they are cached for 1 year (Cache-Control: immutable). The main index.html file is never cached.
