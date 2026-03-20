export const ARCHITECTURE_JSON_PATTERN = `
Output must be a single JSON object with this exact shape:
{
  "components": [
    {
      "name": "string (2-80 chars, unique, case-insensitive)",
      "tech": "string (2-120 chars)",
      "reason": "string (8-220 chars, concise and beginner-friendly)",
      "alternatives": ["string", "string"],
      "risks": ["string"]
    }
  ],
  "connections": [
    {
      "from": "string (must match an existing component name)",
      "to": "string (must match an existing component name)",
      "type": "string"
    }
  ]
}

Rules:
- components and connections must be arrays
- max 80 components, max 300 connections
- no self-links (from === to)
- no duplicate connections with same from, to, and type
- no isolated components when more than two components exist
- alternatives and risks are optional but if present must be arrays of non-empty strings
`;
