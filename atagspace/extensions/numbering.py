import logging

log = logging.getLogger(__name__)

import aiohttp
import asyncio


def send(category: str, count: int) -> None:

    async def send() -> None:
        async with aiohttp.ClientSession() as session:
            with open("APPID.txt", "r") as f:
                APPID = f.read().strip()
            async with session.post(
                f"https://arigi.top/numberheaven/post_update?name={category}",
                data=str(count).encode("utf-8"),
                headers={"APPID": APPID},
            ) as resp:
                if resp.status != 200:
                    log.error(f"numberheaven error: {resp.status}")
                else:
                    log.info(f"numberheaven success: {await resp.text()}")

    asyncio.run(send())
