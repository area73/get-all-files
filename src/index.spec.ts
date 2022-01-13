import * as fs from 'node:fs';
import {getAllFilesSync} from './index';

const isExcludedDir = (excludedPaths: string[]) => (reference: string) => excludedPaths.includes(reference);

describe('Getting files synchronously', () => {
  describe('when no options are passed', () => {
    let filesSync: ReturnType <typeof getAllFilesSync>;
    beforeEach(() => {
      const rootDir = './test/fixtures';
      filesSync = getAllFilesSync(rootDir);
    });

    it('should return an object iterator of existing filepaths and those filepaths should exist', () => {
      let fileExist = true;
      for (const filename of filesSync) {
        // TODO fix as string
        fileExist = fs.existsSync(filename as string);
        if (!fileExist) {
          break;
        }
      }

      expect(fileExist).toBe(true);
    });

    it('should return an array with filenames', () => {
      const syncArray = filesSync.toArray();
      expect(syncArray).toBeInstanceOf(Array);
    });

    it('should find 8 files', () => {
      expect(filesSync.toArray().length).toBe(8);
    });
  });

  describe('when passing an options object', () => {
    it('should find 2 files in root dir, excluding one directory', () => {
      const excludedDirs = isExcludedDir(['test/fixtures/blah/']);
      const rootDir = './test/fixtures';
      const filesSync = getAllFilesSync(rootDir, {isExcludedDir: excludedDirs});
      expect(filesSync.toArray().length).toBe(2);
    });

    it('should find 2 files in root dir, excluding one directory with absolute path passing resolve = true in options object', () => {
      const absolutePath = `${__dirname.slice(0, -4)}/test/fixtures/blah/`;
      const excludedDirs = isExcludedDir([absolutePath]);
      const rootDir = './test/fixtures';
      const filesSync = getAllFilesSync(rootDir, {resolve: true, isExcludedDir: excludedDirs});
      expect(filesSync.toArray().length).toBe(2);
    });

    it('should find 0 files in root dir, excluding one directory', () => {
      const excludedDirs = isExcludedDir(['test/fixtures/blah/sort of real/', 'test/fixtures/blah/unreal/']);
      const rootDir = './test/fixtures/blah';
      const filesSync = getAllFilesSync(rootDir, {isExcludedDir: excludedDirs});
      expect(filesSync.toArray().length).toBe(0);
    });
  });
});
