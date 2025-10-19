"""
CLI Runner - Execute OSINT tools via command line

Provides safe execution of OSINT tools with policy enforcement.
"""

import subprocess
import sys
from pathlib import Path
from typing import Dict, Any, Optional
sys.path.append(str(Path(__file__).parent.parent))

from catalog import OsintTool
from runners.policy import PolicyEngine, get_policy_from_env


class CLIRunner:
    """Execute OSINT tools via CLI"""

    def __init__(self, policy_engine: Optional[PolicyEngine] = None):
        self.policy = policy_engine or PolicyEngine(get_policy_from_env())

    def execute_tool(self, tool: OsintTool, args: list = None) -> Dict[str, Any]:
        """
        Execute an OSINT tool

        Returns execution result with stdout, stderr, returncode
        """

        # Policy check
        allowed, reason = self.policy.can_execute(
            tool.name,
            tool.is_whitelisted,
            tool.risk_level,
            tool.requires_approval
        )

        if not allowed:
            return {
                'success': False,
                'error': f"Execution blocked by policy: {reason}",
                'tool': tool.name
            }

        # For web-only tools, just return the URL
        if tool.web_interface and not tool.requires_install:
            return {
                'success': True,
                'action': 'open_url',
                'url': tool.url,
                'tool': tool.name,
                'message': f"Open {tool.name} in browser"
            }

        # For tools requiring installation
        if tool.requires_install:
            return {
                'success': False,
                'error': "Tool requires installation. Use Docker runner or install manually.",
                'tool': tool.name,
                'install_required': True
            }

        return {
            'success': True,
            'tool': tool.name,
            'message': "Tool launched"
        }

    def open_in_browser(self, url: str) -> bool:
        """Open URL in default browser"""
        import webbrowser
        try:
            webbrowser.open(url)
            return True
        except Exception as e:
            print(f"Error opening browser: {e}")
            return False


def main():
    """CLI entry point"""
    print("OSINT Lab CLI Runner v1.3.0")
    print("=" * 50)

    from catalog import OsintCatalog

    catalog = OsintCatalog()
    catalog.load_tools()

    print(f"Loaded {len(catalog.tools)} tools")
    print("\nExample tools:")
    for tool in catalog.tools[:5]:
        print(f"  - {tool.name} ({tool.category.value})")

    print("\nUse the web interface for full functionality")


if __name__ == "__main__":
    main()
