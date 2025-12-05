import logging
import aiohttp
import asyncio
from urllib.parse import quote

log = logging.getLogger(__name__)


def send(category: str, color: str, order: int, count: int) -> None:

    async def send() -> None:
        async with aiohttp.ClientSession() as session:
            with open("APPID.txt", "r") as f:
                APPID = f.read().strip()
            async with session.post(
                f"https://arigi.top/numberheaven/api/post_update?name={category}&color={quote(color)}&order={order}",
                data=str(count).encode("utf-8"),
                headers={"APPID": APPID},
            ) as resp:
                if resp.status != 200:
                    log.error(f"numberheaven error: {resp.status}")
                else:
                    log.info(f"numberheaven success: {await resp.text()}")

    asyncio.run(send())
