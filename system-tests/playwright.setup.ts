// playwright.setup.ts
import { test as testBase } from '@playwright/test';
import { createNetworkFixture, type NetworkFixture } from '@msw/playwright';
import { handlers } from '../src/app/__mocks__/handlers';

interface Fixtures {
  network: NetworkFixture;
}

export const test = testBase.extend<Fixtures>({
  // Create a fixture that will control the network in your tests.
  network: createNetworkFixture({
    initialHandlers: handlers,
  }),
});
