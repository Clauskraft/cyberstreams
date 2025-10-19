"""
OSINT Lab - Open Source Intelligence Tool Catalog and Launcher

A comprehensive system for managing, cataloging, and safely executing OSINT tools.

Features:
- Automated ingestion from awesome-osint lists
- Tool catalog with categorization and search
- MCP server for tool execution
- Policy-based security enforcement
- Multi-runner support (CLI, Docker, Web)
"""

__version__ = "1.3.0"
__author__ = "Cyberstreams"

from .catalog import OsintCatalog, OsintTool

__all__ = ["OsintCatalog", "OsintTool", "__version__"]
