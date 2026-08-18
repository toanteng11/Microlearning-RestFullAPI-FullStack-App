import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

import express, { type Express, type NextFunction, type Request, type Response } from 'express';

const NON_SPA_PREFIXES = ['/api', '/api-docs', '/assets', '/health', '/ready'] as const;

export function assertWebBuild(webDistPath: string): string {
  const resolvedPath = resolve(webDistPath);
  const indexPath = join(resolvedPath, 'index.html');

  if (!existsSync(indexPath)) {
    throw new Error(`React production build is missing index.html at ${resolvedPath}`);
  }

  return resolvedPath;
}

function isSpaNavigation(request: Request): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  if (
    NON_SPA_PREFIXES.some(
      (prefix) => request.path === prefix || request.path.startsWith(`${prefix}/`),
    )
  ) {
    return false;
  }
  if (extname(request.path)) return false;

  const accepts = request.accepts(['html', 'json']);
  return accepts === 'html' || accepts === false;
}

export function registerStaticWeb(app: Express, webDistPath: string): void {
  const resolvedPath = assertWebBuild(webDistPath);
  const indexPath = join(resolvedPath, 'index.html');

  app.use(
    '/assets',
    express.static(join(resolvedPath, 'assets'), {
      fallthrough: true,
      immutable: true,
      index: false,
      maxAge: '1y',
    }),
  );
  app.use(
    express.static(resolvedPath, {
      fallthrough: true,
      index: false,
      maxAge: 0,
      setHeaders(response, filePath) {
        if (filePath.endsWith('index.html')) response.setHeader('Cache-Control', 'no-cache');
      },
    }),
  );
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (!isSpaNavigation(request)) {
      next();
      return;
    }

    response.setHeader('Cache-Control', 'no-cache');
    response.sendFile(indexPath);
  });
}
