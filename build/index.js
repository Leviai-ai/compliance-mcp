#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
// ─── Data Loading ─────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function loadJsonData(filename) {
    const filePath = join(__dirname, "data", filename);
    const data = readFileSync(filePath, "utf-8");
    return JSON.parse(data);
}
// Load data
const regulations = loadJsonData("regulations.json");
const calendarEvents = loadJsonData("calendar.json");
const riskTemplates = loadJsonData("risk-templates.json");
const policyUpdates = loadJsonData("policy-updates.json");
// ─── Helper Functions ──────────────────────────────────────────────────────
function normalizeJurisdiction(jurisdiction) {
    const mapping = {
        "us": "US",
        "usa": "US",
        "united states": "US",
        "eu": "EU",
        "europe": "EU",
        "european union": "EU",
        "uk": "UK",
        "united kingdom": "UK",
        "ca": "CA",
        "canada": "CA",
        "cn": "CN",
        "china": "CN",
        "sg": "SG",
        "singapore": "SG"
    };
    const normalized = jurisdiction.toLowerCase();
    return mapping[normalized] || jurisdiction.toUpperCase();
}
function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }
    catch {
        return dateStr;
    }
}
function isUpcoming(dateStr, daysAhead = 365) {
    try {
        const eventDate = new Date(dateStr);
        const now = new Date();
        const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
        return eventDate > now && eventDate <= futureDate;
    }
    catch {
        return false;
    }
}
function sortByDate(events) {
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
function getPriorityIcon(priority) {
    switch (priority.toLowerCase()) {
        case "critical": return "🔴";
        case "high": return "🟠";
        case "medium": return "🟡";
        case "low": return "🟢";
        default: return "⚪";
    }
}
function getRiskIcon(riskLevel) {
    switch (riskLevel.toLowerCase()) {
        case "critical": return "🔴";
        case "high": return "🟠";
        case "medium-high": return "🟠";
        case "medium": return "🟡";
        case "low-medium": return "🟡";
        case "low": return "🟢";
        default: return "⚪";
    }
}
// ─── MCP Server Setup ──────────────────────────────────────────────────────
const server = new McpServer({
    name: "compliance-mcp",
    version: "1.0.0",
});
// ─── Tool 1: Get Regulations ───────────────────────────────────────────────
server.tool("get_regulations", "Search and filter AI regulations by jurisdiction, category, and status. Returns comprehensive regulatory information including requirements, deadlines, and penalties.", {
    jurisdiction: z.string().optional().describe("Filter by jurisdiction (US, EU, UK, CA, CN, SG) - case insensitive"),
    category: z.array(z.string()).optional().describe("Filter by category: privacy, safety, transparency, governance, risk-management, algorithmic-accountability"),
    status: z.string().optional().describe("Filter by status: active, enacted, draft, bill, guidance"),
    search: z.string().optional().describe("Search term to filter regulations by name or description")
}, async ({ jurisdiction, category, status, search }) => {
    let filtered = regulations;
    // Filter by jurisdiction
    if (jurisdiction) {
        const normalizedJurisdiction = normalizeJurisdiction(jurisdiction);
        filtered = filtered.filter(r => r.jurisdiction.toUpperCase() === normalizedJurisdiction ||
            r.jurisdiction.toUpperCase().includes(normalizedJurisdiction));
    }
    // Filter by category
    if (category && category.length > 0) {
        filtered = filtered.filter(r => category.some(c => r.category.includes(c.toLowerCase())));
    }
    // Filter by status
    if (status) {
        filtered = filtered.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }
    // Search filter
    if (search) {
        const searchTerm = search.toLowerCase();
        filtered = filtered.filter(r => r.name.toLowerCase().includes(searchTerm) ||
            r.description.toLowerCase().includes(searchTerm));
    }
    if (filtered.length === 0) {
        return {
            content: [{
                    type: "text",
                    text: "No regulations found matching the specified criteria."
                }]
        };
    }
    const results = filtered.map(reg => {
        const sections = [
            `📋 **${reg.name}** (${reg.jurisdiction})`,
            `Status: ${reg.status.toUpperCase()}`,
            `Categories: ${reg.category.join(", ")}`,
            "",
            `**Description:**`,
            reg.description,
            ""
        ];
        // Add dates
        if (reg.enactmentDate) {
            sections.push(`⏰ **Enacted:** ${formatDate(reg.enactmentDate)}`);
        }
        if (reg.applicabilityDate) {
            sections.push(`📅 **Applicable:** ${formatDate(reg.applicabilityDate)}`);
        }
        if (reg.fullComplianceDate) {
            sections.push(`⚠️  **Full Compliance:** ${formatDate(reg.fullComplianceDate)}`);
        }
        if (reg.expectedEnactment) {
            sections.push(`🔮 **Expected Enactment:** ${formatDate(reg.expectedEnactment)}`);
        }
        sections.push("");
        // Key requirements
        if (reg.keyRequirements.length > 0) {
            sections.push("**Key Requirements:**");
            reg.keyRequirements.forEach(req => sections.push(`• ${req}`));
            sections.push("");
        }
        // Risk levels
        if (reg.riskLevels) {
            sections.push(`**Risk Levels:** ${reg.riskLevels.join(", ")}`);
            sections.push("");
        }
        // Penalties
        if (reg.penalties) {
            sections.push(`⚖️  **Penalties:** ${reg.penalties}`);
            sections.push("");
        }
        return sections.join("\\n");
    });
    const output = [
        `🔍 Found ${filtered.length} regulation(s):\\n`,
        ...results
    ].join("\\n");
    return {
        content: [{
                type: "text",
                text: output
            }]
    };
});
// ─── Tool 2: Compliance Calendar ───────────────────────────────────────────
server.tool("compliance_calendar", "Get upcoming compliance deadlines and milestones. Shows critical dates for AI regulations across jurisdictions with priority levels and requirements.", {
    jurisdiction: z.string().optional().describe("Filter by jurisdiction (US, EU, UK, CA, CN, SG)"),
    days_ahead: z.number().optional().describe("Number of days to look ahead (default: 365)"),
    priority: z.string().optional().describe("Filter by priority level: critical, high, medium, low"),
    regulation: z.string().optional().describe("Filter by specific regulation ID")
}, async ({ jurisdiction, days_ahead = 365, priority, regulation }) => {
    let filtered = calendarEvents;
    // Filter by upcoming dates
    filtered = filtered.filter(event => !event.status || event.status !== "passed");
    // Filter by jurisdiction (through regulation lookup)
    if (jurisdiction) {
        const normalizedJurisdiction = normalizeJurisdiction(jurisdiction);
        const jurisdictionRegulations = regulations
            .filter(r => r.jurisdiction.toUpperCase().includes(normalizedJurisdiction))
            .map(r => r.id);
        filtered = filtered.filter(event => jurisdictionRegulations.includes(event.regulation));
    }
    // Filter by priority
    if (priority) {
        filtered = filtered.filter(event => event.priority.toLowerCase() === priority.toLowerCase());
    }
    // Filter by regulation
    if (regulation) {
        filtered = filtered.filter(event => event.regulation.toLowerCase() === regulation.toLowerCase());
    }
    // Filter by date range
    filtered = filtered.filter(event => isUpcoming(event.date, days_ahead));
    // Sort by date
    const sortedEvents = sortByDate(filtered);
    if (sortedEvents.length === 0) {
        return {
            content: [{
                    type: "text",
                    text: "No upcoming compliance deadlines found for the specified criteria."
                }]
        };
    }
    const results = sortedEvents.map(event => {
        const reg = regulations.find(r => r.id === event.regulation);
        const icon = getPriorityIcon(event.priority);
        const sections = [
            `${icon} **${event.title}**`,
            `📅 **Date:** ${formatDate(event.date)}`,
            `⚖️  **Regulation:** ${reg?.name || event.regulation}`,
            `🎯 **Type:** ${event.type.replace("-", " ")}`,
            `⚡ **Priority:** ${event.priority.toUpperCase()}`,
            "",
            `**Description:**`,
            event.description,
            ""
        ];
        // Affected sectors
        if (event.affectedSectors.length > 0) {
            sections.push(`🏢 **Affected Sectors:** ${event.affectedSectors.join(", ")}`);
            sections.push("");
        }
        // Requirements
        if (event.requirements && event.requirements.length > 0) {
            sections.push("**Requirements:**");
            event.requirements.forEach(req => sections.push(`• ${req}`));
            sections.push("");
        }
        return sections.join("\\n");
    });
    const now = new Date();
    const output = [
        `📅 **AI Compliance Calendar** (Next ${days_ahead} days from ${formatDate(now.toISOString())})\\n`,
        `Found ${sortedEvents.length} upcoming deadline(s):\\n`,
        ...results
    ].join("\\n");
    return {
        content: [{
                type: "text",
                text: output
            }]
    };
});
// ─── Tool 3: Regulation Summary ────────────────────────────────────────────
server.tool("regulation_summary", "Get detailed breakdown of a specific AI regulation including full requirements, timelines, penalties, and implementation guidance.", {
    regulation_id: z.string().describe("Regulation ID (e.g., 'eu-ai-act', 'ccpa', 'nist-ai-framework')")
}, async ({ regulation_id }) => {
    const reg = regulations.find(r => r.id.toLowerCase() === regulation_id.toLowerCase() ||
        r.name.toLowerCase().includes(regulation_id.toLowerCase()));
    if (!reg) {
        const availableIds = regulations.map(r => r.id).join(", ");
        return {
            content: [{
                    type: "text",
                    text: `Regulation not found. Available regulation IDs: ${availableIds}`
                }]
        };
    }
    // Find related calendar events
    const relatedEvents = calendarEvents.filter(e => e.regulation === reg.id);
    // Find related policy updates
    const relatedUpdates = policyUpdates
        .filter(u => u.regulation === reg.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
    const sections = [
        `📋 **${reg.name}**\\n`,
        `🌍 **Jurisdiction:** ${reg.jurisdiction}`,
        `📊 **Status:** ${reg.status.toUpperCase()}`,
        `🏷️  **Categories:** ${reg.category.join(", ")}`,
        ""
    ];
    // Dates section
    const dates = [];
    if (reg.enactmentDate)
        dates.push(`⚡ **Enacted:** ${formatDate(reg.enactmentDate)}`);
    if (reg.applicabilityDate)
        dates.push(`📅 **Applicable:** ${formatDate(reg.applicabilityDate)}`);
    if (reg.fullComplianceDate)
        dates.push(`⚠️  **Full Compliance:** ${formatDate(reg.fullComplianceDate)}`);
    if (reg.expectedEnactment)
        dates.push(`🔮 **Expected:** ${formatDate(reg.expectedEnactment)}`);
    if (dates.length > 0) {
        sections.push("**Important Dates:**");
        sections.push(...dates);
        sections.push("");
    }
    // Description
    sections.push("**Overview:**");
    sections.push(reg.description);
    sections.push("");
    // Risk levels
    if (reg.riskLevels && reg.riskLevels.length > 0) {
        sections.push("**Risk Classification System:**");
        reg.riskLevels.forEach(level => sections.push(`• ${level}`));
        sections.push("");
    }
    // Key requirements
    sections.push("**Key Requirements:**");
    reg.keyRequirements.forEach(req => sections.push(`• ${req}`));
    sections.push("");
    // Penalties
    if (reg.penalties) {
        sections.push(`⚖️  **Penalties:** ${reg.penalties}`);
        sections.push("");
    }
    // Related calendar events
    if (relatedEvents.length > 0) {
        sections.push("**📅 Upcoming Deadlines:**");
        relatedEvents
            .filter(e => !e.status || e.status !== "passed")
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .forEach(event => {
            const icon = getPriorityIcon(event.priority);
            sections.push(`${icon} ${formatDate(event.date)}: ${event.title}`);
        });
        sections.push("");
    }
    // Recent policy updates
    if (relatedUpdates.length > 0) {
        sections.push("**📰 Recent Updates:**");
        relatedUpdates.forEach(update => {
            sections.push(`• ${formatDate(update.date)}: ${update.title}`);
        });
        sections.push("");
    }
    return {
        content: [{
                type: "text",
                text: sections.join("\\n")
            }]
    };
});
// ─── Tool 4: Risk Assessment ───────────────────────────────────────────────
server.tool("risk_assessment", "Assess compliance risks for an AI use case across specified jurisdictions. Provides risk levels, classification, and specific requirements based on use case.", {
    use_case: z.string().describe("AI use case (e.g., 'healthcare-diagnosis', 'hiring-screening', 'content-moderation', 'financial-credit-scoring', 'autonomous-vehicle', 'chatbot-customer-service')"),
    jurisdictions: z.array(z.string()).describe("Jurisdictions to assess (US, EU, UK, CA, CN, SG)"),
    custom_description: z.string().optional().describe("Custom description if use case not in templates")
}, async ({ use_case, jurisdictions, custom_description }) => {
    const template = riskTemplates.find(t => t.useCase.toLowerCase() === use_case.toLowerCase() ||
        t.useCase.toLowerCase().includes(use_case.toLowerCase()));
    if (!template && !custom_description) {
        const availableUseCases = riskTemplates.map(t => t.useCase).join(", ");
        return {
            content: [{
                    type: "text",
                    text: `Use case template not found. Available templates: ${availableUseCases}\\n\\nAlternatively, provide a custom_description for a general assessment.`
                }]
        };
    }
    const normalizedJurisdictions = jurisdictions.map(j => normalizeJurisdiction(j));
    const sections = [
        `🎯 **AI Risk Assessment**\\n`,
        `**Use Case:** ${template?.useCase || use_case}`,
        `**Description:** ${template?.description || custom_description}`,
        `**Jurisdictions:** ${normalizedJurisdictions.join(", ")}`,
        ""
    ];
    if (template) {
        // Template-based assessment
        normalizedJurisdictions.forEach(jurisdiction => {
            const jurisdictionKey = jurisdiction.toLowerCase();
            const risk = template.inherentRisks[jurisdictionKey];
            if (risk) {
                const icon = getRiskIcon(risk.riskLevel);
                sections.push(`${icon} **${jurisdiction} Analysis:**`);
                sections.push(`📊 **Classification:** ${risk.classification}`);
                sections.push(`🎯 **Risk Level:** ${risk.riskLevel.toUpperCase()}`);
                sections.push(`💭 **Reasoning:** ${risk.reasoning}`);
                sections.push("");
                sections.push("**Requirements:**");
                risk.requirements.forEach(req => sections.push(`• ${req}`));
                sections.push("");
            }
            else {
                sections.push(`⚪ **${jurisdiction}:** No specific template data available`);
                sections.push("");
            }
        });
    }
    else {
        // General assessment based on regulations
        normalizedJurisdictions.forEach(jurisdiction => {
            const relevantRegs = regulations.filter(r => r.jurisdiction.toUpperCase().includes(jurisdiction) ||
                r.jurisdiction.toUpperCase() === jurisdiction);
            if (relevantRegs.length > 0) {
                sections.push(`⚪ **${jurisdiction} General Assessment:**`);
                sections.push("**Applicable Regulations:**");
                relevantRegs.forEach(reg => {
                    sections.push(`• ${reg.name} (${reg.status})`);
                });
                sections.push("");
                sections.push("**General Requirements:**");
                const allRequirements = relevantRegs.flatMap(r => r.keyRequirements);
                const uniqueRequirements = [...new Set(allRequirements)].slice(0, 10);
                uniqueRequirements.forEach(req => sections.push(`• ${req}`));
                sections.push("");
            }
            else {
                sections.push(`❓ **${jurisdiction}:** No specific AI regulations found in database`);
                sections.push("");
            }
        });
    }
    // Risk mitigation recommendations
    sections.push("**🛡️  General Risk Mitigation Strategies:**");
    sections.push("• Implement comprehensive data governance framework");
    sections.push("• Establish AI ethics and oversight committee");
    sections.push("• Conduct regular algorithmic audits and bias testing");
    sections.push("• Maintain detailed documentation and audit trails");
    sections.push("• Implement human oversight and intervention mechanisms");
    sections.push("• Establish incident response and reporting procedures");
    sections.push("• Ensure transparency and explainability where required");
    sections.push("• Regular compliance monitoring and updates");
    return {
        content: [{
                type: "text",
                text: sections.join("\\n")
            }]
    };
});
// ─── Tool 5: Policy Updates ────────────────────────────────────────────────
server.tool("policy_updates", "Get recent policy changes and regulatory updates in AI governance. Track the latest developments across jurisdictions.", {
    jurisdiction: z.string().optional().describe("Filter by jurisdiction (US, EU, UK, CA, CN, SG)"),
    regulation: z.string().optional().describe("Filter by specific regulation"),
    days_back: z.number().optional().describe("Number of days to look back (default: 90)"),
    impact_level: z.string().optional().describe("Filter by impact level: high, medium, low")
}, async ({ jurisdiction, regulation, days_back = 90, impact_level }) => {
    let filtered = policyUpdates;
    // Filter by date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days_back);
    filtered = filtered.filter(update => new Date(update.date) >= cutoffDate);
    // Filter by jurisdiction
    if (jurisdiction) {
        const normalizedJurisdiction = normalizeJurisdiction(jurisdiction);
        const jurisdictionRegulations = regulations
            .filter(r => r.jurisdiction.toUpperCase().includes(normalizedJurisdiction))
            .map(r => r.id);
        filtered = filtered.filter(update => jurisdictionRegulations.includes(update.regulation) ||
            update.regulation.toLowerCase().includes(jurisdiction.toLowerCase()));
    }
    // Filter by regulation
    if (regulation) {
        filtered = filtered.filter(update => update.regulation.toLowerCase() === regulation.toLowerCase() ||
            update.title.toLowerCase().includes(regulation.toLowerCase()));
    }
    // Filter by impact level
    if (impact_level) {
        filtered = filtered.filter(update => update.impact.toLowerCase() === impact_level.toLowerCase());
    }
    // Sort by date (most recent first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filtered.length === 0) {
        return {
            content: [{
                    type: "text",
                    text: `No policy updates found in the last ${days_back} days for the specified criteria.`
                }]
        };
    }
    const results = filtered.map(update => {
        const reg = regulations.find(r => r.id === update.regulation);
        const impactIcon = update.impact === "high" ? "🔴" : update.impact === "medium" ? "🟡" : "🟢";
        const sections = [
            `${impactIcon} **${update.title}**`,
            `📅 **Date:** ${formatDate(update.date)}`,
            `⚖️  **Regulation:** ${reg?.name || update.regulation}`,
            `📊 **Type:** ${update.type.replace("-", " ")}`,
            `⚡ **Impact:** ${update.impact.toUpperCase()}`,
            "",
            `**Summary:**`,
            update.summary,
            ""
        ];
        // Key changes
        if (update.keyChanges.length > 0) {
            sections.push("**Key Changes:**");
            update.keyChanges.forEach(change => sections.push(`• ${change}`));
            sections.push("");
        }
        // Affected parties
        if (update.affectedParties.length > 0) {
            sections.push(`👥 **Affected Parties:** ${update.affectedParties.join(", ")}`);
            sections.push("");
        }
        return sections.join("\\n");
    });
    const output = [
        `📰 **AI Policy Updates** (Last ${days_back} days)\\n`,
        `Found ${filtered.length} update(s):\\n`,
        ...results
    ].join("\\n");
    return {
        content: [{
                type: "text",
                text: output
            }]
    };
});
// ─── Tool 6: Jurisdiction Compare ──────────────────────────────────────────
server.tool("jurisdiction_compare", "Compare AI regulations across multiple jurisdictions. Analyze differences in approach, requirements, timelines, and penalties.", {
    jurisdictions: z.array(z.string()).describe("Jurisdictions to compare (e.g., ['EU', 'US', 'UK'])"),
    focus_area: z.string().optional().describe("Specific area to focus on: privacy, safety, transparency, penalties, timelines")
}, async ({ jurisdictions, focus_area }) => {
    const normalizedJurisdictions = jurisdictions.map(j => normalizeJurisdiction(j));
    // Get regulations for each jurisdiction
    const jurisdictionData = normalizedJurisdictions.map(jurisdiction => {
        const jurisdictionRegs = regulations.filter(r => r.jurisdiction.toUpperCase().includes(jurisdiction) ||
            r.jurisdiction.toUpperCase() === jurisdiction);
        return {
            jurisdiction,
            regulations: jurisdictionRegs,
            count: jurisdictionRegs.length
        };
    });
    if (jurisdictionData.every(jd => jd.count === 0)) {
        return {
            content: [{
                    type: "text",
                    text: "No AI regulations found for the specified jurisdictions."
                }]
        };
    }
    const sections = [
        `⚖️  **AI Regulation Comparison**\\n`,
        `**Jurisdictions:** ${normalizedJurisdictions.join(" vs ")}`,
        ""
    ];
    // Overview table
    sections.push("**📊 Overview:**");
    jurisdictionData.forEach(jd => {
        const activeRegs = jd.regulations.filter(r => r.status === "active" || r.status === "enacted").length;
        sections.push(`• **${jd.jurisdiction}:** ${jd.count} total regulations (${activeRegs} active)`);
    });
    sections.push("");
    // Detailed comparison
    jurisdictionData.forEach(jd => {
        if (jd.regulations.length > 0) {
            sections.push(`🌍 **${jd.jurisdiction} Details:**`);
            jd.regulations.forEach(reg => {
                sections.push(`\\n📋 **${reg.name}**`);
                sections.push(`Status: ${reg.status.toUpperCase()}`);
                sections.push(`Categories: ${reg.category.join(", ")}`);
                if (focus_area) {
                    const focusAreaLower = focus_area.toLowerCase();
                    if (focusAreaLower === "penalties" && reg.penalties) {
                        sections.push(`⚖️  Penalties: ${reg.penalties}`);
                    }
                    else if (focusAreaLower === "timelines") {
                        if (reg.enactmentDate)
                            sections.push(`📅 Enacted: ${formatDate(reg.enactmentDate)}`);
                        if (reg.applicabilityDate)
                            sections.push(`📅 Applicable: ${formatDate(reg.applicabilityDate)}`);
                        if (reg.fullComplianceDate)
                            sections.push(`⚠️  Full Compliance: ${formatDate(reg.fullComplianceDate)}`);
                    }
                    else if (reg.category.includes(focusAreaLower)) {
                        sections.push("Key Requirements:");
                        reg.keyRequirements.slice(0, 5).forEach(req => sections.push(`• ${req}`));
                    }
                }
                else {
                    // General overview
                    if (reg.enactmentDate)
                        sections.push(`📅 Enacted: ${formatDate(reg.enactmentDate)}`);
                    if (reg.penalties)
                        sections.push(`⚖️  Penalties: ${reg.penalties}`);
                    sections.push(`📝 Description: ${reg.description.substring(0, 200)}...`);
                }
            });
            sections.push("");
        }
    });
    // Comparative analysis
    sections.push("**🔍 Comparative Analysis:**");
    // Status comparison
    const statusCount = {};
    jurisdictionData.forEach(jd => {
        jd.regulations.forEach(reg => {
            statusCount[reg.status] = (statusCount[reg.status] || 0) + 1;
        });
    });
    sections.push("**Regulatory Maturity:**");
    Object.entries(statusCount).forEach(([status, count]) => {
        sections.push(`• ${status.toUpperCase()}: ${count} regulation(s)`);
    });
    sections.push("");
    // Category focus
    const categoryCount = {};
    jurisdictionData.forEach(jd => {
        jd.regulations.forEach(reg => {
            reg.category.forEach(cat => {
                categoryCount[cat] = (categoryCount[cat] || 0) + 1;
            });
        });
    });
    sections.push("**Focus Areas:**");
    Object.entries(categoryCount)
        .sort(([, a], [, b]) => b - a)
        .forEach(([category, count]) => {
        sections.push(`• ${category}: ${count} regulation(s)`);
    });
    // Recommendations
    sections.push("");
    sections.push("**💡 Key Insights:**");
    if (jurisdictionData.some(jd => jd.regulations.some(r => r.status === "active" || r.status === "enacted"))) {
        sections.push("• Some jurisdictions have active AI regulations requiring immediate compliance");
    }
    if (jurisdictionData.some(jd => jd.regulations.some(r => r.fullComplianceDate))) {
        sections.push("• Multi-year compliance timelines exist - early preparation recommended");
    }
    if (categoryCount["safety"] > 1) {
        sections.push("• Safety is a common focus across jurisdictions");
    }
    if (categoryCount["transparency"] > 1) {
        sections.push("• Transparency requirements are becoming standard");
    }
    sections.push("• Consider implementing highest common denominator approach for global compliance");
    return {
        content: [{
                type: "text",
                text: sections.join("\\n")
            }]
    };
});
// ─── Start Server ──────────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map