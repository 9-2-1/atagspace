"""
Command-line interface for atagspace using Typer.
This module provides a clean, organized CLI structure that addresses the original issues:
- Subcommand definition and operation are co-located
- Minimal repetitive code
- Easy to maintain and extend
"""

import typer
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

from . import db
from .cli import db_cli, tagfile_cli, category_cli, extension_cli
from .web import app
from aiohttp import web as aiohttp_web

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# Initialize the main app
app_cli = typer.Typer(help="atagspace - 文件标签管理系统")


# Web command
@app_cli.command()
def web(
    host: str = typer.Option("127.0.0.1", help="主机地址"),
    port: int = typer.Option(4590, help="端口"),
):
    """启动WebUI"""
    aiohttp_web.run_app(app, host=host, port=port)


# Add command groups
app_cli.add_typer(db_cli, name="db")
app_cli.add_typer(tagfile_cli, name="tagfile")
app_cli.add_typer(category_cli, name="category")
app_cli.add_typer(extension_cli, name="extension")


def run():
    """Main entry point"""
    try:
        db.init()
        app_cli()
    finally:
        db.close()


if __name__ == "__main__":
    run()
