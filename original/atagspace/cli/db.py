"""
Database commands for atagspace CLI.
"""

import typer
import time

from .. import db
from ..extensions import singlefilerename

db_cli = typer.Typer(help="数据库管理")


@db_cli.command("init")
def db_init():
    """初始化数据库"""
    # the db is initialized whether command run
    singlefilerename.init()
    typer.echo("数据库初始化完成")


@db_cli.command("clean")
def db_clean(cdays: float = typer.Argument(..., help="过期时间(天)")):
    """清理数据库"""
    expire_time = time.time() - cdays * 24 * 60 * 60
    db.purge_deleted(expire_time)
    singlefilerename.purge_deleted(expire_time)
    typer.echo("清理完成")
