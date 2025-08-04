import { GoogleGenAI, Type } from '@google/genai';
import type { Email, AiBrief, Stats } from '../types';
import { cleanUrl } from '../utils/url';

const briefSchema = {
    type: Type.OBJECT,
    properties: {
        top_headlines: {
            type: Type.ARRAY,
            description: "A list of the top 3-5 news headlines.",
            items: {
                type: Type.OBJECT,
                properties: {
                    headline: { type: Type.STRING, description: "The main headline of the news." },
                    summary: { type: Type.STRING, description: "A concise, one-sentence summary of the news." },
                    why_it_matters: { type: Type.STRING, description: "Why this news is important, 20 words or fewer." },
                    url: { type: Type.STRING, description: "The canonical source URL for the article." },
                },
                required: ["headline", "summary", "why_it_matters", "url"],
            },
        },
        tools_to_try: {
            type: Type.ARRAY,
            description: "A list of new or trending AI tools mentioned.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the tool." },
                    description: { type: Type.STRING, description: "A one-sentence description of what the tool does and why it is trending." },
                    url: { type: Type.STRING, description: "The homepage or article URL for the tool." },
                },
                required: ["name", "description", "url"],
            },
        },
        tips_to_try: {
            type: Type.ARRAY,
            description: "A list of actionable tips or techniques mentioned.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "A short title for the tip." },
                    description: { type: Type.STRING, description: "A one-sentence description of the tip or technique." },
                    url: { type: Type.STRING, description: "A source URL for the tip." },
                },
                required: ["name", "description", "url"],
            }
        },
        quick_stats: {
            type: Type.OBJECT,
            description: "Statistics about the scanned newsletters.",
            properties: {
                newsletters_scanned: { type: Type.NUMBER, description: "Total number of newsletters processed." },
                unique_sources: { type: Type.NUMBER, description: "Count of unique newsletter sources (senders)." },
            },
            required: ["newsletters_scanned", "unique_sources"],
        },
    },
    required: ["top_headlines", "tools_to_try", "tips_to_try", "quick_stats"],
};

function formatEmailContentForPrompt(emails: Email[]): string {
    return emails.map((email, index) => {
        return `--- EMAIL ${index + 1} | From: ${email.from} | Date: ${email.date} ---\n\n${email.body}\n\n--- END EMAIL ${index + 1} ---`;
    }).join('\n\n');
}

function calculateTimeRange(emails: Email[]): string {
    if (!emails || emails.length === 0) {
        return "N/A";
    }

    const dates = emails.map(email => new Date(email.date)).filter(date => !isNaN(date.getTime()));

    if (dates.length === 0) {
        return "N/A";
    }

    const earliest = new Date(Math.min.apply(null, dates.map(d => d.getTime())));
    const latest = new Date(Math.max.apply(null, dates.map(d => d.getTime())));

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const earliestStr = formatDate(earliest);
    const latestStr = formatDate(latest);

    if (earliestStr === latestStr) {
        return latestStr;
    }

    return `${earliestStr} to ${latestStr}`;
}


export async function generateBrief(emails: Email[], apiKey: string): Promise<AiBrief> {
    if (!apiKey) {
        throw new Error("Gemini API Key is not provided.");
    }
    
    const ai = new GoogleGenAI({ apiKey });

    const emailContent = formatEmailContentForPrompt(emails);
    const timeRange = calculateTimeRange(emails);

    const systemInstruction = `You are an expert analyst specializing in AI. Your task is to read AI newsletters and synthesize them into a concise 'Daily AI Brief'.
    - Analyze the content to identify key information.
    - Extract top headlines, new tools, actionable tips or techniques, and calculate summary statistics.
    - For statistics, you MUST calculate the total number of newsletters scanned and the count of unique sources based on the 'From' field.
    - Before providing any URL, you MUST strip all tracking parameters (like utm_*, fbclid, etc.).
    - Adhere strictly to the provided JSON schema for your output. Do not output any text outside the JSON structure.
    - If a section has no content, return an empty array for it.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: emailContent,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: briefSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const partialBriefData = JSON.parse(jsonText) as Omit<AiBrief, 'quick_stats'> & { quick_stats: Omit<Stats, 'time_range'> };
        
        const briefData: AiBrief = {
            ...partialBriefData,
            quick_stats: {
                ...partialBriefData.quick_stats,
                time_range: timeRange,
            }
        };

        // Clean all URLs in the returned data
        if (briefData.top_headlines) {
            briefData.top_headlines.forEach(h => h.url = cleanUrl(h.url));
        }
        if (briefData.tools_to_try) {
            briefData.tools_to_try.forEach(t => t.url = cleanUrl(t.url));
        }
        if (briefData.tips_to_try) {
            briefData.tips_to_try.forEach(t => t.url = cleanUrl(t.url));
        }
        
        return briefData;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Could not get a valid response from the AI. The content might be empty or restricted.");
    }
}
