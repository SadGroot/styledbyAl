import * as migration_20261018_162813_initial from './20261018_162813_initial';
import * as migration_20261018_163757_preview_edition from './20261018_163757_preview_edition';

export const migrations = [
  {
    up: migration_20261018_162813_initial.up,
    down: migration_20261018_162813_initial.down,
    name: '20261018_162813_initial',
  },
  {
    up: migration_20261018_163757_preview_edition.up,
    down: migration_20261018_163757_preview_edition.down,
    name: '20261018_163757_preview_edition'
  },
];
