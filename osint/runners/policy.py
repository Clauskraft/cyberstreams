"""
Policy Engine for OSINT Tool Execution

Enforces security policies and compliance rules for tool execution.
"""

from dataclasses import dataclass
from enum import Enum
from typing import List, Optional
import os


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ExecutionPolicy:
    """Execution policy configuration"""

    # Whitelist control
    require_whitelist: bool = True
    allow_medium_risk: bool = True
    allow_high_risk: bool = False

    # Approval requirements
    require_approval_for_new_tools: bool = True
    require_approval_for_high_risk: bool = True

    # Resource limits
    max_concurrent_executions: int = 3
    execution_timeout_seconds: int = 300

    # Network control
    allow_internet_access: bool = True
    allow_tor_access: bool = False

    # Data protection
    log_all_executions: bool = True
    sanitize_output: bool = True

    # Compliance
    gdpr_compliant_only: bool = False
    enforce_license_compliance: bool = True

# Default defensive policy
DEFENSIVE_POLICY = ExecutionPolicy(
    require_whitelist=True,
    allow_medium_risk=True,
    allow_high_risk=False,
    require_approval_for_new_tools=True,
    require_approval_for_high_risk=True,
    allow_tor_access=False
)

# Permissive policy for testing
PERMISSIVE_POLICY = ExecutionPolicy(
    require_whitelist=False,
    allow_medium_risk=True,
    allow_high_risk=True,
    require_approval_for_new_tools=False,
    allow_tor_access=True
)


class PolicyEngine:
    """Enforce execution policies"""

    def __init__(self, policy: ExecutionPolicy = DEFENSIVE_POLICY):
        self.policy = policy
        self._active_executions = 0

    def can_execute(self, tool_name: str, is_whitelisted: bool,
                   risk_level: str, requires_approval: bool) -> tuple[bool, Optional[str]]:
        """
        Check if tool execution is allowed

        Returns: (allowed: bool, reason: Optional[str])
        """

        # Check whitelist
        if self.policy.require_whitelist and not is_whitelisted:
            return False, "Tool not whitelisted"

        # Check risk level
        risk = RiskLevel(risk_level)
        if risk == RiskLevel.HIGH and not self.policy.allow_high_risk:
            return False, "High-risk tools not allowed by policy"

        if risk == RiskLevel.CRITICAL:
            return False, "Critical-risk tools never allowed"

        # Check approval
        if requires_approval and self.policy.require_approval_for_new_tools:
            return False, "Tool requires manual approval"

        # Check concurrent executions
        if self._active_executions >= self.policy.max_concurrent_executions:
            return False, f"Max concurrent executions ({self.policy.max_concurrent_executions}) reached"

        return True, None

    def start_execution(self):
        """Mark execution as started"""
        self._active_executions += 1

    def end_execution(self):
        """Mark execution as ended"""
        self._active_executions = max(0, self._active_executions - 1)

    def get_execution_timeout(self) -> int:
        """Get execution timeout in seconds"""
        return self.policy.execution_timeout_seconds


# Environment-based policy selection
def get_policy_from_env() -> ExecutionPolicy:
    """Load policy from environment variables"""
    env_policy = os.getenv('OSINT_POLICY', 'defensive')

    if env_policy == 'permissive':
        return PERMISSIVE_POLICY
    else:
        return DEFENSIVE_POLICY
