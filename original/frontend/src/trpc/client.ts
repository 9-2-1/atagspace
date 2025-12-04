import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../backend/src/trpc/router';

// 创建tRPC客户端
export const trpc = createTRPCProxyClient<AppRouter>({
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
