import { AsyncLocalStorage } from 'node:async_hooks';
import type {
  RandomSource,
  RandomSourceRunner,
} from '../../../src/headless/adapters/randomSource.js';

const randomSourceContext = new AsyncLocalStorage<RandomSource>();
const nativeRandom = Math.random.bind(Math);

// Install one stable dispatcher; AsyncLocalStorage selects the source per async request.
Math.random = () => randomSourceContext.getStore()?.next() ?? nativeRandom();

export const serverRandomSourceScope: RandomSourceRunner = {
  runSync<T>(source: RandomSource, run: () => T): T {
    return randomSourceContext.run(source, run);
  },
  runAsync<T>(source: RandomSource, run: () => T | Promise<T>): Promise<T> {
    return Promise.resolve(randomSourceContext.run(source, run));
  },
};
