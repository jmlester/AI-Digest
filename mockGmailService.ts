import type { Email } from '../types';

const generateMockEmails = (): Email[] => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    return [
        {
            id: 'mock1',
            from: 'AI News Weekly <contact@ainews.com>',
            subject: "AI Weekly: Generative AI's New Milestone",
            date: today.toISOString(),
            body: `
                <h1>Top Story: Generative AI Reaches New Milestone</h1>
                <p>A new model has demonstrated the ability to write complex, production-ready software with minimal human intervention. This breakthrough could dramatically accelerate software development cycles. Read more at https://www.example.com/news/gen-ai-milestone?utm_source=newsletter&utm_campaign=weekly_digest</p>
                <h2>New Tool Alert: DataScribe v2.0</h2>
                <p>Check out DataScribe, an AI-powered tool that automatically cleans and labels datasets. Find it here: https://www.example.com/tools/datascribe</p>
            `,
        },
        {
            id: 'mock2',
            from: 'The Neuron <editor@theneurondaily.com>',
            subject: 'The Neuron: Ethical Frameworks & Prompting Tips',
            date: yesterday.toISOString(),
            body: `
                <h2>Global Consortium Proposes Ethical AI Frameworks</h2>
                <p>A new set of guidelines for responsible AI development has been released. More info: https://www.example.com/news/ethical-ai-framework</p>
                <h3>Pro Tip: Optimizing Prompts for JSON Output</h3>
                <p>Learn how to structure your prompts to get reliable JSON from language models. Details: https://www.example.com/tips/json-prompts</p>
            `,
        },
        {
            id: 'mock3',
            from: 'AI News Weekly <contact@ainews.com>',
            subject: '[ARCHIVED] The State of AI in 2023',
            date: threeDaysAgo.toISOString(),
            body: `
                <h1>This is an older email and should be filtered out by the 2-day logic.</h1>
                <p>This content is from three days ago and will not appear in the summary.</p>
            `,
        },
    ];
};

export function fetchRecentAiNewsletters(): Promise<Email[]> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(generateMockEmails());
        }, 500); // Simulate network delay
    });
}