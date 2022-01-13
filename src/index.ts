import * as fs from 'node:fs';

import {sep, resolve, posix, join} from 'node:path';

import * as fa from 'node:fs/promises';

interface OptionsParameters {
  isExcludedDir?: (dir: string) => boolean;
  resolve?: boolean;
}

const normalizeDirname = (filename: string, useAbsoluteRute: boolean) => useAbsoluteRute ? resolve(filename) : filename;

const normalizeOptions = (options: OptionsParameters): Required<OptionsParameters> => ({
  resolve: options.resolve ?? false,
  isExcludedDir: options.isExcludedDir ?? function (_dir: string) {
    return false;
  },
});



export const getAllFilesSync = (filename: string, options?: OptionsParameters) => {
  const optionsNormalized = normalizeOptions(options ?? {});
  const files = {
    * [Symbol.iterator]() {
      if (!fs.lstatSync(filename).isDirectory()) {
        yield filename;
        return;
      }

      yield * (function * syncWalk(dirname): Generator {
        if (optionsNormalized.isExcludedDir(dirname)) {
          return;
        }

        for (const dirent of fs.readdirSync(dirname, {withFileTypes: true})) {
          const filename = join(dirname, posix.normalize(dirent.name));

          if (dirent.isDirectory()) {
            yield * syncWalk(join(filename, sep));
          } else {
            yield filename;
          }
        }
      })(normalizeDirname(filename, optionsNormalized.resolve));
    },
    toArray: () => [...files] as string[],
  };

  return files;
};

const noop = function (_parameter: unknown) {
  // Do nothing;
};

const createNotifier = () => {
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

function walk(dirnames: string[], filenames: string[], notifier: ReturnType<typeof createNotifier>, options: OptionsParameters) {
  if (dirnames.length === 0) {
    notifier.done = true;
    return;
  }

  const dirnamesNormalized = dirnames.map(fileName => fileName.split(sep).join(posix.sep));
  const children: string[] = [];
  let pendingPromises = 0;
  for (const dirname of dirnamesNormalized) {
    if (options.isExcludedDir?.(dirname)) {
      continue;
    }

    pendingPromises++;
    // TODO change for promise or async
    fs.readdir(dirname, {withFileTypes: true}, (error, dirents) => {
      error && notifier.reject(error);

      for (const dirent of dirents) {
        const filename = join(dirname, posix.normalize(dirent.name));

        if (dirent.isDirectory()) {
          children.push(join(filename, sep));
        } else {
          filenames.push(filename);
        }
      }

      notifier.resolve();

      if (--pendingPromises === 0) {
        walk(children, filenames, notifier, options);
      }
    });
  }

  if (pendingPromises === 0) {
    notifier.done = true;
  }
}

export const getAllFiles = (filename: string, options?: OptionsParameters) => {
  const optionsNormalized = normalizeOptions(options ?? {});

  const files = {
    async * [Symbol.asyncIterator]() {
      const {isDirectory} = await fa.lstat(filename);
      if (!isDirectory) {
        yield filename;
        return;
      }

      const filenames: string[] = [];
      const notifier = createNotifier();

      walk([normalizeDirname(filename, optionsNormalized.resolve)], filenames, notifier, optionsNormalized);

      do {
        // TODO
        // eslint-disable-next-line no-await-in-loop
        await notifier.onResolved();
        while (filenames.length > 0) {
          yield filenames.pop();
        }
      } while (!notifier.done);
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

// console.log(await getAllFiles('./test/fixtures').toArray());

