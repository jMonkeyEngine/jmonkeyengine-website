import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../static/js/library.js', import.meta.url), 'utf8');
const names = ['safeUrl', 'installationTargets', 'installationRecipes', 'installationRecipeLabel',
    'installationRepositoryUrl', 'combineInstallationRecipes'];
const context = vm.createContext({URL});
for (const name of names) {
    const match = source.match(new RegExp(`function ${name}\\([^]*?\\n  \\}`));
    assert.ok(match, name);
    vm.runInContext(match[0], context);
}
function call(name, value) {
    context.input = value;
    return JSON.parse(JSON.stringify(vm.runInContext(`${name}(input)`, context)));
}
const central = '    mavenCentral()';
const jitpack = group => `    maven {\n        name = "JitPack"\n        url = uri("https://jitpack.io")\n        content {\n            includeGroup("${group}")\n        }\n    }`;
const github = artifact => `    maven {\n        name = "GitHubPackages_example_project"\n        url = uri("https://maven.pkg.github.com/example/project")\n        credentials {\n            username = providers.environmentVariable("GITHUB_PACKAGES_USERNAME").orNull\n            password = providers.environmentVariable("GITHUB_PACKAGES_TOKEN").orNull\n        }\n        content {\n            includeModule("org.example", "${artifact}")\n        }\n    }`;
function recipe(artifactId, {groupId = 'org.example', version = '1.0', targets = ['JVM'],
    repositories = central, required = []} = {}) {
    return {artifacts: [{groupId, artifactId, version}], targets,
        gradleSnippet: `repositories {\n${repositories}\n}\n\ndependencies {\n${[`${groupId}:${artifactId}:${version}`, ...required]
            .map(value => `    implementation("${value}")`).join('\n')}\n}`};
}

test('all four jMe3GL2 library roots remain visible and can form one snippet', () => {
    const recipes = ['jMe3GL2-core', 'jMe3GL2-jawt', 'jMe3GL2-plugins', 'jMe3GL2-dyn4j'].map(name =>
        recipe(name, {groupId: 'com.github.JNightRider.jMe3GL2', version: 'be9f71682e4b92776665b95cddc177b4e6a0ac24',
            repositories: `${central}\n${jitpack('com.github.JNightRider.jMe3GL2')}`}));
    const options = recipes.map(value => ({artifact: value.artifacts[0], target: 'JVM', gradleSnippet: value.gradleSnippet}));
    assert.equal(call('installationRecipes', {installationOptions: options}).length, 4);
    const result = call('combineInstallationRecipes', recipes);
    assert.equal((result.gradleSnippet.match(/implementation\(/g) || []).length, 4);
    assert.equal((result.gradleSnippet.match(/mavenCentral\(/g) || []).length, 1);
    assert.equal((result.gradleSnippet.match(/name = "JitPack"/g) || []).length, 1);
    assert.doesNotMatch(result.gradleSnippet, /samples/);
    for (const value of recipes) assert.ok(result.gradleSnippet.includes(value.artifacts[0].artifactId));
});

test('repository filters and verified consumer requirements are merged without being lost', () => {
    const first = recipe('core', {repositories: `${central}\n${github('core')}`, required: ['org.physics:Minie:9.0.1']});
    const second = recipe('tools', {repositories: `${central}\n${github('tools')}`, required: ['org.physics:Minie:9.0.1']});
    const result = call('combineInstallationRecipes', [first, second]).gradleSnippet;
    assert.equal((result.match(/name = "GitHubPackages_example_project"/g) || []).length, 1);
    assert.match(result, /includeModule\("org.example", "core"\)/);
    assert.match(result, /includeModule\("org.example", "tools"\)/);
    assert.match(result, /GITHUB_PACKAGES_USERNAME/);
    assert.match(result, /GITHUB_PACKAGES_TOKEN/);
    assert.equal((result.match(/implementation\("org.physics:Minie:9.0.1"\)/g) || []).length, 1);
});

test('different JitPack content filters are retained in a single repository', () => {
    const result = call('combineInstallationRecipes', [recipe('one', {repositories: `${central}\n${jitpack('org.one')}`}),
        recipe('two', {repositories: `${central}\n${jitpack('org.two')}`})]);
    assert.match(result.gradleSnippet, /includeGroup\("org.one"\)/);
    assert.match(result.gradleSnippet, /includeGroup\("org.two"\)/);
    assert.equal((result.gradleSnippet.match(/url = uri/g) || []).length, 1);
});

test('incompatible platforms, alternative providers and conflicting dependencies cannot be copied together', () => {
    for (const recipes of [
        [recipe('desktop'), recipe('android', {targets: ['ANDROID']})],
        [recipe('windows', {targets: ['WINDOWS']}), recipe('linux', {targets: ['LINUX']})],
        [recipe('zay-es', {groupId: 'com.simsilica'}), recipe('zay-es', {groupId: 'com.github.Simsilica'})],
        [recipe('core'), recipe('core', {version: '2.0'})],
        [recipe('core', {required: ['org.physics:Minie:9.0.1']}), recipe('tools', {required: ['org.physics:Minie:9.0.0']})]
    ]) {
        const result = call('combineInstallationRecipes', recipes);
        assert.equal(result.gradleSnippet, undefined);
        assert.ok(result.message);
    }
});

test('pure Java platform declarations can be combined with Android when they explicitly support it', () => {
    const result = call('combineInstallationRecipes', [recipe('shared', {targets: ['WINDOWS', 'LINUX', 'MACOS', 'ANDROID', 'IOS']}),
        recipe('android', {targets: ['ANDROID']})]);
    assert.equal((result.gradleSnippet.match(/implementation\(/g) || []).length, 2);
});

test('a single recipe remains exact; unknown formats fail closed only when combining', () => {
    const unknown = {...recipe('custom'), gradleSnippet: 'plugins { id("custom") }'};
    assert.equal(call('combineInstallationRecipes', [unknown]).gradleSnippet, unknown.gradleSnippet);
    assert.equal(call('combineInstallationRecipes', [unknown, recipe('tools')]).gradleSnippet, undefined);
    assert.equal(call('combineInstallationRecipes', []).gradleSnippet, undefined);
});

test('README links use only safe GitHub repositories and fall back to the repository when absent', () => {
    const repositoryUrl = 'https://github.com/codex128/Renthyl';
    assert.equal(call('installationRepositoryUrl', {repositoryUrl, readmeMarkdown: '# Renthyl'}), `${repositoryUrl}#readme`);
    assert.equal(call('installationRepositoryUrl', {repositoryUrl, readmeMarkdown: '  '}), repositoryUrl);
    for (const value of ['javascript:alert(1)', 'https://github.com.evil.test/repo', 'https://user:secret@github.com/owner/repo', null]) {
        assert.equal(call('installationRepositoryUrl', {repositoryUrl: value, readmeMarkdown: '# README'}), '');
    }
});

test('unsafe and unavailable options are not revived from the artifact inventory', () => {
    const valid = recipe('core');
    const options = [{artifact: valid.artifacts[0], gradleSnippet: null},
        {artifact: valid.artifacts[0], gradleSnippet: valid.gradleSnippet, platformsKnown: true, platforms: []}];
    assert.deepEqual(call('installationRecipes', {installationOptions: options}), []);
    assert.deepEqual(call('installationRecipes', {artifacts: valid.artifacts}), []);
    assert.deepEqual(call('installationRecipes', {installation: {status: 'UNAVAILABLE'},
        gradleSnippet: valid.gradleSnippet, installationOptions: [{artifact: valid.artifacts[0], gradleSnippet: valid.gradleSnippet}]}), []);
});
