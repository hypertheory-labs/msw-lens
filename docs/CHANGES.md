# Project Changes Summary

This is compared against a new Angular project created with `ng new -t -s <project-name> --skip-tests`.

I took Tailwind as the CSS option, did not do SSR.

## angular.json

### Vitest Test Configuration

```diff
+        "test": {
+          "builder": "@angular/build:unit-test",
+          "options": {
+            "runnerConfig": "vitest.config.ts"
+          }
+        },
```

**Description:**

## Added Vitest, following the steps here [https://angular.dev/guide/testing/migrating-to-vitest](https://angular.dev/guide/testing/migrating-to-vitest)

### Additional Asset Directory (docs)

```diff
               {
                 "glob": "**/*",
                 "input": "public"
+              },
+              {
+                "glob": "**/*",
+                "input": "docs"
               }
```

**Description:**

Added another asset directory for the markdown files that are in the developer guides.

---

### PrismJS Styles Integration

```diff
             "styles": [
-              "src/styles.css"
+              "src/styles.css",
+              "public/darcula.css",
+              "node_modules/prismjs/plugins/line-numbers/prism-line-numbers.css",
+              "node_modules/prismjs/plugins/command-line/prism-command-line.css"
             ],
```

**Description:**

## The ng-markdown library uses Prismjs behind the scenes. I enabled a couple plugins and changed the theme.

### PrismJS Scripts Integration

```diff
+            "scripts": [
+              "node_modules/prismjs/prism.js",
+              "node_modules/prismjs/plugins/show-language/prism-show-language.js",
+              "node_modules/prismjs/plugins/treeview/prism-treeview.js",
+              "node_modules/prismjs/components/prism-csharp.min.js",
+              "node_modules/prismjs/components/prism-bash.js",
+              "node_modules/prismjs/components/prism-css.min.js",
+              "node_modules/prismjs/components/prism-diff.js",
+              "node_modules/prismjs/components/prism-http.js",
+              "node_modules/prismjs/components/prism-typescript.js",
+              "node_modules/prismjs/plugins/line-numbers/prism-line-numbers.js",
+              "node_modules/prismjs/plugins/line-highlight/prism-line-highlight.js",
+              "node_modules/prismjs/plugins/command-line/prism-command-line.js",
+              "node_modules/clipboard/dist/clipboard.min.js",
+              "node_modules/prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard.js"
+            ]
```

**Description:**

## More Prismjs stuff.

### Environment File Replacements

```diff
             "development": {
               "optimization": false,
               "extractLicenses": false,
-              "sourceMap": true
+              "sourceMap": true,
+              "fileReplacements": [
+                {
+                  "replace": "src/environments/environment.ts",
+                  "with": "src/environments/environment.development.ts"
+                }
+              ]
             }
```

**Description:**

Result of `ng generate environments`

---

### ESLint Configuration

```diff
+        "lint": {
+          "builder": "@angular-eslint/builder:lint",
+          "options": {
+            "lintFilePatterns": [
+              "src/**/*.ts",
+              "src/**/*.html"
+            ]
+          }
+        },
```

**Description:**

## Added Angular ES Lint from [https://github.com/angular-eslint/angular-eslint](https://github.com/angular-eslint/angular-eslint)

### Playwright E2E Testing

```diff
+        "e2e": {
+          "builder": "playwright-ng-schematics:playwright",
+          "options": {
+            "devServerTarget": "angular-starter:serve"
+          },
+          "configurations": {
+            "production": {
+              "devServerTarget": "angular-starter:serve:production"
+            }
+          }
+        },
```

**Description:**

## Using Playwright for Angular Testing. Instructions: [https://angular.dev/tools/cli/end-to-end](https://angular.dev/tools/cli/end-to-end)

### Storybook Configuration

```diff
+        "storybook": {
+          "builder": "@storybook/angular:start-storybook",
+          "options": {
+            "configDir": ".storybook",
+            "browserTarget": "angular-starter:build",
+            "compodoc": true,
+            "compodocArgs": [
+              "-e",
+              "json",
+              "-d",
+              "."
+            ],
+            "port": 6006
+          }
+        },
+        "build-storybook": {
+          "builder": "@storybook/angular:build-storybook",
+          "options": {
+            "configDir": ".storybook",
+            "browserTarget": "angular-starter:build",
+            "compodoc": true,
+            "compodocArgs": [
+              "-e",
+              "json",
+              "-d",
+              "."
+            ],
+            "outputDir": "storybook-static"
+          }
+        }
```

