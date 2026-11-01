import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync, existsSync} from 'node:fs';
import {resolve, extname, sep} from 'node:path';
import {pathToFileURL} from 'node:url';

const build = process.env.LIBRARY_BROWSER_BUILD;
const playwrightModule = process.env.PLAYWRIGHT_MODULE;

test('artifact selection, copy, incompatible recipes and compact repository fallback in a browser', {
    skip: !build || !playwrightModule ? 'Set LIBRARY_BROWSER_BUILD and PLAYWRIGHT_MODULE to run browser tests' : false,
    timeout: 90000
}, async () => {
    const {chromium} = await import(pathToFileURL(playwrightModule).href);
    const root = resolve(build);
    const server = createServer((request, response) => {
        const path = resolve(root, `.${new URL(request.url, 'http://localhost').pathname}`);
        const file = path.endsWith(sep) || !extname(path) ? resolve(path, 'index.html') : path;
        if (!file.startsWith(root + sep) || !existsSync(file)) { response.writeHead(404).end(); return; }
        response.setHeader('Content-Type', {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css'}[extname(file)] || 'application/octet-stream');
        response.end(readFileSync(file));
    });
    await new Promise(done => server.listen(0, '127.0.0.1', done));
    const base = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch({headless: true});
    const errors = [];
    const groupId = 'com.github.JNightRider.jMe3GL2';
    const coordinate = artifactId => ({groupId, artifactId, version: 'be9f71682e4b92776665b95cddc177b4e6a0ac24'});
    const recipe = artifact => `repositories {\n    mavenCentral()\n}\n\ndependencies {\n    implementation("${artifact.groupId}:${artifact.artifactId}:${artifact.version}")\n}`;
    const artifacts = ['jMe3GL2-core', 'jMe3GL2-jawt', 'jMe3GL2-plugins', 'jMe3GL2-dyn4j'].map(coordinate);
    const fixture = {
        githubRepositoryId: 623238695, snapshotId: 2536, displayName: 'jMe3GL2', name: 'jMe3GL2', owner: 'JNightRider',
        repositoryUrl: 'https://github.com/JNightRider/jMe3GL2', description: 'A community module.',
        readmeIncluded: true, readmeMarkdown: '# jMe3GL2\n\nUsage documentation.',
        moderationState: 'AUTO', processingStatus: 'COMPLETED', visibilityDecision: 'LISTED',
        publication: {listed: true, snapshotId: 2536}, topics: [], images: [], funding: [], compatibility: {},
        stars: 10, likes: 0, artifacts, rootArtifact: artifacts[0], gradleSnippet: recipe(artifacts[0]),
        installation: {status: 'AVAILABLE'},
        installationOptions: [...artifacts.map(artifact => ({artifact, target: 'JVM', gradleSnippet: recipe(artifact)})),
            {artifact: coordinate('android'), target: 'ANDROID', gradleSnippet: recipe(coordinate('android'))}],
        score: {score: 76, confidence: 60, decision: 'LISTED', hardGateFailures: [], breakdown: [], warnings: []}
    };
    async function open(changes = {}) {
        const item = {...structuredClone(fixture), ...changes};
        const context = await browser.newContext({viewport: {width: 1280, height: 1000}});
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'clipboard', {value: {writeText: async text => { window.copiedSnippet = text; }}});
        });
        await context.route(url => url.origin !== base && url.hostname !== 'bknd01.jmonkeyengine.org', route => route.abort());
        await context.route('https://bknd01.jmonkeyengine.org/**', route => {
            const url = new URL(route.request().url());
            const headers = {'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true'};
            let body = item, status = 200;
            if (url.pathname === '/admin/session') { body = {message: 'Login required'}; status = 401; }
            else if (url.pathname.endsWith('/snapshots')) body = {latestSnapshotId: 2536, items: []};
            else if (url.pathname.endsWith('/tags')) body = {items: []};
            else if (url.pathname.endsWith('/stats')) body = {modules: 1, developers: 1};
            else if (url.pathname === '/api/extensions') body = {items: [item], page: 0, totalPages: 1, totalItems: 1};
            return route.fulfill({status, headers, contentType: 'application/json', body: JSON.stringify(body)});
        });
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`${base}/library/?module=${item.githubRepositoryId}&snapshot=latest`);
        await page.locator('.library-detail-header h1').waitFor();
        return {context, page};
    }
    try {
        const {context, page} = await open();
        const install = page.locator('.library-install');
        const inputs = install.getByRole('checkbox');
        assert.equal(await inputs.count(), 5);
        assert.equal(await inputs.nth(0).isChecked(), true);
        assert.equal((await install.locator('code').last().textContent()).match(/implementation\(/g).length, 1);
        for (let index = 1; index < 4; index++) await inputs.nth(index).check();
        const combined = await install.locator('pre code').textContent();
        for (const artifact of artifacts) assert.ok(combined.includes(artifact.artifactId));
        assert.equal(combined.match(/implementation\(/g).length, 4);
        await install.getByRole('button', {name: 'Copy Gradle snippet'}).click();
        assert.equal(await page.evaluate(() => window.copiedSnippet), combined);
        await inputs.nth(4).check();
        await install.getByText('Choose artifacts that support the same platform.', {exact: true}).waitFor();
        assert.equal(await install.locator('pre').isVisible(), false);
        assert.equal(await install.getByRole('button', {name: 'Copy Gradle snippet'}).count(), 0);
        for (let index = 0; index < 4; index++) await inputs.nth(index).uncheck();
        assert.equal(await install.locator('pre').isVisible(), true);
        assert.match(await install.locator('pre code').textContent(), /:android:/);
        assert.doesNotMatch(await install.locator('pre code').textContent(), /jMe3GL2-core/);
        await inputs.nth(4).uncheck();
        assert.equal(await install.getByRole('button', {name: 'Copy Gradle snippet'}).count(), 0);
        await inputs.nth(0).focus();
        await page.keyboard.press('Space');
        assert.equal(await inputs.nth(0).isChecked(), true);
        await page.setViewportSize({width: 390, height: 844});
        assert.equal(await install.evaluate(element => element.scrollWidth <= element.clientWidth + 1), true);
        if (process.env.LIBRARY_BROWSER_SCREENSHOT) {
            await page.screenshot({path: `${process.env.LIBRARY_BROWSER_SCREENSHOT}-artifacts.png`, fullPage: true});
        }
        await context.close();

        for (const readmeMarkdown of ['# Renthyl', '']) {
            const broken = await open({repositoryUrl: 'https://github.com/codex128/Renthyl', readmeMarkdown,
                gradleSnippet: null, installationOptions: [], installation: {status: 'UNAVAILABLE', note: 'Internal resolution detail'},
                analysisErrors: ['Unfrozen runtime dependency com.github.codex128:Boost:dd2f4b856d']});
            const fallback = broken.page.locator('.library-install-fallback');
            const link = fallback.getByRole('link', {name: 'See the repository for installation and usage instructions'});
            assert.equal(await link.getAttribute('href'), `https://github.com/codex128/Renthyl${readmeMarkdown ? '#readme' : ''}`);
            assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
            assert.equal(await fallback.locator('.library-copy-button, pre').count(), 0);
            assert.doesNotMatch(await fallback.textContent(), /Unfrozen|Internal resolution|Install recipe unavailable/);
            assert.notEqual(await link.evaluate(element => getComputedStyle(element).borderTopColor), 'rgba(0, 0, 0, 0)');
            if (readmeMarkdown && process.env.LIBRARY_BROWSER_SCREENSHOT) {
                await broken.page.screenshot({path: `${process.env.LIBRARY_BROWSER_SCREENSHOT}-fallback.png`, fullPage: true});
            }
            await broken.context.close();
        }
        if (process.env.LIBRARY_BROWSER_FIXTURES) {
            const directory = process.env.LIBRARY_BROWSER_FIXTURES;
            const actual = await open(JSON.parse(readFileSync(resolve(directory, 'jme3gl2.json'), 'utf8')));
            const actualInstall = actual.page.locator('.library-install');
            const actualInputs = actualInstall.getByRole('checkbox');
            assert.equal(await actualInputs.count(), 4);
            for (let index = 0; index < 4; index++) await actualInputs.nth(index).check();
            assert.equal((await actualInstall.locator('pre code').textContent()).match(/implementation\(/g).length, 4);
            assert.equal(await actualInstall.locator('.library-install-selection-message').isVisible(), false);
            assert.doesNotMatch(await actualInstall.locator('pre code').textContent(), /:samples:/);
            await actual.context.close();
            const renthyl = await open(JSON.parse(readFileSync(resolve(directory, 'renthyl.json'), 'utf8')));
            const instructions = renthyl.page.locator('.library-install-fallback a');
            await instructions.waitFor();
            assert.equal(await instructions.getAttribute('href'), 'https://github.com/codex128/Renthyl#readme');
            assert.equal(await renthyl.page.locator('.library-install pre, .library-install .library-copy-button').count(), 0);
            await renthyl.context.close();
        }
        assert.deepEqual(errors, []);
    } finally {
        await browser.close();
        await new Promise(done => server.close(done));
    }
});
