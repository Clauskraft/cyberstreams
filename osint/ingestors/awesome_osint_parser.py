"""
Awesome OSINT List Parser

Parses awesome-osint markdown lists and extracts tool information.
"""

import re
from typing import List, Dict, Optional
from pathlib import Path
import sys
sys.path.append(str(Path(__file__).parent.parent))

from catalog import OsintTool, ToolCategory


class AwesomeOsintParser:
    """Parse awesome-osint markdown lists"""

    CATEGORY_MAPPING = {
        'general search': ToolCategory.SEARCH_ENGINES,
        'main national search engines': ToolCategory.SEARCH_ENGINES,
        'meta search': ToolCategory.SEARCH_ENGINES,
        'visual search': ToolCategory.SEARCH_ENGINES,
        'social media': ToolCategory.SOCIAL_MEDIA,
        'real-time search, social media search, and general social media tools': ToolCategory.SOCIAL_MEDIA,
        'username check': ToolCategory.SOCIAL_MEDIA,
        'facebook': ToolCategory.SOCIAL_MEDIA,
        'twitter': ToolCategory.SOCIAL_MEDIA,
        'linkedin': ToolCategory.SOCIAL_MEDIA,
        'instagram': ToolCategory.SOCIAL_MEDIA,
        'email search / email check': ToolCategory.EMAIL,
        'phone number': ToolCategory.PHONE,
        'domain and ip research': ToolCategory.DOMAIN_IP,
        'geolocation': ToolCategory.GEOLOCATION,
        'dark web': ToolCategory.DARK_WEB,
        'threat intelligence': ToolCategory.THREAT_INTEL,
        'osint frameworks': ToolCategory.OSINT_FRAMEWORK,
        'people investigations': ToolCategory.RECONNAISSANCE,
        'company research': ToolCategory.RECONNAISSANCE,
        'web history': ToolCategory.RECONNAISSANCE,
    }

    def __init__(self, markdown_path: Optional[str] = None):
        self.markdown_path = markdown_path
        self.tools: List[OsintTool] = []

    def parse_markdown(self, content: str) -> List[OsintTool]:
        """Parse markdown content and extract tools"""
        tools = []
        current_category = ToolCategory.OTHER
        lines = content.split('\n')

        for line in lines:
            # Detect category headers
            if line.startswith('##'):
                category_name = line.replace('#', '').strip().lower()
                current_category = self._map_category(category_name)

            # Parse tool entries (- [Tool Name](url) - description)
            if line.startswith('*') or line.startswith('-'):
                tool = self._parse_tool_line(line, current_category)
                if tool:
                    tools.append(tool)

        self.tools = tools
        return tools

    def _parse_tool_line(self, line: str, category: ToolCategory) -> Optional[OsintTool]:
        """Parse a single tool line"""
        # Pattern: * [Name](url) - description
        pattern = r'\[([^\]]+)\]\(([^\)]+)\)\s*-?\s*(.*)'
        match = re.search(pattern, line)

        if not match:
            return None

        name, url, description = match.groups()

        # Extract tags from description
        tags = self._extract_tags(description)

        return OsintTool(
            name=name.strip(),
            url=url.strip(),
            description=description.strip(),
            category=category,
            tags=tags,
            web_interface=True,
            is_whitelisted=False,  # Requires manual review
            risk_level='medium',
            requires_approval=True
        )

    def _map_category(self, category_name: str) -> ToolCategory:
        """Map category name to ToolCategory enum"""
        for key, value in self.CATEGORY_MAPPING.items():
            if key in category_name:
                return value
        return ToolCategory.OTHER

    def _extract_tags(self, description: str) -> List[str]:
        """Extract relevant tags from description"""
        tags = []
        keywords = ['free', 'api', 'opensource', 'commercial', 'paid', 'registration required']

        desc_lower = description.lower()
        for keyword in keywords:
            if keyword in desc_lower:
                tags.append(keyword.replace(' ', '_'))

        return tags

    def parse_file(self, file_path: str) -> List[OsintTool]:
        """Parse markdown file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return self.parse_markdown(content)

    def to_catalog(self, catalog_instance) -> int:
        """Add parsed tools to catalog"""
        count = 0
        for tool in self.tools:
            if catalog_instance.add_tool(tool):
                count += 1
        return count