**Description:**

## Added Storybook. Also changed it to use vite as the builder.

## package.json

### Additional NPM Scripts

```diff
   "scripts": {
     "ng": "ng",
     "start": "ng serve",
+    "start:prod": "ng serve --configuration production",
     "build": "ng build",
     "watch": "ng build --watch --configuration development",
-    "test": "ng test"
+    "test": "ng test",
+    "test:ui": "vitest --ui",
+    "test:coverage": "vitest run --coverage",
+    "test:storybook": "test-storybook  --watch --url http://localhost:6006",
+    "lint": "ng lint",
+    "format": "npx prettier --write .",
+    "sheriff:check": "sheriff verify",
+    "sheriff:list": "sheriff list",
+    "sheriff:detective": "detective",
+    "generate-types": "openapi-ts",
+    "e2e": "npx playwright test",
+    "e2e:ui": "npx playwright test --ui",
+    "scaffold": "./scaffold.sh1",
+    "storybook": "ng run angular-starter:storybook",
+    "build-storybook": "ng run angular-starter:build-storybook"
   },
```

**Description:**

## Bunch of these. I like them.

### Additional Runtime Dependencies

```diff
     "@angular/forms": "^21.1.0",
     "@angular/platform-browser": "^21.1.0",
     "@angular/router": "^21.1.0",
+    "@msw/playwright": "^0.4.5",
+    "@ng-icons/core": "^33.0.0",
+    "@ng-icons/lucide": "^33.0.0",
+    "@ngrx/operators": "^21.0.1",
+    "@ngrx/signals": "^21.0.1",
+    "clipboard": "^2.0.11",
+    "marked": "^17.0.1",
+    "ngx-markdown": "^21.0.1",
     "rxjs": "~7.8.0",
     "tslib": "^2.3.0"
```

**Description:**

## All pretty obvious.

### Additional Development Dependencies

```diff
   "devDependencies": {
+    "@angular-devkit/architect": "^0.2101.0",
+    "@angular-devkit/build-angular": "^21.1.0",
+    "@angular-devkit/core": "^21.1.0",
     "@angular/build": "^21.1.1",
     "@angular/cli": "^21.1.1",
     "@angular/compiler-cli": "^21.1.0",
+    "@angular/platform-browser-dynamic": "^21.1.0",
+    "@compodoc/compodoc": "^1.2.1",
+    "@hey-api/openapi-ts": "^0.90.8",
+    "@playwright/test": "1.57.0",
+    "@softarc/detective": "^2.0.2",
+    "@softarc/eslint-plugin-sheriff": "^0.19.6",
+    "@softarc/sheriff-core": "^0.19.6",
+    "@storybook/addon-a11y": "^10.2.0",
+    "@storybook/addon-docs": "^10.2.0",
+    "@storybook/angular": "^10.2.0",
+    "@storybook/builder-vite": "^10.2.0",
+    "@storybook/test-runner": "^0.24.2",
+    "@tailwindcss/forms": "^0.5.11",
     "@tailwindcss/postcss": "^4.1.12",
+    "@tailwindcss/typography": "^0.5.19",
+    "@types/node": "^25.0.10",
+    "@vitest/coverage-v8": "^4.0.18",
+    "@vitest/ui": "^4.0.18",
+    "angular-eslint": "21.1.0",
+    "daisyui": "^5.5.14",
+    "eslint": "^9.39.1",
+    "eslint-plugin-storybook": "^10.2.0",
+    "jsdom": "^27.4.0",
+    "msw": "^2.12.7",
+    "playwright-ng-schematics": "^21.0.3",
     "postcss": "^8.5.3",
+    "prettier": "^3.8.1",
+    "prismjs": "^1.30.0",
+    "simple-scaffold": "^2.3.3",
+    "storybook": "^10.2.0",
     "tailwindcss": "^4.1.12",
-    "typescript": "~5.9.2"
+    "typescript": "~5.9.2",
+    "typescript-eslint": "8.47.0",
+    "vitest": "^4.0.18"
+  },
```

**Description:**

---

### MSW Configuration

```diff
+  "msw": {
+    "workerDirectory": [
+      "public"
+    ]
   }
```

**Description:**

## [MSW](https://mswjs.io) adds these automatically with init.

## tsconfig.app.json

### Formatting & Template Exclusion

```diff
-  "include": [
-    "src/**/*.ts"
-  ],
-  "exclude": [
-    "src/**/*.spec.ts"
-  ]
+  "include": ["src/**/*.ts"],
+  "exclude": ["src/**/*.spec.ts", ".templates/**/*"]
```

