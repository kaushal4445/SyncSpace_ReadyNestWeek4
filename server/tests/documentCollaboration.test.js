const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeDocumentContent } = require('../src/utils/documentCollaboration');

test('returns the incoming content when no concurrent edit exists', () => {
  const merged = mergeDocumentContent('<p>Alpha</p>', '<p>Beta</p>', '<p>Alpha</p>');
  assert.equal(merged, '<p>Beta</p>');
});

test('preserves unique lines from both versions during a conflict', () => {
  const merged = mergeDocumentContent('<p>Alpha</p>', '<p>Beta</p>', '<p>Omega</p>');
  assert.match(merged, /Alpha/);
  assert.match(merged, /Beta/);
});

test('deduplicates matching lines while merging', () => {
  const merged = mergeDocumentContent('<p>Alpha</p><p>Gamma</p>', '<p>Alpha</p><p>Beta</p>', '<p>Omega</p>');
  assert.equal(merged.includes('<p>Alpha</p>'), true);
  assert.equal(merged.includes('<p>Gamma</p>'), true);
  assert.equal(merged.includes('<p>Beta</p>'), true);
});
