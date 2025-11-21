"""
Tagfile commands for atagspace CLI.
"""

import typer

from .. import tagfile
from .cli_utils import tagfmt

tagfile_cli = typer.Typer(help="文件管理")


@tagfile_cli.command("listfile")
def tagfile_listfile(
    path: str = typer.Argument("", help="路径"),
    filter_str: str = typer.Option("", "-f", "--filter", help="过滤条件"),
    recurse: bool = typer.Option(False, "-r", "--recurse", help="递归搜索"),
    color: bool = typer.Option(False, "-c", "--color", help="彩色输出"),
    limits: int = typer.Option(1000, "-l", "--limits", help="限制数量"),
):
    """列出文件"""
    ret = tagfile.list_file(path, tagfile.arglist(filter_str), recurse, limits)
    for file in ret:
        typer.echo(
            str(file.id) + " " + file.path + file.name + ("/" if file.is_dir else "")
        )
        typer.echo(
            " ".join(tagfmt(tag, color) for tag in file.tags.split(" ") if tag != "")
        )


@tagfile_cli.command("updatenew")
def tagfile_updatenew(
    full: bool = typer.Option(False, "-f", "--full", help="完全刷新")
):
    """刷新文件"""
    tagfile.update_new(full=full)


@tagfile_cli.command("updatesrc")
def tagfile_updatesrc(file: str = typer.Argument(..., help="文件路径")):
    """设置文件源"""
    tagfile.update_src(file)


@tagfile_cli.command("pathtrans")
def tagfile_pathtrans(file: str = typer.Argument(..., help="文件路径")):
    """转换为实际路径"""
    result = tagfile.source_translate(file)
    typer.echo(result)


@tagfile_cli.command("tagset")
def tagfile_tagset(
    fid: int = typer.Argument(..., help="文件ID"),
    tags: str = typer.Argument(..., help="标签"),
):
    """设置文件标签"""
    tagfile.tag_file(fid, tags.split(" "))


@tagfile_cli.command("tagchange")
def tagfile_tagchange(
    fid: int = typer.Argument(..., help="文件ID"),
    adds: str = typer.Argument(..., help="添加的标签"),
    removes: str = typer.Option("", help="删除的标签"),
):
    """修改文件标签"""
    tagfile.tag_file_change(
        fid,
        list(filter(lambda x: x != "", adds.split(" "))),
        list(filter(lambda x: x != "", removes.split(" "))),
    )
