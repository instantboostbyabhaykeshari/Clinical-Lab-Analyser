from mcp.server.fastmcp import FastMCP

from app.mcp.reference_tools import reference_range_lookup


mcp = FastMCP("clinical-lab-reference-server")


@mcp.tool()
def lookup_reference_range(test_name: str) -> dict | None:
    """Look up the configured reference range for a lab test name."""
    return reference_range_lookup(test_name)


if __name__ == "__main__":
    mcp.run()
