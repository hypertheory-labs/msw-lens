import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

async function enableMocking() {
  if (environment.addMsw) {
    const { worker } = await import('./app/__mocks__/browser');
    console.info('Starting the mock service worker since you are in development mode.');
    return await worker.start({
      quiet: true, // be quiet. don't log out a bunch of stuff to the console.
      onUnhandledRequest: 'bypass', // if I don't have fake handler, just really send the request.
    });
  }
  return;
}
enableMocking().then(() => bootstrapApplication(App, appConfig).catch((err) => console.error(err)));
