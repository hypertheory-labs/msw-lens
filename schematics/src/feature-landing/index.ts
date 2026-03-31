import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicsException,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';
import { FeatureLandingSchema } from './schema';

function toTitleCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function addRouteToAppRoutes(name: string, path: string): Rule {
  return (tree: Tree) => {
    const routesPath = 'src/app/app.routes.ts';
    const buffer = tree.read(routesPath);
    if (!buffer) {
      throw new SchematicsException(`Could not read ${routesPath}`);
    }
    const content = buffer.toString();

    const exportName = `${toCamelCase(name)}FeatureRoutes`;
    const newRoute = [
      `  {`,
      `    path: '${path}',`,
      `    loadChildren: () =>`,
      `      import('./areas/${name}/${name}-landing/${name}.routes').then((r) => r.${exportName}),`,
      `  },`,
    ].join('\n');

    // Anchor: insert before the closing of realRoutes (before `\n];\n\nconst devRoutes`)
    const anchor = '\n];\n\nconst devRoutes';
    const anchorIndex = content.indexOf(anchor);
    if (anchorIndex === -1) {
      throw new SchematicsException(
        `Could not find insertion point in ${routesPath}. Expected "const devRoutes" after realRoutes array.`,
      );
    }

    const recorder = tree.beginUpdate(routesPath);
    recorder.insertLeft(anchorIndex, `\n${newRoute}`);
    tree.commitUpdate(recorder);
    return tree;
  };
}

function addNavLink(name: string, path: string, title: string, icon: string): Rule {
  return (tree: Tree) => {
    const appPath = 'src/app/app.ts';
    const buffer = tree.read(appPath);
    if (!buffer) {
      throw new SchematicsException(`Could not read ${appPath}`);
    }
    const content = buffer.toString();

    const newLink = `{ path: '/${path}', title: '${title}', icon: '${icon}' }`;

    // Match the links signal declaration — handles both empty and non-empty arrays
    const emptyPattern = `links = signal<(SectionLink & { icon: IconName })[]>([]);`;
    const emptyIndex = content.indexOf(emptyPattern);

    if (emptyIndex !== -1) {
      // Replace empty array with single item
      const recorder = tree.beginUpdate(appPath);
      recorder.remove(emptyIndex, emptyPattern.length);
      recorder.insertLeft(
        emptyIndex,
        `links = signal<(SectionLink & { icon: IconName })[]>([${newLink}]);`,
      );
      tree.commitUpdate(recorder);
    } else {
      // Array already has items — find `]);` that closes the links signal
      const signalStart = `links = signal<(SectionLink & { icon: IconName })[]>([`;
      const startIndex = content.indexOf(signalStart);
      if (startIndex === -1) {
        throw new SchematicsException(`Could not find links signal in ${appPath}`);
      }
      // Find the closing `]);` after the signal start
      const closePattern = `]);`;
      const closeIndex = content.indexOf(closePattern, startIndex);
      if (closeIndex === -1) {
        throw new SchematicsException(`Could not find closing "])" for links signal in ${appPath}`);
      }
      const recorder = tree.beginUpdate(appPath);
      recorder.insertLeft(closeIndex, `, ${newLink}`);
      tree.commitUpdate(recorder);
    }

    return tree;
  };
}

export function featureLanding(options: FeatureLandingSchema): Rule {
  const name = strings.dasherize(options.name);
  const path = options.path ?? name;
  const title = options.title ?? toTitleCase(name);
  const icon = options.icon ?? 'lucideCircle';

  const templateSource = apply(url('./files'), [
    applyTemplates({
      ...strings,
      name,
      title,
      icon,
      classify: strings.classify,
      camelize: toCamelCase,
    }),
    move(`src/app/areas/${name}`),
  ]);

  return chain([
    mergeWith(templateSource),
    addRouteToAppRoutes(name, path),
    addNavLink(name, path, title, icon),
  ]);
}
