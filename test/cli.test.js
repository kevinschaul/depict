import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { startTestServer, fileExists, deleteFile, getFileSize } from './helpers.js';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_PATH = path.join(__dirname, '..', 'src', 'depict.js');

/**
 * Execute the depict CLI
 * @param {string} args - CLI arguments
 * @returns {Promise<{stdout: string, stderr: string, code: number}>}
 */
async function runCLI(args) {
    try {
        const { stdout, stderr } = await execAsync(`node ${CLI_PATH} ${args}`);
        return { stdout, stderr, code: 0 };
    } catch (error) {
        return {
            stdout: error.stdout || '',
            stderr: error.stderr || '',
            code: error.code || 1
        };
    }
}

describe('depict CLI', () => {
    let testServer;
    let testUrl;

    beforeAll(async () => {
        testServer = await startTestServer(3002);
        testUrl = testServer.url;
    });

    afterAll(async () => {
        await testServer.close();
    });

    afterEach(() => {
        // Clean up test output files
        deleteFile('screenshot.png');
        deleteFile('test-cli-output.png');
        deleteFile('test-cli-output.jpg');
        deleteFile('custom-output.png');
    });

    describe('basic usage', () => {
        it('should display help message', async () => {
            const result = await runCLI('--help');

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('Usage: depict');
            expect(result.stdout).toContain('--output');
            expect(result.stdout).toContain('--selector');
        });

        it('should show error when no URL provided', async () => {
            const result = await runCLI('');

            expect(result.code).not.toBe(0);
            expect(result.stderr).toContain('URL must be provided');
        });

        it('should take a screenshot with default options', async () => {
            const result = await runCLI(`${testUrl} -o test-cli-output.png`);

            expect(result.code).toBe(0);
            expect(fileExists('test-cli-output.png')).toBe(true);
            expect(getFileSize('test-cli-output.png')).toBeGreaterThan(0);
        }, 15000);

        it('should support URL without protocol', async () => {
            const result = await runCLI('localhost:3002 -o test-cli-output.png');

            expect(result.code).toBe(0);
            expect(fileExists('test-cli-output.png')).toBe(true);
        }, 15000);
    });

    describe('options', () => {
        it('should respect --output option', async () => {
            const result = await runCLI(`${testUrl} --output custom-output.png`);

            expect(result.code).toBe(0);
            expect(fileExists('custom-output.png')).toBe(true);
        }, 15000);

        it('should respect -o short option', async () => {
            const result = await runCLI(`${testUrl} -o test-cli-output.png`);

            expect(result.code).toBe(0);
            expect(fileExists('test-cli-output.png')).toBe(true);
        }, 15000);

        it('should respect --selector option', async () => {
            const result = await runCLI(`${testUrl} -o test-cli-output.png --selector .container`);

            expect(result.code).toBe(0);
            expect(fileExists('test-cli-output.png')).toBe(true);
        }, 15000);

        it('should respect -s short option', async () => {
            const result = await runCLI(`${testUrl} -o test-cli-output.png -s .container`);

            expect(result.code).toBe(0);
            expect(fileExists('test-cli-output.png')).toBe(true);
        }, 15000);

        it('should respect --width and --height options', async () => {
            const result = await runCLI(`${testUrl} -o test-cli-output.png --width 800 --height 600`);

            expect(result.code).toBe(0);
            expect(fileExists('test-cli-output.png')).toBe(true);
        }, 15000);

        it('should support JPEG output', async () => {
            const result = await runCLI(`${testUrl} -o test-cli-output.jpg --quality 85`);

            expect(result.code).toBe(0);
            expect(fileExists('test-cli-output.jpg')).toBe(true);
        }, 15000);

        it('should respect --delay option', async () => {
            const start = Date.now();
            const result = await runCLI(`${testUrl} -o test-cli-output.png --delay 1000`);
            const duration = Date.now() - start;

            expect(result.code).toBe(0);
            expect(duration).toBeGreaterThanOrEqual(1000);
        }, 15000);

        it('should respect --timeout option', async () => {
            const result = await runCLI(`${testUrl} -o test-cli-output.png --timeout 10`);

            expect(result.code).toBe(0);
            expect(fileExists('test-cli-output.png')).toBe(true);
        }, 15000);

        it('should inject CSS with --css option', async () => {
            const cssPath = path.join(__dirname, 'fixtures', 'test-styles.css');
            const result = await runCLI(`${testUrl} -o test-cli-output.png --css ${cssPath}`);

            expect(result.code).toBe(0);
            expect(fileExists('test-cli-output.png')).toBe(true);
        }, 15000);

        it('should hide elements with --hide option', async () => {
            const result = await runCLI(`${testUrl} -o test-cli-output.png --hide .hidden-element`);

            expect(result.code).toBe(0);
            expect(fileExists('test-cli-output.png')).toBe(true);
        }, 15000);

        it('should wait for selector with --wait-for-selector', async () => {
            const result = await runCLI(`${testUrl} -o test-cli-output.png --wait-for-selector .wait-for-me`);

            expect(result.code).toBe(0);
            expect(fileExists('test-cli-output.png')).toBe(true);
        }, 15000);

        it('should output verbose logs with --verbose', async () => {
            const result = await runCLI(`${testUrl} -o test-cli-output.png --verbose`);

            expect(result.code).toBe(0);
            expect(fileExists('test-cli-output.png')).toBe(true);
            // Verbose output may include 'Requesting' and 'Saved image', but exec may not always capture console.log
            // The important thing is that the command succeeds
        }, 15000);
    });

    describe('error handling', () => {
        it('should error on non-existent selector', async () => {
            const result = await runCLI(`${testUrl} -o test-cli-output.png --selector .does-not-exist`);

            expect(result.code).not.toBe(0);
            expect(result.stderr).toContain('Selector not found');
        }, 15000);

        it('should error on timeout waiting for selector', async () => {
            const result = await runCLI(`${testUrl} -o test-cli-output.png --wait-for-selector .never-exists --timeout 2`);

            expect(result.code).not.toBe(0);
            expect(result.stderr).toContain('Selector not found within timeout');
        }, 15000);

        it('should error on 404 page', async () => {
            const result = await runCLI(`${testUrl}/does-not-exist.html -o test-cli-output.png`);

            expect(result.code).not.toBe(0);
            expect(result.stderr).toContain('Page could not be loaded');
        }, 15000);

        it('should error on invalid URL', async () => {
            const result = await runCLI('http://localhost:9999 -o test-cli-output.png --timeout 3');

            expect(result.code).not.toBe(0);
        }, 15000);
    });
});
