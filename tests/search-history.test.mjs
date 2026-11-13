// Tests de l'historique des recherches récentes (stockage injecté, pas besoin de navigateur).
import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {addRecent, clearRecent, loadRecent, MAX_RECENT, rememberRecent} from '../src/theme/SearchBar/history.ts';

const fakeStorage = (initial = {}) => {
  const data = {...initial};
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: (key) => { delete data[key]; },
  };
};
const brokenStorage = () => ({
  getItem() { throw new Error('refusé'); },
  setItem() { throw new Error('refusé'); },
  removeItem() { throw new Error('refusé'); },
});

describe('addRecent', () => {
  it('place la requête la plus récente en tête', () => {
    assert.deepEqual(addRecent(['cron'], 'ssl'), ['ssl', 'cron']);
  });

  it('nettoie les espaces et ignore une requête vide', () => {
    assert.deepEqual(addRecent(['cron'], '  ssl  '), ['ssl', 'cron']);
    assert.deepEqual(addRecent(['cron'], '   '), ['cron']);
  });

  it('retire le doublon sans tenir compte de la casse', () => {
    assert.deepEqual(addRecent(['ssl', 'cron'], 'CRON'), ['CRON', 'ssl']);
  });

  it(`garde au plus ${MAX_RECENT} recherches`, () => {
    let list = [];
    for (const q of ['a', 'b', 'c', 'd', 'e', 'f']) list = addRecent(list, q);
    assert.deepEqual(list, ['f', 'e', 'd', 'c', 'b']);
  });
});

describe('stockage', () => {
  it('enregistre puis relit les recherches', () => {
    const storage = fakeStorage();
    rememberRecent('wordpress', storage);
    rememberRecent('cron', storage);
    assert.deepEqual(loadRecent(storage), ['cron', 'wordpress']);
  });

  it('vide l\'historique', () => {
    const storage = fakeStorage();
    rememberRecent('cron', storage);
    clearRecent(storage);
    assert.deepEqual(loadRecent(storage), []);
  });

  it('ignore un contenu corrompu ou inattendu', () => {
    assert.deepEqual(loadRecent(fakeStorage({'o2switch-docs:recent-searches': '{pas du json'})), []);
    assert.deepEqual(loadRecent(fakeStorage({'o2switch-docs:recent-searches': '{"a":1}'})), []);
    assert.deepEqual(loadRecent(fakeStorage({'o2switch-docs:recent-searches': '["ok",3,null]'})), ['ok']);
  });

  it('ne plante pas quand le stockage est inaccessible', () => {
    const storage = brokenStorage();
    assert.deepEqual(loadRecent(storage), []);
    assert.doesNotThrow(() => rememberRecent('cron', storage));
    assert.doesNotThrow(() => clearRecent(storage));
  });

  it('ne plante pas sans stockage disponible', () => {
    assert.deepEqual(loadRecent(null), []);
    assert.doesNotThrow(() => rememberRecent('cron', null));
  });
});
