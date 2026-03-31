# Project Structure

## The Angular Style Guide

The [Angular Style Guide](https://angular.dev/style-guide) is a pretty good source for the thinking that needs to go into building an app that will be maintained by a team of developers over a period of time.

## The Structure I am Currently Using

This changes often, but this one has started to really stick around. The important thing is to have some consistency.

Most of this thinking comes from this post about [Modern Architecture with Angular](https://www.angulararchitects.io/en/blog/modern-architectures-with-angular-part-1-strategic-design-with-sheriff-and-standalone-components/)

```
/src/
  /app/
    /areas/
      /home/
        /feature-landing/
          /internal/
            /pages/
              /home.ts
              /about.ts
            /home.ts
          /home.routes.ts
      /dev/
      /profile/
      /shared/
        /ui-common/
        /util-validation/
  /app.ts
  /app.routes.ts
  /app.config.ts


```

## Application Development and Features

If you are building an Angular library, your structure would differ from this most likely. But I mostly work as an Application Developer, which means I am paid to deliver _features_ to my customers, so I structure my application source code around that reality.

### Applications are a Collection of "Areas"

Areas (in the article, they are called "Domains", but I find that term to be a bit triggering for some people, tbh). These are areas of responsibility. Parts of the application where you have to get your head in that world to understand what is going on. They are usually discrete - "User Management" is different than "Product Listing", for example.

In this structure, the `app` is the `root` of our application - that means it's responsibility is to aggregate all the other "areas" of the application and nothing more.

> Areas are not allowed to reach "outside" their world, except for `/shared/*`. Other areas are not allowed to use things from another area.

#### Each Area Has Features

Features are usually components but they are components that are specific to that area. These are usually "smart" components - which usually means they are _routed_ to.

Inside a feature, you are restricted to using only "stuff" that is part of your feature, **or** things that are held in common for that feature, which would be in the feature's `ui`, `utils`, or `data` folders. They _may_ use things from any `/shared/**/*/` folder. They may also use things from the "ultimate shared" folder, the `node_modules`.

##### Each Area May Have Ui Components

These are components that are presentational and used across the various features of the area.

##### Each Area May Have Utilities

These are things like functions, pipes, guards, etc. That are only to be used and understood in the context of the area.

##### Each Area May Have Data

These are our "View Models" used in the feature, as well as any associated stores or services that act upon that data.

#### The App May Have Shared Code

Consider anything added to `node_modules` to be globally shared. You may remember from your computer science 102 course (usually called something like _Global is Bad_) that this can lead to problems. Versioning issues, licensing issues, security issues, etc.

> **Be _very_ conservative and disciplined about taking on NPM dependencies** Using shared libraries is always an expedient, and be sure it is worth it before you take on a dependency.

Things that are created by your team and to be shared in "common" across your application should be placed in the `/src/app/shared/*` directory. This directory can mirror the structure of any feature (have a `features`, `ui`, `utils` and `data` directories), or - because there can end up being a lot of these things - be refined into things like `shared/ui-common`, `shared/ui-layouts`, etc.

This shared "stuff" has to be treated with a bit of reverence. Changes or regressions here will have impact across every other area that is using them. They are a good candidate for _unit-integration_ testing. See the testing section for more details on this.

## What is the Point of This?

![Delivery Cadence](/docs/deployments.excalidraw.svg)

In delivering software over the life of an application, areas have different cadences of release. By minimizing the coupling between the areas of our application, we help ensure a smaller "blast radius" of changes within a particular area not impacting other areas.

> **This is more important that "eliminating duplication" in my opinion**

When features are introduced, they tend to have a burst of releases as we "stabilize" (e.g. figure out) what that feature is all about.

### Lazy Loading Features and Components

The other benefit of doing this is that by using deferred (e.g. "lazy" ) loading of features, they can be put into separate bundles and delivered separately to the users of our application. More on this in the class.

### Baseline Build

Running `ng build` on a project provides this:

```
  Lazy chunk files    | Names          |  Raw size | Estimated transfer size
  chunk-BXP5X2RC.js   | browser        | 241.74 kB |                68.75 kB
  chunk-YKTGQSM5.js   | index          | 172.34 kB |                37.75 kB
  chunk-Y6PGONWV.js   | dev-routes     |  68.16 kB |                18.93 kB
  chunk-3RHF5AM3.js   | profile-routes |   3.60 kB |                 1.19 kB
  chunk-NEWEHOUR.js   | -              |   2.49 kB |               989 bytes
  chunk-L6NWKNVU.js   | home-routes    |   2.32 kB |               719 bytes
  chunk-555O5GCI.js   | -              |   1.06 kB |               477 bytes
```

A user visiting our application for the first time would have to download roughly 131843.88 bytes (128.753kB) of just JavaScript code. (I'm leaving out CSS and other assets here)

On a second visit, they would have to download zero bytes of JavaScript code if our origin server is configured properly with `cache-control` headers for our assets.

### Updating Just a Feature

Making a small change in just the `home` feature and then running `ng build` again produces this:

```diff
  Lazy chunk files    | Names          |  Raw size | Estimated transfer size
  chunk-BXP5X2RC.js   | browser        | 241.74 kB |                68.75 kB
  chunk-YKTGQSM5.js   | index          | 172.34 kB |                37.75 kB
  chunk-Y6PGONWV.js   | dev-routes     |  68.16 kB |                18.93 kB
  chunk-3RHF5AM3.js   | profile-routes |   3.60 kB |                 1.19 kB
  chunk-NEWEHOUR.js   | -              |   2.49 kB |               989 bytes
- chunk-L6NWKNVU.js   | home-routes    |   2.32 kB |               719 bytes
+ chunk-E4HBBZX6.js   | home-routes    |   2.36 kB |               729 bytes
  chunk-555O5GCI.js   | -              |   1.06 kB |               477 bytes
```

A user visiting our application for the first time would have to download roughly 131843.88 bytes (128.753kB) of just JavaScript code. (I'm leaving out CSS and other assets here)

If a user had visited this app before, but before this deployment, they would have to:

- Http Requests: 1
- Bytes: 477

### Changing Something in Shared

If that same user visits after we do a deployment that _only_ changes something in `shared` that is used across all of our features:

Making a small change in `shared/ui-common/layouts` and doing another build produces this:

```diff
  Lazy chunk files    | Names          |  Raw size | Estimated transfer size
  chunk-BXP5X2RC.js   | browser        | 241.74 kB |                68.75 kB
  chunk-YKTGQSM5.js   | index          | 172.34 kB |                37.75 kB
- chunk-Y6PGONWV.js   | dev-routes     |  68.16 kB |                18.93 kB
+ chunk-ZV5KRCBG.js   | dev-routes     |  68.16 kB |                18.93 kB
- chunk-3RHF5AM3.js   | profile-routes |   3.60 kB |                 1.19 kB
+ chunk-UZK5HEOU.js   | profile-routes |   3.60 kB |                 1.19 kB
- chunk-NEWEHOUR.js   | -              |   2.49 kB |               989 bytes
+ chunk-DECPGSL5.js   | -              |   2.50 kB |               989 bytes
- chunk-E4HBBZX6.js   | home-routes    |   2.36 kB |               729 bytes
+ chunk-IAEQRT6N.js   | home-routes    |   2.36 kB |               730 bytes
  chunk-555O5GCI.js   | -              |   1.06 kB |               477 bytes
```

They would have to:

- Http Requests: 4
- Bytes: 22329.52668

That's about a ~4000% increase in bytes transferred, and quadrupling of http requests.

> **Note** Changing a package in `node_modules` is the same, but usually impacts every bundle.
