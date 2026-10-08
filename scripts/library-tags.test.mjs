import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../static/js/library.js', import.meta.url), 'utf8');
const filter = source.match(/function visibleCategoryTags\(\) \{([\s\S]*?)\n  \}/)[0];

test('category chips retain backend order after generic topics are hidden', () => {
    const availableTags = [
        {name: 'java', count: 100, totalStars: 500},
        {name: 'z-popular', count: 5, totalStars: 100},
        {name: 'a-less-popular', count: 5, totalStars: 10},
        {name: 'physics', count: 1, totalStars: 1000}
    ];
    const result = vm.runInNewContext(`${filter}; visibleCategoryTags()`, {
        state: {availableTags}, hiddenTopics: new Set(['java'])
    });
    assert.deepEqual(Array.from(result, tag => tag.name), ['z-popular', 'a-less-popular', 'physics']);
    assert.equal(availableTags[0].name, 'java');
});
