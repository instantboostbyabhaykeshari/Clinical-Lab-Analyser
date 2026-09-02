import json
import sys
from pathlib import Path
from typing import Any

import anyio
from mcp.client.session import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client

from app.mcp.reference_tools import reference_range_lookup


BACKEND_ROOT = Path(__file__).resolve().parents[2]


async def _lookup_reference_range_async(test_name: str) -> dict[str, Any] | None:
    server = StdioServerParameters(
        command=sys.executable,
        args=["-m", "app.mcp.server"],
        cwd=str(BACKEND_ROOT),
    )

    async with stdio_client(server) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            result = await session.call_tool(
                "lookup_reference_range",
                {"test_name": test_name},
            )

    if result.structured_content is not None:
        return result.structured_content

    if result.content:
        first_content = result.content[0]
        text = getattr(first_content, "text", None)
        if text:
            return json.loads(text)

    return None


def lookup_reference_range_via_mcp(test_name: str) -> dict[str, Any] | None:
    try:
        return anyio.run(_lookup_reference_range_async, test_name)
    except Exception:
        return reference_range_lookup(test_name)
