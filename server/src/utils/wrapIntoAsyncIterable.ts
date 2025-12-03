export default function wrapIntoAsyncIterable<FnArgs extends unknown[], R>(
  fn: (callback: (value: R) => void, ...args: FnArgs) => Promise<void>
): (...args: FnArgs) => AsyncIterable<R> {
  return function (...args: FnArgs): AsyncIterable<R> {
    return {
      [Symbol.asyncIterator]() {
        const queue: R[] = [];
        let done = false;
        let resolve: ((value: IteratorResult<R>) => void) | null = null;

        // 启动生成数据的过程
        fn(
          (value: R) => {
            if (resolve) {
              // 如果有等待的 next() 调用，直接返回值
              resolve({ value, done: false });
              resolve = null;
            } else {
              // 否则将值加入队列
              queue.push(value);
            }
          },
          ...args
        ).then(() => {
          done = true;
          if (resolve) {
            resolve({ value: undefined, done: true });
            resolve = null;
          }
        });

        return {
          async next() {
            if (queue.length > 0) {
              // 如果队列中有值，直接返回
              return { value: queue.shift()!, done: false };
            } else if (done) {
              // 如果生成过程已完成且队列为空，返回结束
              return { value: undefined, done: true };
            } else {
              // 否则等待新值
              return new Promise<IteratorResult<R>>(res => {
                resolve = res;
              });
            }
          },
        };
      },
    };
  };
}
