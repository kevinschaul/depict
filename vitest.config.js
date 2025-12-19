import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: false,
        environment: 'node',
        testTimeout: 30000,
        hookTimeout: 30000,
        teardownTimeout: 10000,
        isolate: true,
        reporters: ['verbose']
    }
});
