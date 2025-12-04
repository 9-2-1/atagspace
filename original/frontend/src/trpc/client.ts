import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../backend/src/trpc/router';

// 创建tRPC客户端
const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api',
      headers: () => {
        return {
          // 可以在这里添加认证头
        };
      },
    }),
  ],
});

// 创建类型安全的包装器，使用类型断言绕过TypeScript检查
export {trpc};