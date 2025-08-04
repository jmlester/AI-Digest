
import type { Email, AiBrief } from '../types';
import { cleanUrl } from '../utils/url';

function calculateTimeRange(emails: Email[]): string {
    if (!emails || emails.length === 0) {
        return "N/A";
    }
    const dates = emails.map(email => new Date(email.date));
    const earliest = new Date(Math.min.apply(null, dates.map(d => d.getTime())));
    const latest = new Date(Math.max.apply(null, dates.map(d => d.getTime())));
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    return `${formatDate(earliest)} to ${formatDate(latest)}`;
}

export function generateBrief(emails: Email[]): Promise<AiBrief> {
    const uniqueSources = new Set(emails.map(e => e.from)).size;
    const newslettersScanned = emails.length;
    const timeRange = calculateTimeRange(emails);

    const mockBrief: AiBrief = {
        top_headlines: [
            {
                headline: "Generative AI Reaches New Milestone in Code Generation",
                summary: "A new model has demonstrated the ability to write complex, production-ready software with minimal human intervention.",
                why_it_matters: "This breakthrough could dramatically accelerate software development cycles and change the role of developers.",
                url: cleanUrl("https://www.example.com/news/gen-ai-milestone?utm_source=newsletter"),
            },
            {
                headline: "Ethical AI Frameworks Proposed by International Consortium",
                summary: "A global group of researchers and policymakers have released a new set of guidelines for the responsible development of AI.",
                why_it_matters: "Standardized ethical guidelines are crucial for building public trust and ensuring AI is developed safely.",
                url: cleanUrl("https://www.example.com/news/ethical-ai-framework"),
            },
        ],
        tools_to_try: [
            {
                name: "DataScribe v2.0",
                description: "An AI-powered tool that automatically cleans, labels, and documents datasets, saving data scientists hours of manual work.",
                url: cleanUrl("https://www.example.com/tools/datascribe"),
            },
        ],
        tips_to_try: [
            {
                name: "Optimizing Prompts for JSON Output",
                description: "Structure your prompts with clear examples and specify the desired schema to improve the reliability of JSON-based AI responses.",
                url: cleanUrl("https://www.example.com/tips/json-prompts"),
            }
        ],
        quick_stats: {
            newsletters_scanned: newslettersScanned,
            unique_sources: uniqueSources,
            time_range: timeRange,
        },
    };

    return new Promise(resolve => {
        setTimeout(() => {
            resolve(mockBrief);
        }, 1500); // Simulate network delay
    });
}
