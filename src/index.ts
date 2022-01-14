import * as fs from 'node:fs';

import {sep, resolve, posix, join} from 'node:path';

import * as fa from 'node:fs/promises';

interface OptionsParameters {
  excludedDirs?: string[];
  isExcludedDir?: (dir: string) => boolean;
  resolve?: boolean;
}

/**
 * @private
 *
 * @description a function to replace window's path separator to unix like separator '/'
 * and also remove ending separator to standardized path.
 *
 * @param {string} path a string path like to normalize
 * @returns normalized path (unix style)
 */
const normalizeOpSysPath = (path: string) => path.replace(/\\/g, '/').replace(/(\/|\\)$/g, '');

/**
 * @private
 *
 * @description Helper function to check wether a given list of filepaths are included in
 * searching directory
 *
 * @param excludedPaths list of directories to be excluded
 * @param reference root reference of searching directory
 * @returns boolean
 */
const isDirInList = (excludedPaths: string[] | undefined, reference: string) =>
  excludedPaths
    ? excludedPaths
      .map(normalizeOpSysPath)
      .map((s: string) => {
        console.log(normalizeOpSysPath(reference) === s, normalizeOpSysPath(reference), '/', s);
        return s;
      })
      .includes(normalizeOpSysPath(reference))
    : false;

/**
 * @private
 *
 * @description helper function to return absolute or relative filename
 * @param filename
 * @param useAbsoluteRute
 * @returns a normalized filename, if useAbsoluteRoute it will return an absolute filename otherwise
 *  it will return filename unmodify
 */
const normalizeDirname = (filename: string, useAbsoluteRute?: boolean) => useAbsoluteRute ? resolve(filename) : filename;

/**
 * @private
 *
 * @description helper function to determine if a dirname is skip or not according to options
 * @param dirname
 * @param options
 * @returns {boolean} true if found as excluded
 */
const isExcluded = (dirname: string, options?: OptionsParameters) => {
  if (options?.isExcludedDir?.(dirname)) {
    return true;
  }

  if (isDirInList(options?.excludedDirs, dirname)) {
    return true;
  }

  return false;
};

/**
 * @private
 *
 * @description traverse function to walk through all file directories
 * @param dirname root dirname to look
 * @param options  <OptionsParameters>
 * @returns Generator
 */
const traverseSync = function * (dirname: string, options?: OptionsParameters): Generator {
  if (isExcluded(dirname, options)) {
    return;
  }

  const direntList = fs.readdirSync(dirname, {withFileTypes: true});
  for (const dirent of direntList) {
    const filename = join(dirname, posix.normalize(dirent.name));

    if (dirent.isDirectory()) {
      yield * traverseSync(join(filename, sep), options);
    } else {
      yield filename;
    }
  }
};

const noop = function (_parameter: unknown) {
  // Do nothing;
};

/**
 * @private
 *
 * @description a notifier will keep track of each async call made to read a dir and will act as a
 * global promise
 * @returns notifier
 */
const notifier = () => {
  let done = false;
  let resolve = noop;
  let reject = noop;

  let notified = new Promise((pResolve, pReject) => {
    resolve = pResolve;
    reject = pReject;
  });

  return {
    resolve() {
      const oldResolve = resolve;
      notified = new Promise((pResolve, pReject) => {
        resolve = pResolve;
        reject = pReject;
      });
      oldResolve(undefined);
    },
    reject(error: NodeJS.ErrnoException) {
      reject(error);
    },
    get done() {
      return done;
    },
    set done(value) {
      done = value;
    },
    async onResolved() {
      return notified;
    },
  };
};

/**
 * @private
 *
 * @description traverse function to walk through all file directories
 * @param dirnames
 * @param filenames
 * @param globalNotifier
 * @param options {OptionsParameters}
 * @returns void
 */
function traverse(dirnames: string[], filenames: string[], globalNotifier: ReturnType<typeof notifier>, options?: OptionsParameters) {
  if (dirnames.length === 0) {
    globalNotifier.done = true;
    return;
  }

  const children: string[] = [];
  let pendingPromises = 0;
  for (const dirname of dirnames) {
    if (isExcluded(dirname, options)) {
      continue;
    }

    pendingPromises++;
    fs.readdir(dirname, {withFileTypes: true}, (error, dirents) => {
      error && globalNotifier.reject(error);

      for (const dirent of dirents) {
        const filename = join(dirname, dirent.name);

        if (dirent.isDirectory()) {
          children.push(filename);
        } else {
          filenames.push(filename);
        }
      }

      globalNotifier.resolve();

      if (--pendingPromises === 0) {
        traverse(children, filenames, globalNotifier, options);
      }
    });
  }

  if (pendingPromises === 0) {
    globalNotifier.done = true;
  }
}

/**
 * @public
 *
 * @description synchronous function to get all file names from a given entry point
 * @param {string} filename entry point path to look for files
 * @param {OptionsParameters} options wether to use absolute or relative paths and excluded dirs
 * @returns {Iterator} an Iterator with a .toString() helper function to return a list of filenames
 */
export const getAllFilesSync = (filename: string, options?: OptionsParameters) => {
  const files = {
    * [Symbol.iterator]() {
      if (!fs.lstatSync(filename).isDirectory()) {
        yield filename;
        return;
      }

      yield * (traverseSync)(normalizeDirname(filename, options?.resolve), options);
    },
    toArray: () => [...files] as string[],
  };

  return files;
};

/**
 * @public
 *
 * @async
 * @description asynchronous function to get all file names from a given entry point
 * @param {string} filename entry point path to look for files
 * @param {OptionsParameters} options wether to use absolute or relative paths and excluded dirs
 * @returns {Iterator} an Iterator with a .toString() helper function to return a list of filenames
 */
export const getAllFiles = (filename: string, options?: OptionsParameters) => {
  const files = {
    async * [Symbol.asyncIterator]() {
      const {isDirectory} = await fa.lstat(filename);
      if (!isDirectory) {
        yield filename;
        return;
      }

      const filenames: string[] = [];
      const globalNotifier = notifier();

      traverse([normalizeDirname(filename, options?.resolve)], filenames, globalNotifier, options);

      do {
        // eslint-disable-next-line no-await-in-loop
        await globalNotifier.onResolved();
        while (filenames.length > 0) {
          yield filenames.pop();
        }
      } while (!globalNotifier.done);
    },
    toArray: async () => {
      const filenames = [];
      for await (const filename of files) {
        filenames.push(filename);
      }

      return filenames;
    },
  };
  return files;
};

