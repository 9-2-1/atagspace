"""
Extension commands for atagspace CLI.
"""

import typer

from ..extensions import totag, sorttag, tagspaces, automove

extension_cli = typer.Typer(help="扩展命令")


@extension_cli.command("totag")
def extension_totag(
    path: str = typer.Argument("", help="路径"),
    markall: bool = typer.Option(False, "-m", "--markall", help="标记所有"),
    clear_file_tags: bool = typer.Option(
        False, "-c", "--clear-file-tags", help="清除文件标签"
    ),
    send_number: bool = typer.Option(False, "-s", "--send-number", help="发送数量"),
):
    """同步待分类标记"""
    todo_count, finish_count, toread_count = totag.totag(
        path, markall, clear_file_tags, send_number
    )
    typer.echo(
        f'同步完成 {todo_count} 个待分类文件, {finish_count} 个已分类文件, {toread_count} 个"!待分类"文件'
    )


@extension_cli.command("sorttag")
def extension_sorttag(path: str = typer.Argument("", help="路径")):
    """排序标记"""
    sort_count = sorttag.sorttag(path)
    typer.echo(f"排序完成 {sort_count} 个文件")


@extension_cli.command("automove")
def extension_automove(
    path: str = typer.Argument("", help="路径"),
    moverule: str = typer.Option(..., "-m", "--moverule", help="移动规则文件"),
    dry_run: bool = typer.Option(False, "-d", "--dry-run", help="模拟运行"),
    mark_missed: bool = typer.Option(
        False, "-M", "--mark-missed", help="标记未匹配文件"
    ),
):
    """根据规则移动文件"""
    moved_count = automove.automove(path, moverule, dry_run, mark_missed)
    typer.echo(f"移动完成 {moved_count} 个文件")


@extension_cli.command("tagspaces")
def extension_tagspaces(path: str = typer.Argument("", help="路径")):
    """从 tagspaces 导入标记"""
    import_count = tagspaces.tagspaces_import(path)
    typer.echo(f"导入完成 {import_count} 个文件")


@extension_cli.command("tagspaces_export")
def extension_tagspaces_export(
    path: str = typer.Argument("", help="路径"),
    dry_run: bool = typer.Option(False, "-d", "--dry-run", help="模拟运行"),
    singlefile: bool = typer.Option(
        False, "-s", "--singlefile", help="处理 SingleFile 格式文件"
    ),
):
    """从 tagspaces 导出标记"""
    export_count = tagspaces.tagspaces_export(path, dry_run, singlefile)
    typer.echo(f"导出完成 {export_count} 个文件")


@extension_cli.command("tagspaces_library")
def extension_tagspaces_library(path: str = typer.Argument("", help="路径")):
    """从 tagspaces 导入标记"""
    import_count = tagspaces.tagspaces_category_import(path)
    typer.echo("导入完成")


@extension_cli.command("tagspaces_export_library")
def extension_tagspaces_export_library(path: str = typer.Argument("", help="路径")):
    """从 tagspaces 导出标记"""
    export_count = tagspaces.tagspaces_category_export(path)
    typer.echo("导出完成")
