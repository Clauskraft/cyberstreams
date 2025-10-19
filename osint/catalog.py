"""
OSINT Catalog Management

Manages the registry of OSINT tools including metadata, categorization, and storage.
"""

import json
import sqlite3
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from enum import Enum


class ToolCategory(str, Enum):
    """OSINT Tool Categories"""
    RECONNAISSANCE = "reconnaissance"
    SOCIAL_MEDIA = "social_media"
    SEARCH_ENGINES = "search_engines"
    DOMAIN_IP = "domain_ip"
    EMAIL = "email"
    PHONE = "phone"
    GEOLOCATION = "geolocation"
    DARK_WEB = "dark_web"
    THREAT_INTEL = "threat_intel"
    FORENSICS = "forensics"
    OSINT_FRAMEWORK = "osint_framework"
    OTHER = "other"


@dataclass
class OsintTool:
    """OSINT Tool Data Model"""
    name: str
    url: str
    description: str
    category: ToolCategory
    tags: List[str]

    # Optional metadata
    author: Optional[str] = None
    license: Optional[str] = None
    language: Optional[str] = None
    requires_api_key: bool = False
    requires_install: bool = False
    docker_available: bool = False
    web_interface: bool = True

    # Compliance and safety
    is_whitelisted: bool = False
    risk_level: str = "low"  # low, medium, high
    requires_approval: bool = False

    # Metadata
    added_date: Optional[str] = None
    last_verified: Optional[str] = None
    popularity_score: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'OsintTool':
        """Create from dictionary"""
        # Convert category string to enum
        if 'category' in data and isinstance(data['category'], str):
            data['category'] = ToolCategory(data['category'])
        return cls(**data)


class OsintCatalog:
    """Manages OSINT Tool Catalog"""

    def __init__(self, db_path: str = "osint/registry/osint.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.tools: List[OsintTool] = []
        self._init_database()

    def _init_database(self):
        """Initialize SQLite database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tools (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                url TEXT NOT NULL,
                description TEXT,
                category TEXT NOT NULL,
                tags TEXT,
                author TEXT,
                license TEXT,
                language TEXT,
                requires_api_key INTEGER DEFAULT 0,
                requires_install INTEGER DEFAULT 0,
                docker_available INTEGER DEFAULT 0,
                web_interface INTEGER DEFAULT 1,
                is_whitelisted INTEGER DEFAULT 0,
                risk_level TEXT DEFAULT 'low',
                requires_approval INTEGER DEFAULT 0,
                added_date TEXT,
                last_verified TEXT,
                popularity_score INTEGER DEFAULT 0
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                snapshot_date TEXT NOT NULL,
                tool_count INTEGER,
                data_json TEXT
            )
        ''')

        conn.commit()
        conn.close()

    def add_tool(self, tool: OsintTool) -> bool:
        """Add tool to catalog"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('''
                INSERT OR REPLACE INTO tools
                (name, url, description, category, tags, author, license, language,
                 requires_api_key, requires_install, docker_available, web_interface,
                 is_whitelisted, risk_level, requires_approval, added_date, last_verified,
                 popularity_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                tool.name, tool.url, tool.description, tool.category.value,
                json.dumps(tool.tags), tool.author, tool.license, tool.language,
                int(tool.requires_api_key), int(tool.requires_install),
                int(tool.docker_available), int(tool.web_interface),
                int(tool.is_whitelisted), tool.risk_level,
                int(tool.requires_approval), tool.added_date, tool.last_verified,
                tool.popularity_score
            ))

            conn.commit()
            conn.close()

            self.tools.append(tool)
            return True

        except Exception as e:
            print(f"Error adding tool: {e}")
            return False

    def load_tools(self) -> List[OsintTool]:
        """Load all tools from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM tools')
        rows = cursor.fetchall()

        tools = []
        for row in rows:
            tool_data = {
                'name': row[1],
                'url': row[2],
                'description': row[3],
                'category': row[4],
                'tags': json.loads(row[5]) if row[5] else [],
                'author': row[6],
                'license': row[7],
                'language': row[8],
                'requires_api_key': bool(row[9]),
                'requires_install': bool(row[10]),
                'docker_available': bool(row[11]),
                'web_interface': bool(row[12]),
                'is_whitelisted': bool(row[13]),
                'risk_level': row[14],
                'requires_approval': bool(row[15]),
                'added_date': row[16],
                'last_verified': row[17],
                'popularity_score': row[18]
            }
            tools.append(OsintTool.from_dict(tool_data))

        conn.close()
        self.tools = tools
        return tools

    def search(self, query: str, category: Optional[ToolCategory] = None) -> List[OsintTool]:
        """Search tools by name, description, or tags"""
        query_lower = query.lower()
        results = []

        for tool in self.tools:
            if category and tool.category != category:
                continue

            if (query_lower in tool.name.lower() or
                query_lower in tool.description.lower() or
                any(query_lower in tag.lower() for tag in tool.tags)):
                results.append(tool)

        return results

    def get_by_category(self, category: ToolCategory) -> List[OsintTool]:
        """Get all tools in a category"""
        return [tool for tool in self.tools if tool.category == category]

    def create_snapshot(self) -> str:
        """Create a snapshot of current catalog"""
        snapshot_date = datetime.now().isoformat()
        snapshot_data = {
            'date': snapshot_date,
            'tool_count': len(self.tools),
            'tools': [tool.to_dict() for tool in self.tools]
        }

        # Save to database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO snapshots (snapshot_date, tool_count, data_json)
            VALUES (?, ?, ?)
        ''', (snapshot_date, len(self.tools), json.dumps(snapshot_data)))

        conn.commit()
        conn.close()

        # Save to file
        snapshot_file = Path(f"osint/registry/snapshots/snapshot_{snapshot_date.replace(':', '').replace('.', '')[:15]}.json")
        snapshot_file.parent.mkdir(parents=True, exist_ok=True)

        with open(snapshot_file, 'w', encoding='utf-8') as f:
            json.dump(snapshot_data, f, indent=2, ensure_ascii=False)

        return str(snapshot_file)

    def export_to_json(self, output_path: str):
        """Export catalog to JSON file"""
        data = {
            'version': '1.3.0',
            'generated': datetime.now().isoformat(),
            'tool_count': len(self.tools),
            'tools': [tool.to_dict() for tool in self.tools]
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def get_statistics(self) -> Dict[str, Any]:
        """Get catalog statistics"""
        stats = {
            'total_tools': len(self.tools),
            'by_category': {},
            'whitelisted': sum(1 for t in self.tools if t.is_whitelisted),
            'requires_approval': sum(1 for t in self.tools if t.requires_approval),
            'web_interface': sum(1 for t in self.tools if t.web_interface),
            'docker_available': sum(1 for t in self.tools if t.docker_available)
        }

        for category in ToolCategory:
            count = sum(1 for t in self.tools if t.category == category)
            stats['by_category'][category.value] = count

        return stats
