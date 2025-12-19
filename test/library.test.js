import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { depict } from '../src/index.js';
import { startTestServer, fileExists, deleteFile, getFileSize } from './helpers.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('depict library API', () => {
    let testServer;
    let testUrl;

    beforeAll(async () => {
        testServer = await startTestServer(3001);
        testUrl = testServer.url;
    });

    afterAll(async () => {
        await testServer.close();
    });

    afterEach(() => {
        // Clean up test output files
        deleteFile('test-output.png');
        deleteFile('test-output.jpg');
        deleteFile('test-screenshot.png');
    });

    describe('basic functionality', () => {
        it('should take a screenshot with default options', async () => {
            const output = 'test-output.png';

            await depict(testUrl, { output });

            expect(fileExists(output)).toBe(true);
            expect(getFileSize(output)).toBeGreaterThan(0);
        });

        it('should take a screenshot without protocol prefix', async () => {
            const output = 'test-output.png';

            await depict('localhost:3001', { output });

            expect(fileExists(output)).toBe(true);
        });

        it('should respect custom viewport dimensions', async () => {
            const output1 = 'test-output.png';
            const output2 = 'test-output-large.png';

            await depict(testUrl, {
                output: output1,
                width: 800,
                height: 600
            });

            await depict(testUrl, {
                output: output2,
                width: 1920,
                height: 1080
            });

            expect(fileExists(output1)).toBe(true);
            expect(fileExists(output2)).toBe(true);

            // Different viewport sizes should produce different file sizes
            const size1 = getFileSize(output1);
            const size2 = getFileSize(output2);
            expect(size1).not.toBe(size2);

            deleteFile(output2);
        });

        it('should support JPEG output with quality setting', async () => {
            const output = 'test-output.jpg';

            await depict(testUrl, {
                output,
                quality: 80
            });

            expect(fileExists(output)).toBe(true);
            expect(getFileSize(output)).toBeGreaterThan(0);
        });
    });

    describe('selectors', () => {
        it('should screenshot a specific element', async () => {
            const output1 = 'test-output.png';
            const output2 = 'test-output-container.png';

            await depict(testUrl, {
                output: output1,
                selector: 'body'
            });

            await depict(testUrl, {
                output: output2,
                selector: '.container'
            });

            expect(fileExists(output1)).toBe(true);
            expect(fileExists(output2)).toBe(true);

            // Container should be smaller than full body
            const size1 = getFileSize(output1);
            const size2 = getFileSize(output2);
            expect(size2).toBeLessThan(size1);

            deleteFile(output2);
        });

        it('should throw error for non-existent selector', async () => {
            const output = 'test-output.png';

            await expect(
                depict(testUrl, {
                    output,
                    selector: '.does-not-exist'
                })
            ).rejects.toThrow('Selector not found');
        });

        it('should wait for selector before taking screenshot', async () => {
            const output = 'test-output.png';

            await depict(testUrl, {
                output,
                waitForSelector: '.wait-for-me',
                timeout: 5000
            });

            expect(fileExists(output)).toBe(true);
        });

        it('should timeout when waiting for non-existent selector', async () => {
            const output = 'test-output.png';

            await expect(
                depict(testUrl, {
                    output,
                    waitForSelector: '.never-exists',
                    timeout: 2000
                })
            ).rejects.toThrow('Selector not found within timeout');
        }, 10000);
    });

    describe('CSS manipulation', () => {
        it('should inject CSS from file', async () => {
            const output = 'test-output.png';
            const cssPath = path.join(__dirname, 'fixtures', 'test-styles.css');

            await depict(testUrl, {
                output,
                css: cssPath
            });

            expect(fileExists(output)).toBe(true);
        });

        it('should inject multiple CSS files', async () => {
            const output = 'test-output.png';
            const cssPath = path.join(__dirname, 'fixtures', 'test-styles.css');

            await depict(testUrl, {
                output,
                css: `${cssPath},${cssPath}`
            });

            expect(fileExists(output)).toBe(true);
        });

        it('should hide elements with hide option', async () => {
            const output = 'test-output.png';

            await depict(testUrl, {
                output,
                hide: '.hidden-element'
            });

            expect(fileExists(output)).toBe(true);
        });
    });

    describe('error handling', () => {
        it('should handle invalid URLs', async () => {
            const output = 'test-output.png';

            await expect(
                depict('http://localhost:9999/does-not-exist', {
                    output,
                    timeout: 3000
                })
            ).rejects.toThrow();
        }, 10000);

        it('should handle 404 responses', async () => {
            const output = 'test-output.png';

            await expect(
                depict(`${testUrl}/does-not-exist.html`, {
                    output,
                    timeout: 5000
                })
            ).rejects.toThrow('Page could not be loaded');
        }, 10000);
    });

    describe('options', () => {
        it('should respect delay option', async () => {
            const output = 'test-output.png';
            const start = Date.now();

            await depict(testUrl, {
                output,
                delay: 500
            });

            const duration = Date.now() - start;
            expect(duration).toBeGreaterThanOrEqual(500);
        });

        it('should use default values when options not provided', async () => {
            const output = 'test-screenshot.png';

            await depict(testUrl, { output });

            expect(fileExists(output)).toBe(true);
        });
    });
});
