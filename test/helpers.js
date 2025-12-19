import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Start a simple HTTP server to serve test fixtures
 * @param {number} port - Port to listen on
 * @returns {Promise<{server: http.Server, url: string, close: Function}>}
 */
export async function startTestServer(port = 3000) {
    const fixturesDir = path.join(__dirname, 'fixtures');

    const server = http.createServer((req, res) => {
        let filePath = path.join(fixturesDir, req.url === '/' ? 'test-page.html' : req.url);

        // Security: prevent directory traversal
        if (!filePath.startsWith(fixturesDir)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not found');
                return;
            }

            const ext = path.extname(filePath);
            const contentType = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.png': 'image/png',
                '.jpg': 'image/jpeg'
            }[ext] || 'text/plain';

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });

    await new Promise((resolve) => {
        server.listen(port, resolve);
    });

    return {
        server,
        url: `http://localhost:${port}`,
        close: () => new Promise((resolve) => server.close(resolve))
    };
}

/**
 * Check if a file exists
 * @param {string} filePath
 * @returns {boolean}
 */
export function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch {
        return false;
    }
}

/**
 * Delete a file if it exists
 * @param {string} filePath
 */
export function deleteFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        // Ignore errors
    }
}

/**
 * Get file size in bytes
 * @param {string} filePath
 * @returns {number}
 */
export function getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size;
}
