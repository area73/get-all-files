import fs from 'node:fs';
import {posix} from 'node:path';
import test from 'ava';
import {getAllFiles, getAllFilesSync} from '../src/index.js';

const fixtures = posix.normalize('./test/fixtures/');
const fixturesBlahUnreal = posix.normalize('./test/fixtures/blah/unreal/');

const isInList
  = (...dirs:string[]) =>
    (name:string) => {
      const normalizedDirs = dirs.map(dir => dir.replace(/\\/g, '/'));
      const normalizedName = name.replace(/\\/g, '/');
      return normalizedDirs.includes(normalizedName);
    };




test('sync finds 8 files', t => {
  let count = 0;

  for (const filename of getAllFilesSync(fixtures)) {
    t.assert(fs.existsSync(filename));
    count++;
  }

  t.is(count, 8);
});

test('sync array finds 8 files', t => {
  t.is(getAllFilesSync(fixtures).toArray().length, 8);
});

test('async finds 8 files', async t => {
  let count = 0;

  for await (const filename of getAllFiles(fixtures)) {
    await fs.promises.access(filename);
    count++;
  }

  t.is(count, 8);
});

test('async array finds 8 files', async t => {
  t.is((await getAllFiles(fixtures).toArray()).length, 8);
});

test('async array finds 6 files, excluding a directory', async t => {
  t.is(
    (
      await getAllFiles(fixtures, {
        isExcludedDir: isInList('test/fixtures/blah/unreal/woah/'),
      }).toArray()
    ).length,
    6,
  );
});

test('async array finds 2 files, excluding all directories with 2 files in the root folder', async t => {
  t.is(
    (
      await getAllFiles(fixtures, {
        isExcludedDir: isInList('test/fixtures/blah/'),
      }).toArray()
    ).length,
    2,
  );
});

test('async array finds 0 files, excluding all directories and no files in the root folder', async t => {
  t.is(
    (
      await getAllFiles(fixturesBlahUnreal, {
        isExcludedDir: isInList(
          'test/fixtures/blah/unreal/woah/',
          'test/fixtures/blah/unreal/foo/',
        ),
      }).toArray()
    ).length,
    0,
  );
});
