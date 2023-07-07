import { Container, Route, Logging } from './registry.mjs'
import http from 'node:http'
export class ActiveObjectServer extends Container {
    constructor() {
        super();
        const server = http.createServer();
        this.dependency({
            logging: {
                Logging,
                ctorArgs: {
                    logLevel: 'info'
                }
            },
            server
        });
        server.on("request", (request, response) => {
            const path = request.url.toLowerCase();
            const headers = request.headers;
            headers['token'] = process.env.GIT;
            let content = '';
            request.on('data', (chunk) => content += chunk);
            request.on('end', async () => {
                const { statusCode, statusMessage, responseContent, contentType } = await this.handlRequest({ path, content, token: headers.token });
                response.writeHead(statusCode, statusMessage, {
                    'Content-Length': Buffer.byteLength(responseContent),
                    'Content-Type': contentType
                });
                response.end(responseContent);
            });
        });
    }
    async start() {
        const port = process.env.PORT || 80;
        this.server.listen(port, async () => {
            await this.logging.log({ message: `server is listening on port ${port}` })
        });
    }
    async handlRequest({ path, content, token }) {
        this.dependency({
            Route,
            ctorArgs: {
                path,
                content,
                token
            }
        });
        return await this.route.handle();
    }
}