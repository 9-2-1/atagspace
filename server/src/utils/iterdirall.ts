import fsP from 'fs/promises';

export default async function iterdirall(callback: (loc: string) => void, path: string) {
  try {
    const dirEntries = await fsP.opendir(path);
    const promises: Promise<void>[] = [];

    for await (const dirent of dirEntries) {
      const filepath = path + '/' + dirent.name;
      if (dirent.isDirectory()) {
        // 将子目录处理放入 Promise 数组，不立即 await
        promises.push(iterdirall(callback, filepath));
      }
      callback(filepath);
    }

    // 等待所有子目录处理完成
    await Promise.all(promises);
  } catch (error) {
    console.error(`Error processing ${path}:`, error);
  }
}

/*
export async function example() {
  const state: { list: number; stat: number } = { list: 0, stat: 0 };
  const progress_bar = new progress<typeof state>(
    state => `List ${state.list}, Stat ${state.stat}`,
    100
  );
  function update_bar() {
    progress_bar.update(state);
  }

  async function stat(loc: string) {
    state.list++;
    update_bar();
    try {
      await fsP.stat(loc, { bigint: true });
    } catch (error) {
      console.error(`Error processing ${loc}:`, error);
    }
    state.stat++;
    update_bar();
  }

  const step2p: Promise<void>[] = [];
  await iterdirall(loc => {
    step2p.push(stat(loc));
  }, 'F:/');

  await Promise.all(step2p);

  progress_bar.update(state);
  progress_bar.end();
}

example();
*/
