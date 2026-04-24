import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

async function enableMocking() {
  if (!environment.addMsw) return;
  const { worker } = await import('./mocks/browser');
  return worker.start({
    quiet: true,
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() =>
  bootstrapApplication(App, appConfig).catch((err) => console.error(err))
);
