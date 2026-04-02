# AI Compliance Calendar MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Compatible-green)](https://modelcontextprotocol.io/)

> 🏛️ **AI Compliance Calendar** — Your comprehensive AI regulations and compliance deadline tracker

Track AI regulations, deadlines, risk assessments, and policy updates across global jurisdictions. Never miss a compliance deadline again.

## 🌍 Coverage

**Jurisdictions:** EU, US, UK, Canada, China, Singapore  
**Regulations:** EU AI Act, CCPA/CPRA, NIST AI Framework, UK AI Act, Canada AIDA, and more  
**Data:** Pre-populated with real compliance data and deadlines

## 🛠️ Tools

### 1. **get_regulations**
Search and filter AI regulations by jurisdiction, category, and status.
```
jurisdiction: US | EU | UK | CA | CN | SG (optional)
category: privacy, safety, transparency, governance (optional) 
status: active, enacted, draft, bill, guidance (optional)
search: free text search (optional)
```

### 2. **compliance_calendar** 
Get upcoming compliance deadlines and milestones with priority levels.
```
jurisdiction: filter by region (optional)
days_ahead: how far to look ahead (default: 365)
priority: critical, high, medium, low (optional)
regulation: specific regulation filter (optional)
```

### 3. **regulation_summary**
Detailed breakdown of specific AI regulations including requirements and timelines.
```
regulation_id: eu-ai-act, ccpa, nist-ai-framework, etc.
```

### 4. **risk_assessment**
Assess compliance risks for AI use cases across jurisdictions.
```
use_case: healthcare-diagnosis, hiring-screening, content-moderation, etc.
jurisdictions: array of jurisdictions to assess
custom_description: for custom use cases (optional)
```

### 5. **policy_updates**
Track recent policy changes and regulatory developments.
```  
jurisdiction: filter by region (optional)
regulation: filter by regulation (optional)
days_back: how far back to search (default: 90)
impact_level: high, medium, low (optional)
```

### 6. **jurisdiction_compare**
Compare AI regulations across multiple jurisdictions.
```
jurisdictions: array of jurisdictions to compare
focus_area: privacy, safety, transparency, penalties, timelines (optional)
```

## 🎯 Use Cases

- **Legal Teams**: Track compliance deadlines and regulatory changes
- **AI Developers**: Assess risks for AI systems across markets  
- **Compliance Officers**: Monitor upcoming requirements and deadlines
- **Policy Researchers**: Compare regulatory approaches globally
- **Consultants**: Advise clients on multi-jurisdictional compliance

## 🚀 Quick Start

### Install & Build
```bash
cd /path/to/compliance-mcp
npm install
npm run build
```

### Test the Server
```bash
npm run dev
```

### Use with Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "compliance-mcp": {
      "command": "node",
      "args": ["/path/to/compliance-mcp/build/index.js"]
    }
  }
}
```

## 📊 Data Coverage

### Regulations Tracked
- **🇪🇺 EU AI Act** (2024-2026 timeline)
- **🇺🇸 CCPA/CPRA** (California privacy laws)
- **🇺🇸 NIST AI Framework** (Federal guidance)
- **🇬🇧 UK AI Act** (Draft legislation) 
- **🇨🇦 Canada AIDA** (Bill C-27)
- **🇨🇳 Algorithm Provisions** (China)
- **🇸🇬 Model AI Governance** (Singapore)

### Risk Assessment Templates
- Healthcare diagnosis systems
- Hiring and recruitment AI
- Content moderation systems  
- Financial credit scoring
- Autonomous vehicles
- Customer service chatbots

### Compliance Calendar Highlights
- **🔴 Aug 2, 2026**: EU AI Act full compliance deadline
- **🟠 Feb 2, 2025**: EU AI Act prohibited practices ban
- **🟡 2024-2025**: Multiple regulatory guidance releases

## 🏗️ Architecture

```
src/
├── index.ts              # Main MCP server implementation
└── data/                 # JSON databases (no external APIs needed)
    ├── regulations.json  # Comprehensive regulation data
    ├── calendar.json     # Compliance deadlines & milestones  
    ├── risk-templates.json # Risk assessment templates
    └── policy-updates.json # Recent policy developments
```

**Features:**
- ✅ **Zero API dependencies** — all data local
- ✅ **Real regulation data** — not synthetic
- ✅ **Multi-jurisdiction** — global coverage
- ✅ **Risk-based approach** — practical assessments
- ✅ **Calendar integration** — never miss deadlines

## 📄 Example Queries

**"What are the upcoming EU AI Act deadlines?"**
```
compliance_calendar(jurisdiction="EU", regulation="eu-ai-act")
```

**"Assess hiring AI risks in US and EU"**
```
risk_assessment(use_case="hiring-screening", jurisdictions=["US", "EU"])
```

**"What's new in AI policy this month?"**
```
policy_updates(days_back=30, impact_level="high")
```

**"Compare privacy approaches: EU vs US"**
```  
jurisdiction_compare(jurisdictions=["EU", "US"], focus_area="privacy")
```

## 🔄 Updates

The regulation database is manually curated from official sources and updated regularly. Key data sources:
- EU AI Act official text and implementing acts
- NIST AI Risk Management Framework
- State and federal AI legislation (US)
- Regulatory guidance documents
- Official government publications

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions welcome! Please:
1. Ensure data accuracy with official sources
2. Follow the existing JSON schema
3. Update both data files and documentation
4. Test thoroughly before submitting

---

**⚖️ Built for AI practitioners who take compliance seriously.**

*Note: This tool provides information for educational purposes. Always consult with qualified legal professionals for compliance advice.*