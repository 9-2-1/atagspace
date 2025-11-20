import argparse
import logging

from aiohttp import web
from . import db
from . import tagfile
from . import category
from .extensions import totag
from .extensions import sorttag
from .extensions import tagspaces
from .web import app


logging.basicConfig(level=logging.INFO)


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
    subparser_web = subparsers.add_parser("web", help="WebUI")
    subparser_db = subparsers.add_parser("db", help="数据库")
    subparser_db_ = subparser_db.add_subparsers(dest="mode2")
    subparser_db_init = subparser_db_.add_parser("init", help="初始化数据库")
    subparser_tagfile = subparsers.add_parser("tagfile", help="文件管理")
    subparser_tagfile_ = subparser_tagfile.add_subparsers(dest="mode2")
    subparser_tagfile_listfile = subparser_tagfile_.add_parser(
        "listfile", help="列出文件"
    )
    subparser_tagfile_listfile.add_argument("path", nargs="?", default="")
    subparser_tagfile_listfile.add_argument("-f", "--filter", default="")
    subparser_tagfile_listfile.add_argument("-r", "--recurse", action="store_true")
    subparser_tagfile_listfile.add_argument("-c", "--color", action="store_true")
    subparser_tagfile_listfile.add_argument("-l", "--limits", type=int, default=1000)
    subparser_tagfile_updatenew = subparser_tagfile_.add_parser(
        "updatenew", help="刷新文件"
    )
    subparser_tagfile_updatenew.add_argument("-f", "--full", action="store_true")
    subparser_tagfile_updatesrc = subparser_tagfile_.add_parser(
        "updatesrc", help="设置文件源"
    )
    subparser_tagfile_updatesrc.add_argument("file")
    subparser_tagfile_pathtrans = subparser_tagfile_.add_parser(
        "pathtrans", help="转换为实际路径"
    )
    subparser_tagfile_pathtrans.add_argument("file")
    subparser_tagfile_tagset = subparser_tagfile_.add_parser(
        "tagset", help="设置文件标签"
    )
    subparser_tagfile_tagset.add_argument("fid", type=int)
    subparser_tagfile_tagset.add_argument("tags")
    subparser_tagfile_tagchange = subparser_tagfile_.add_parser(
        "tagchange", help="修改文件标签"
    )
    subparser_tagfile_tagchange.add_argument("fid", type=int)
    subparser_tagfile_tagchange.add_argument("adds")
    subparser_tagfile_tagchange.add_argument("removes", nargs="?", default="")
    subparser_category = subparsers.add_parser("category", help="标签分类管理")
    subparser_category_ = subparser_category.add_subparsers(dest="mode2")
    subparser_category_set = subparser_category_.add_parser(
        "set", help="添加或设置分类"
    )
    subparser_category_set.add_argument("name")
    subparser_category_set.add_argument("color", nargs="?")
    subparser_category_rename = subparser_category_.add_parser(
        "rename", help="重命名分类"
    )
    subparser_category_rename.add_argument("name")
    subparser_category_rename.add_argument("newname")
    subparser_category_remove = subparser_category_.add_parser(
        "remove", help="删除分类"
    )
    subparser_category_remove.add_argument("name")
    subparser_category_listtag = subparser_category_.add_parser(
        "listtag", help="列出分类标签"
    )
    subparser_category_listtag.add_argument("-c", "--color", action="store_true")
    subparser_category_settag = subparser_category_.add_parser(
        "settag", help="设置分类标签"
    )
    subparser_category_settag.add_argument("name")
    subparser_category_settag.add_argument("tags")
    subparser_category_removetag = subparser_category_.add_parser(
        "removetag", help="删除分类标签"
    )
    subparser_category_removetag.add_argument("tags")
    subparser_category_setcolor = subparser_category_.add_parser(
        "setcolor", help="设置分类颜色"
    )
    subparser_category_setcolor.add_argument("name")
    subparser_category_setcolor.add_argument("color")
    subparser_extension = subparsers.add_parser("extension", help="扩展命令")
    subparser_extension_ = subparser_extension.add_subparsers(dest="mode2")
    subparser_extension_totag = subparser_extension_.add_parser(
        "totag", help="同步待分类标记"
    )
    subparser_extension_totag.add_argument("path", nargs="?", default="")
    subparser_extension_totag.add_argument("-m", "--markall", action="store_true")
    subparser_extension_totag.add_argument(
        "-c", "--clear-file-tags", action="store_true"
    )
    subparser_extension_totag.add_argument("-s", "--send-number", action="store_true")
    subparser_extension_sorttag = subparser_extension_.add_parser(
        "sorttag", help="排序标记"
    )
    subparser_extension_sorttag.add_argument("path", nargs="?", default="")
    subparser_extension_tagspaces = subparser_extension_.add_parser(
        "tagspaces", help="从 tagspaces 导入标记"
    )
    subparser_extension_tagspaces.add_argument("path", nargs="?", default="")
    subparser_extension_tagspaces_export = subparser_extension_.add_parser(
        "tagspaces_export", help="从 tagspaces 导出标记"
    )
    subparser_extension_tagspaces_export.add_argument("path", nargs="?", default="")
    subparser_extension_tagspaces_export.add_argument(
        "-d", "--dry-run", action="store_true"
    )
    subparser_extension_tagspaces_export.add_argument(
        "-s", "--singlefile", action="store_true"
    )
    subparser_extension_tagspaces_library = subparser_extension_.add_parser(
        "tagspaces_library", help="从 tagspaces 导入标记"
    )
    subparser_extension_tagspaces_library.add_argument("path", nargs="?", default="")
    subparser_extension_tagspaces_export_library = subparser_extension_.add_parser(
        "tagspaces_export_library", help="从 tagspaces 导出标记"
    )
    subparser_extension_tagspaces_export_library.add_argument(
        "path", nargs="?", default=""
    )

    args = parser.parse_args()
    db.init()
    if args.mode == "web":
        web.run_app(app, host="127.0.0.1", port=4590)
    elif args.mode == "db":
        if args.mode2 == "init":
            # the db is initialized whether command run
            pass
        else:
            subparser_db.print_help()
    elif args.mode == "tagfile":
        if args.mode2 == "listfile":
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
        elif args.mode2 == "updatenew":
            tagfile.update_new(full=args.full)
        elif args.mode2 == "updatesrc":
            tagfile.update_src(args.file)
        elif args.mode2 == "tagset":
            tagfile.tag_file(args.fid, args.tags)
        elif args.mode2 == "tagchange":
            tagfile.tag_file_change(
                args.fid,
                list(filter(lambda x: x != "", args.adds.split(" "))),
                list(filter(lambda x: x != "", args.removes.split(" "))),
            )
        elif args.mode2 == "pathtrans":
            print(tagfile.source_translate(args.file))
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
                print(
                    " ".join(
                        tagfmt(tag.name, args.color)
                        for tag in category.list_tag(cate.name)
                    )
                )
        elif args.mode2 == "setcolor":
            category.set_tag_color(args.name, args.color)
    elif args.mode == "extension":
        if args.mode2 == "totag":
            todo_count, finish_count, toread_count = totag.totag(
                args.path, args.markall, args.clear_file_tags, args.send_number
            )
            print(
                f'同步完成 {todo_count} 个待分类文件, {finish_count} 个已分类文件, {toread_count} 个"!待分类"文件'
            )
        elif args.mode2 == "sorttag":
            sort_count = sorttag.sorttag(args.path)
            print(f"排序完成 {sort_count} 个文件")
        elif args.mode2 == "tagspaces":
            import_count = tagspaces.tagspaces_import(args.path)
            print(f"导入完成 {import_count} 个文件")
        elif args.mode2 == "tagspaces_export":
            export_count = tagspaces.tagspaces_export(
                args.path, args.dry_run, args.singlefile
            )
            print(f"导出完成 {export_count} 个文件")
        elif args.mode2 == "tagspaces_library":
            import_count = tagspaces.tagspaces_category_import(args.path)
            print(f"导入完成")
        elif args.mode2 == "tagspaces_export_library":
            export_count = tagspaces.tagspaces_category_export(args.path)
            print(f"导出完成")
    else:
        parser.print_help()
    db.close()


if __name__ == "__main__":
    main()