**Description:**

---

## tsconfig.json

### Path Aliases

```diff
   "compileOnSave": false,
   "compilerOptions": {
+    "baseUrl": ".",
+    "paths": {
+      "@ht/*": ["src/app/areas/*"]
+    },
+
     "strict": true,
```

**Description:**

## Like to set at least one path to make imports cleaner.

## tsconfig.spec.json

### Formatting Changes

```diff
   "compilerOptions": {
     "outDir": "./out-tsc/spec",
-    "types": [
-      "vitest/globals"
-    ]
+    "types": ["vitest/globals"]
   },
-  "include": [
-    "src/**/*.d.ts",
-    "src/**/*.spec.ts"
-  ]
+  "include": ["src/**/*.d.ts", "src/**/*.spec.ts"]
```

**Description:**

---

## Eslint

After the initial run of `ng add eslint`, here's the diff between it and what I have.

The big changes here are:

- Storybook adds some stuff.
- Added some ignores
- Sheriff configuration
- Slightly tweaked some default rules (const, etc.)
- Made it so it will let me use `type` instead of `interface` because it isn't the boss of me.

```diff
--- eslint.config.js	2026-01-25 20:11:17
+++ ../angular-starter-2026/eslint.config.js	2026-01-25 19:51:11
@@ -1,44 +1,71 @@
-// @ts-check
-const eslint = require("@eslint/js");
-const { defineConfig } = require("eslint/config");
-const tseslint = require("typescript-eslint");
-const angular = require("angular-eslint");
+// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
+import storybook from "eslint-plugin-storybook";

-module.exports = defineConfig([
-  {
-    files: ["**/*.ts"],
-    extends: [
-      eslint.configs.recommended,
-      tseslint.configs.recommended,
-      tseslint.configs.stylistic,
-      angular.configs.tsRecommended,
-    ],
-    processor: angular.processInlineTemplates,
-    rules: {
-      "@angular-eslint/directive-selector": [
-        "error",
-        {
-          type: "attribute",
-          prefix: "app",
-          style: "camelCase",
-        },
-      ],
-      "@angular-eslint/component-selector": [
-        "error",
-        {
-          type: "element",
-          prefix: "app",
-          style: "kebab-case",
-        },
-      ],
-    },
+import eslint from '@eslint/js';
+
+import angular from 'angular-eslint';
+import { defineConfig, globalIgnores } from 'eslint/config';
+import { configs as tseslint } from 'typescript-eslint';
+import sheriff from '@softarc/eslint-plugin-sheriff';
+
+export default defineConfig([globalIgnores([
+  '.angular/**',
+  '*/**/mockServiceWorker.js',
+  'dist/**',
+  'scripts/**',
+  'playwright.config.ts',
+  'system-tests/**',
+  '*/**/mockServiceWorker.js',
+  '*/**/__mocks__/**',
+]), {
+  files: ['**/*.html'],
+  plugins: {
+    '@softarc/sheriff': sheriff,
+
+    angular: angular.templatePlugin,
   },
-  {
-    files: ["**/*.html"],
-    extends: [
-      angular.configs.templateRecommended,
-      angular.configs.templateAccessibility,
+  languageOptions: {
+    parser: angular.templateParser,
+  },
+}, {
+  files: ['**/*.ts'],
+  extends: [
+    eslint.configs.recommended,
+    tseslint.strict,
+    angular.configs.tsRecommended,
+    sheriff.configs.all,
+  ],
+
+  processor: angular.processInlineTemplates,
+  rules: {
+    '@typescript-eslint/no-invalid-void-type': ['off'],
+
+    '@typescript-eslint/naming-convention': [
+      'error',
+      {
+        selector: 'variable',
+        modifiers: ['const'],
+        format: ['camelCase'],
+      },
     ],
-    rules: {},
-  }
-]);
+    '@typescript-eslint/no-extraneous-class': 'off',
+    '@typescript-eslint/consistent-type-definitions': 'off',
+    '@angular-eslint/directive-selector': [
+      'off',
+      {
+        type: 'attribute',
+        prefix: 'app',
+        style: 'camelCase',
+      },
+    ],
+
+    '@angular-eslint/component-selector': [
+      'off',
+      {
+        type: 'element',
+        prefix: 'app',
+        style: 'kebab-case',
+      },
+    ],
+  },
+}, ...storybook.configs["flat/recommended"]]);

```
