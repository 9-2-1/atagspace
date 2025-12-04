from typing import Callable, Any, Awaitable
import os
import json
from dataclasses import is_dataclass, asdict as dataclass_asdict


from aiohttp import web

from . import tagfile
from . import category


def json_default(x: Any) -> Any:
    if is_dataclass(x):
        # TODO
        return dataclass_asdict(x)  # type: ignore
    raise ValueError(f"{x!r} is not json serializable")


def json_dumps(x: Any) -> str:
    return json.dumps(
        x, ensure_ascii=False, separators=(",", ":"), default=json_default
    )


# TODO api.py
def webjson(
    fn: Callable[..., Awaitable[Any]],
) -> Callable[[web.Request], Awaitable[web.Response]]:
    async def handle(req: web.Request) -> web.Response:
        path = await req.content.read()
        j = json.loads(path.decode("utf-8"))
        r = await fn(**j)
        return web.json_response(r, dumps=json_dumps)

    return handle


@webjson
async def handle_list(
    path: str, filter: str = "", recurse: bool = False, limit: int = 1000
) -> Any:
    return tagfile.list_file(path, tagfile.arglist(filter), recurse, limit)


@webjson
async def handle_category() -> Any:
    return [
        {
            "name": cate.name,
            "color": cate.color,
            "tags": [
                {"name": tag.name, "color": tag.color}
                for tag in category.list_tag(cate.name)
            ],
        }
        for cate in category.list_category()
    ]


@webjson
async def handle_set_category(name: str, color: str | None) -> Any:
    category.set_category(name, color)
    return None


@webjson
async def handle_rename_category(name: str, newname: str) -> Any:
    category.rename_category(name, newname)
    return None


@webjson
async def handle_remove_category(name: str) -> Any:
    category.remove_cate(name)
    return None


@webjson
async def handle_set_tags(tags: list[str], cate: str) -> Any:
    for tag in tags:
        category.set_tag(tag, cate)
    return None


@webjson
async def handle_remove_tags(tags: list[str]) -> Any:
    for tag in tags:
        category.remove_tag(tag)
    return None


@webjson
async def handle_set_tags_color(tags: list[str], color: str | None) -> Any:
    for tag in tags:
        category.set_tag_color(tag, color)
    return None


@webjson
async def handle_tag_file(ids: list[int], tags: list[str]) -> Any:
    for id in ids:
        tagfile.tag_file(id, tags)
    return None


@webjson
async def handle_tag_change(ids: list[int], adds: list[str], removes: list[str]) -> Any:
    for id in ids:
        tagfile.tag_file_change(id, adds, removes)
    return None


async def handle_get_content(req: web.Request) -> web.FileResponse:
    return web.FileResponse(tagfile.source_translate(req.query.get("path") or ""))


@webjson
async def handle_open_content(path: str) -> None:
    os.startfile(tagfile.source_translate(path))


async def handle_index(req: web.Request) -> web.Response:
    with open("web/index.html", "rb") as f:
        content = f.read()
    return web.Response(body=content, content_type="text/html")


app = web.Application()
app.router.add_get("/", handle_index)
app.router.add_post("/list", handle_list)
app.router.add_post("/category", handle_category)
app.router.add_post("/set_category", handle_set_category)
app.router.add_post("/rename_category", handle_rename_category)
app.router.add_post("/remove_category", handle_remove_category)
app.router.add_post("/set_tags", handle_set_tags)
app.router.add_post("/remove_tags", handle_remove_tags)
app.router.add_post("/set_tags_color", handle_set_tags_color)
app.router.add_post("/tag_file", handle_tag_file)
app.router.add_post("/tag_file_change", handle_tag_change)
app.router.add_get("/get_content", handle_get_content)
app.router.add_post("/open_content", handle_open_content)
app.router.add_static("/", "web")
