"""
Category commands for atagspace CLI.
"""

import typer
from typing import Optional

from .. import category
from .cli_utils import tagfmt

category_cli = typer.Typer(help="标签分类管理")


@category_cli.command("set")
def category_set(
    name: str = typer.Argument(..., help="分类名称"),
    color: Optional[str] = typer.Argument(None, help="颜色"),
):
    """添加或设置分类"""
    category.set_category(name, color)


@category_cli.command("rename")
def category_rename(
    name: str = typer.Argument(..., help="原名称"),
    newname: str = typer.Argument(..., help="新名称"),
):
    """重命名分类"""
    category.rename_category(name, newname)


@category_cli.command("remove")
def category_remove(name: str = typer.Argument(..., help="分类名称")):
    """删除分类"""
    category.remove_cate(name)


@category_cli.command("settag")
def category_settag(
    name: str = typer.Argument(..., help="分类名称"),
    tags: str = typer.Argument(..., help="标签"),
):
    """设置分类标签"""
    for tag in tags.split(" "):
        category.set_tag(tag, name)


@category_cli.command("removetag")
def category_removetag(tags: str = typer.Argument(..., help="标签")):
    """删除分类标签"""
    for tag in tags.split(" "):
        category.remove_tag(tag)


@category_cli.command("listtag")
def category_listtag(
    color: bool = typer.Option(False, "-c", "--color", help="彩色输出")
):
    """列出分类标签"""
    for cate in category.list_category():
        typer.echo("# " + cate.name)
        typer.echo(
            " ".join(tagfmt(tag.name, color) for tag in category.list_tag(cate.name))
        )
        typer.echo()


@category_cli.command("setcolor")
def category_setcolor(
    name: str = typer.Argument(..., help="分类名称"),
    color: str = typer.Argument(..., help="颜色"),
):
    """设置分类颜色"""
    category.set_tag_color(name, color)
