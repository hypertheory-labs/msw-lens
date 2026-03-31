# Softarc Sheriff

Have clear boundaries is helpful and important. My therapist has been telling me this for _years_.

In software we want _low coupling_ - which is just the freedom to change your mind, get smarter, be responsive to the business, all that _without having unintended consequences that break other code_.

["Sheriff" from SoftArc](https://sheriff.softarc.io/) is a set of extensions to ESLint and tools that can help "enforce" these module boundaries in your application.

> **Note**: Sheriff is MIT Licensed Open Source. It's free. No need to defund these police. ;)

## Badges? We Don't Need No Stinkin' Badges!

We would we want _the main_ getting in our way? Think of this as a set of "guard rails". They will tell you when you've introduced unneeded coupling in your code.

I don't feel like it gets in the way - even when I do get an error reported. What it sometimes is telling me is that I need to be more deliberate about what I'm using or what I'm sharing.

### The Packages

Please consult the documentation above, but generally you need:

- ESLint
- @softarc/sheriff-core
- @softarc/eslint-plugin-sheriff
- (optional) @softarc/detective

You create a `/sheriff.config.ts` in the root of your project (more on that below), and you add some configuration to your `eslint.config.js` file to "hook it up".

## Your `sheriff.config.ts`: Formalizing and Generalizing The Rules

We could do some _pattern matching_ and deduce the following rules for modules within our application.

> **Definition**: _Module_ here is just a convenient way of saying a "group of related thingies"
> Also, I'm using the word `domain` here as a signifier for each individual area. It could be `area`, but...

### The Modules

| Module                                  | "Tags"                          |
| --------------------------------------- | ------------------------------- |
| `src/app/areas/<domain>/feature-<name>` | `area:<domain>`, `type:feature` |
| `src/app/areas/<domain>/ui-<name>`      | `area:<domain>`, `type:ui`      |
| `src/app/areas/<domain>/data`           | `area:<domain>`, `type:data`    |
| `src/app/areas/<domain>/util-<name>`    | `area:<domain>`, `type:util`    |
| `src/app/*`                             | `root`                          |

So, if we have, for example, a folder (module) in our app called `src/app/areas/home`, it is "tagged" as needing to follow the rules of `area:home`, and `type:feature`.

### The Rules

|     | Tag            | Rules                                                                                    |
| --- | -------------- | ---------------------------------------------------------------------------------------- |
| 1   | `root`         | `*` _can use anything_                                                                   |
| 2   | `area:*`       | `sameTag` (_anything in the same area_), `area:shared` (_anything in the `shared` area_) |
| 3   | `type:feature` | `type:ui`, `type:data`, `type:util`                                                      |
| 4   | `type:ui`      | `type:data`, `type:util`                                                                 |
| 5   | `type:data`    | `type:util`                                                                              |
| 6   | `type:util`    | _nothing_                                                                                |

- Rule 1 says anything tagged as `root` can use _anything_. And the only thing tagged as root is anything that isn't tagged as anything else (e.g. our `src/app/` folder)
- Rule 2 says everything tagged as an area can use anything else with it's own tag (so `area:home` gets access to all `area:home` stuff, but **not** `area:auth`)
- Rule 3 says everything tagged as a feature can use _that_ feature's (see rule 2) `type:ui`, `type:data`, or `type:util`
- Rule 4 says everything tagged as `type:ui` can use `type:data` or `type:util` (within the same feature, again, see rule 2)
- Rule 5 says everything tagged as `type:data` can only use the same area's `type:util`
- Rule 6 says everything tagged as `type:util` cannot use _anything_ outside of it's module.

So these rules say, for example, any code in the `src/app/areas/home/landing-feature` can use it's _own_ stuff tagged as `type:ui`, or `type:data`, or `type:util`, as well as anything tagged as `area:shared`

### The Config

With that in place, your `sheriff.config.ts` might look like this:

```ts
import { sameTag, SheriffConfig } from '@softarc/sheriff-core';

export const config: SheriffConfig = {
  autoTagging: true,
  entryFile: 'src/main.ts',
  enableBarrelLess: true,
  modules: {
    'src/app/areas/<domain>/feature-<name>': ['area:<domain>', 'type:feature'],
    'src/app/areas/<domain>/ui-<name>': ['area:<domain>', 'type:ui'],
    'src/app/areas/<domain>/data': ['area:<domain>', 'type:data'],
    'src/app/areas/<domain>/util-<name>': ['area:<domain>', 'type:util'],
  },
  depRules: {
    root: '*',
    'area:*': [sameTag, 'area:shared'],
    'type:feature': ['type:ui', 'type:data', 'type:util'],
    'type:ui': ['type:data', 'type:util'],
    'type:data': ['type:util'],
    'type:util': [],
  },
};
```

The `modules: {}` and `depRules: {}` are what was covered above.

The other properties are:

- `entryFile` - where you app "starts"
- `autoTagging` - This means anything touched by the `entryFile` that isn't explicitly tagged is automatically tagged as `root`.
- `enableBarrelLess` - This one is more complicated, so more details below.

#### To Barrel or Not To Barrel

A "Barrel" is a pattern in JavaScript and TypeScript applications meant to do a couple of things.

1. Get around the fact that there are no "private" code modules in JavaScript. You can't mark a class in a module as "internal" or "private" like you do in other languages.
   1. Some code is "implementation" details of other "public" code. It might change and break your code if you use it, but the "public" thing we are saying is "stable"
   2. Using a barrel, which is just having a file called `index.ts` in a directory that re-exports the other files in that directory (or it's children) is a _convention_ that says "Here's the stuff I want to share with you. Only use this"
   3. It is a _convention_ - there isn't anything "built in" that keeps you from digging deep into another barrel.
2. It simplifies, or at least cuts down on the number of `import {x} from 'y';` statements you have at the top of your code.
   1. Using a barrel it _looks like_ everything comes from the same file (`index.ts`)
   2. This was a bigger deal early on when developer tools wouldn't automatically import code for you. It's still an issue, for sure, but...

Barrel's might be a _bad_ idea. Especially in _application_ code.

> **Note**: They are _fine_ in stable code, but stable code should be in a package. In other words, if you are creating a package (library), use barrels. You changes won't break my stuff until I install a new version of your package, and that's on me.

Why they are a bad idea, especially in an application is:

- Barrels are not _tree shakable_. Because that `index.ts` might have _side effects_, any file you import from a barrel that changes means _all_ files from that barrel must be re-exported.
- Who cares? During development a _lot_ of work has gone into making our developer experience better with "hot module replacement". That means while we are doing development, with the _Vite_ powered development server, changes in a single source code file will be _pushed_ to the browser without the browser needed to refresh the entire application. Your application doesn't loose it's "state", and you are more productive, less annoyed, and generally happier.

#### How Sheriff Fixes The "No Private/Internal" Problem

Since we have a cop around enforcing the rules, we can tell it "hey, no matter what `depRules` some code has to get to my stuff, if the code is in any folder called `super-secret`, don't let them access it". By default (it's configurable) the folder is called `internal`.

So, let's say you are working on some form validation stuff to share with the entire app. You put it in `/src/app/areas/shared/util-form-validators`. That means _any_ feature in the application can use the stuff you have in that folder. But if you have _some stuff_ you don't feel comfortable providing, that you want to "keep in the family", so to speak, put it in a folder called `internal`. It'll be guarded by the Sheriff.

## Developer Experience

Let's say I'm in an area, working on a feature, and I try to reach out and import something that isn't shared with me.

So, here, I'm in `/src/app/areas/home/feature-landing/` and working on the home page, and I want to use some other area's code:

![Sheriff Errors](/docs/sheriff-errors.png)

I get the **red squigglies of doom!**.

> **Note**: I add a path to my `tsconfig.json` to make importing from my own app easier and so I don't get as lost in the `../../../../../thing.ts` double-dot nonsense.

It looks like this (lines 4,5,6 are the important bits.):

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@ht/*": ["src/app/areas/*"]
    },
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2022",
    "module": "preserve"
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  },
  "files": [],
  "references": [
    {
      "path": "./tsconfig.app.json"
    }
  ]
}
```

### Sheriff CLI

You can run some commands from the terminal to check your sheriff config and to have it list out your modules.

#### Sheriff Verify

Running:

```sh
npx sheriff verify
```

(I have this as an NPM script in this project called `sheriff:check` for convenience)

Will give you output like this, if everything is ok:

```sh
Verification Report

No issues found. Well done!
```

Or this, if it finds a problem:

```sh

Verification Report

Issues found:
  Total Invalid Files: 1
  Total Encapsulation Violations: 0
  Total Dependency Rule Violations: 1
----------------------------------

|-- src/app/areas/dev/feature-landing/internal/pages/viewer.ts
|   |-- Dependency Rule Violations
|   |   |-- from tag area:dev to tags area:home, type:feature
```

(I tried to import something from the `feature:dev` from the `feature:home` here)

#### Sheriff List

Running:

```sh
npx sheriff list
```

Will give you it's understanding of our module boundaries and tags.

```sh
  └── app
    └── areas
      ├── dev
        ├── feature-landing (area:dev, type:feature)
        └── ui-markdown (area:dev, type:ui)
      ├── home
        └── feature-landing (area:home, type:feature)
      ├── profile
        └── feature-landing (area:profile, type:feature)
      └── shared
        ├── ui-common (area:shared, type:ui)
        ├── util-auth (area:shared, type:util)
        └── util-types (area:shared, type:util)
```

#### Detective

There is another tool you can install that works along with Sheriff called ["Detective"](https://github.com/angular-architects/detective)

This is a super cool tool for analyzing dependency issues within your application, and provides affordances that can help you identify "hot spots" that are changed frequently causing the each feature to be redeployed,
as well as "team alignment" - in other words, it will track _who_ is changing what _where_ within your application.

![Watching the Detective](/docs/detective.png)
