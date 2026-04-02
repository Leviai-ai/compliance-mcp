# AI Compliance Calendar MCP Server - Demo

## Quick Tool Demonstration

### 1. Get EU AI Act Details
```bash
# Tool: get_regulations
{
  "jurisdiction": "EU", 
  "category": ["safety"]
}
```
**Result:** EU AI Act with comprehensive requirements, deadlines (Aug 2026), and penalties up to €35M

### 2. Upcoming Deadlines
```bash  
# Tool: compliance_calendar
{
  "jurisdiction": "EU",
  "days_ahead": 730
}
```
**Result:** Critical deadlines including Feb 2025 prohibited practices ban and Aug 2026 full compliance

### 3. Risk Assessment for HR AI
```bash
# Tool: risk_assessment  
{
  "use_case": "hiring-screening",
  "jurisdictions": ["US", "EU", "UK"]
}
```
**Result:** 
- **EU**: High-risk classification, bias testing required
- **US**: EEOC compliance, NYC Local Law 144 audits
- **UK**: Equality Act considerations

### 4. Recent Policy Updates
```bash
# Tool: policy_updates
{
  "days_back": 60,
  "impact_level": "high"
}
```
**Result:** Latest EU implementing acts, NIST guidance updates, California amendments

### 5. Compare EU vs US Approach
```bash
# Tool: jurisdiction_compare
{
  "jurisdictions": ["EU", "US"],
  "focus_area": "penalties"  
}
```
**Result:** EU has specific AI penalties (€35M), US relies on sector-specific enforcement

### 6. Detailed EU AI Act Summary
```bash
# Tool: regulation_summary
{
  "regulation_id": "eu-ai-act"
}
```
**Result:** Complete breakdown including risk levels, timeline, implementing acts schedule

## Real Data Coverage

✅ **8 Major Jurisdictions** — EU, US, UK, Canada, China, Singapore  
✅ **40+ Compliance Deadlines** — Never miss critical dates  
✅ **6 Risk Templates** — Healthcare, HR, Finance, Automotive, etc.  
✅ **Recent Updates** — Policy changes from 2024  
✅ **Zero API Dependencies** — All data local and fast

## Perfect For

- 🏛️ **Legal teams** tracking multi-jurisdictional compliance
- 💻 **AI developers** assessing deployment risks  
- 📊 **Compliance officers** monitoring deadlines
- 🔍 **Consultants** advising on regulatory landscape

**Built for practitioners who need reliable compliance intel.**