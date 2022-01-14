import * as fs from 'node:fs';

import {sep, resolve, posix, join} from 'node:path';

import * as fa from 'node:fs/promises';

interface OptionsParameters {
  isExcludedDir?: (dir: string) => boolean;
  resolve?: boolean;
}

const normalizeDirname = (filename: string, useAbsoluteRute?: boolean) => useAbsoluteRute ? resolve(filename) : filename;

const normalizeOptions = (options: OptionsParameters): Required<OptionsParameters> => ({
  resolve: options.resolve ?? false,
  isExcludedDir: options.isExcludedDir ?? function (_dir: string) {
    return false;
  },
});

const traverseSync = function * (dirname: string, options: OptionsParameters): Generator {
  if (options.isExcludedDir?.(dirname)) {
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

export const getAllFilesSync = (filename: string, options?: OptionsParameters) => {
  const optionsNormalized = normalizeOptions(options ?? {});
  const files = {
    * [Symbol.iterator]() {
      if (!fs.lstatSync(filename).isDirectory()) {
        yield filename;
        return;
      }

      yield * (traverseSync)(normalizeDirname(filename, optionsNormalized.resolve), optionsNormalized);
    },
    toArray: () => [...files] as string[],
  };

  return files;
};

const noop = function (_parameter: unknown) {
  // Do nothing;
};

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

function traverse(dirnames: string[], filenames: string[], globalNotifier: ReturnType<typeof notifier>, options?: OptionsParameters) {
  if (dirnames.length === 0) {
    globalNotifier.done = true;
    return;
  }

  const children: string[] = [];
  let pendingPromises = 0;
  for (const dirname of dirnames) {
    if (options?.isExcludedDir?.(dirname)) {
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

