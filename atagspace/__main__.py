from typing import Callable, Any, Awaitable
import os
import argparse
import json
from datetime import datetime


from aiohttp import web
from peewee import Model

from . import db
from . import tagfile
from . import category


def json_default(x: Any) -> Any:
    if isinstance(x, Model):
        return x.__data__
    if isinstance(x, datetime):
        return x.strftime("%Y-%m-%d %H:%M:%S%z")
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
    return tagfile.list_file(path, filter, recurse, limit)


@webjson
async def handle_category() -> Any:
    return [
        {
            "name": cate.name,
            "color": cate.color,
            "tags": [{"name": tag.name, "color": tag.color} for tag in cate.tags],
        }
        for cate in category.list_tag()
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
    return web.FileResponse(tagfile.source_translate(req.query.get("path")))


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


tagfmt_errors: set[str] = set()


def colorparse(c: str) -> tuple[int, int, int]:
    r = 0
    g = 0
    b = 0
    if (len(c) == 7 or len(c) == 9) and c[0] == "#":
        r = int(c[1:3], 16)
        g = int(c[3:5], 16)
        b = int(c[5:7], 16)
    return r, g, b


def tagfmt(tag: str, color: bool = False) -> str:
    ret = tag
    ret = f"[{ret}]"
    if color:
        c = category.get_color(tag)
        if c is not None:
            try:
                f, b = c.split("|")
                fr, fg, fb = colorparse(f)
                br, bg, bb = colorparse(b)
                ret = f"\x1b[38;2;{fr};{fg};{fb}m\x1b[48;2;{br};{bg};{bb}m{ret}\x1b[39;49m"
            except Exception:
                if c not in tagfmt_errors:
                    print(f"Cannot parse color {c}\n")
                    tagfmt_errors.add(c)
    return ret


def main():
    # TODO AI help
    # TODO typer / self-define
    parser = argparse.ArgumentParser(description="atagspace")
    subparsers = parser.add_subparsers(dest="mode")
    subparser_web = subparsers.add_parser("web", help="run webui")
    subparser_db = subparsers.add_parser("db", help="database commands")
    subparser_db_ = subparser_db.add_subparsers(dest="mode2")
    subparser_db_init = subparser_db_.add_parser("init", help="initialize database")
    subparser_tagfile = subparsers.add_parser("tagfile", help="tagfile commands")
    subparser_tagfile_ = subparser_tagfile.add_subparsers(dest="mode2")
    subparser_tagfile_listfile = subparser_tagfile_.add_parser(
        "listfile", help="initialize database"
    )
    subparser_tagfile_listfile.add_argument("path", nargs="?", default="")
    subparser_tagfile_listfile.add_argument("-f", "--filter", default="")
    subparser_tagfile_listfile.add_argument("-r", "--recurse", action="store_true")
    subparser_tagfile_listfile.add_argument("-c", "--color", action="store_true")
    subparser_tagfile_listfile.add_argument("-l", "--limits", type=int, default=1000)
    subparser_tagfile_updatenew = subparser_tagfile_.add_parser(
        "updatenew", help="rescan file"
    )
    subparser_tagfile_updatenew.add_argument("-f", "--full", action="store_true")
    subparser_tagfile_updatesrc = subparser_tagfile_.add_parser(
        "updatesrc", help="set source"
    )
    subparser_tagfile_updatesrc.add_argument("file")
    subparser_tagfile_pathtrans = subparser_tagfile_.add_parser(
        "pathtrans", help="reveal real path"
    )
    subparser_tagfile_pathtrans.add_argument("file")
    subparser_tagfile_tagset = subparser_tagfile_.add_parser("tagset", help="set tags")
    subparser_tagfile_tagset.add_argument("fid", type=int)
    subparser_tagfile_tagset.add_argument("tags")
    subparser_tagfile_tagchange = subparser_tagfile_.add_parser(
        "tagchange", help="change tags"
    )
    subparser_tagfile_tagchange.add_argument("fid", type=int)
    subparser_tagfile_tagchange.add_argument("adds")
    subparser_tagfile_tagchange.add_argument("removes", nargs="?", default="")
    subparser_category = subparsers.add_parser("category", help="category commands")
    subparser_category_ = subparser_category.add_subparsers(dest="mode2")
    subparser_category_set = subparser_category_.add_parser(
        "set", help="add or set category"
    )
    subparser_category_set.add_argument("name")
    subparser_category_set.add_argument("color", nargs="?")
    subparser_category_rename = subparser_category_.add_parser(
        "rename", help="rename category"
    )
    subparser_category_rename.add_argument("name")
    subparser_category_rename.add_argument("newname")
    subparser_category_remove = subparser_category_.add_parser(
        "remove", help="remove category"
    )
    subparser_category_remove.add_argument("name")
    subparser_category_listtag = subparser_category_.add_parser(
        "listtag", help="listtag category"
    )
    subparser_category_listtag.add_argument("-c", "--color", action="store_true")
    subparser_category_settag = subparser_category_.add_parser(
        "settag", help="settag category"
    )
    subparser_category_settag.add_argument("name")
    subparser_category_settag.add_argument("tags")
    subparser_category_removetag = subparser_category_.add_parser(
        "removetag", help="removetag category"
    )
    subparser_category_removetag.add_argument("tags")
    subparser_category_setcolor = subparser_category_.add_parser(
        "setcolor", help="setcolor category"
    )
    subparser_category_setcolor.add_argument("name")
    subparser_category_setcolor.add_argument("color")

    args = parser.parse_args()
    if args.mode == "web":
        web.run_app(app, host="127.0.0.1", port=4590)
    elif args.mode == "db":
        if args.mode2 == "init":
            db.init()
            db.close()
        else:
            subparser_db.print_help()
    elif args.mode == "tagfile":
        if args.mode2 == "listfile":
            db.init()
            ret = tagfile.list_file(args.path, args.filter, args.recurse, args.limits)
            for file in ret:
                if file.path != "":
                    print(
                        str(file.id)
                        + " "
                        + file.path
                        + "/"
                        + file.name
                        + ("/" if file.is_dir else "")
                    )
                else:
                    print(str(file.id) + " " + file.name + ("/" if file.is_dir else ""))
                print(
                    " ".join(
                        tagfmt(tag, args.color)
                        for tag in file.tags.split(" ")
                        if tag != ""
                    )
                )
            db.close()
        elif args.mode2 == "updatenew":
            db.init()
            tagfile.update_new(full=args.full)
            db.close()
        elif args.mode2 == "updatesrc":
            db.init()
            tagfile.update_src(args.file)
            db.close()
        elif args.mode2 == "tagset":
            db.init()
            tagfile.tag_file(args.fid, args.tags)
            db.close()
        elif args.mode2 == "tagchange":
            db.init()
            tagfile.tag_file_change(
                args.fid,
                list(filter(lambda x: x != "", args.adds.split(" "))),
                list(filter(lambda x: x != "", args.removes.split(" "))),
            )
            db.close()
        elif args.mode2 == "pathtrans":
            db.init()
            print(tagfile.source_translate(args.file))
            db.close()
        else:
            subparser_tagfile.print_help()
    elif args.mode == "category":
        if args.mode2 == "set":
            category.set_category(args.name, args.color)
        elif args.mode2 == "rename":
            category.rename_category(args.name, args.newname)
        elif args.mode2 == "remove":
            category.remove_cate(args.name)
        elif args.mode2 == "settag":
            for tag in args.tags.split(" "):
                category.set_tag(tag, args.name)
        elif args.mode2 == "removetag":
            for tag in args.tags.split(" "):
                category.remove_tag(tag)
        elif args.mode2 == "listtag":
            for cate in category.list_tag():
                print("#" + cate.name)
                print(" ".join(tagfmt(tag.name, args.color) for tag in cate.tags))
        elif args.mode2 == "setcolor":
            category.set_tag_color(args.name, args.color)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
