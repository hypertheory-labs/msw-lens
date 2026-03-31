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
