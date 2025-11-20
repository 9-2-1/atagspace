"""
Main entry point for atagspace.
This module now uses the optimized Typer-based CLI from args.py
"""

from .cli_main import run


def main():
    """Main entry point"""
    run()


if __name__ == "__main__":
    main()
