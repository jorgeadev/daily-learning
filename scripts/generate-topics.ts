import * as fs from "fs";
import { loadTopics, generateWithRetry } from "./utils";

async function generateNewTopics(amount: number): Promise<string[]> {
    const prompt = `
Generate exactly ${amount} brand new, highly technical blog post topics about big tech infrastructure, massive scale systems architecture, or viral engineering news.
DO NOT output any markdown formatting, text, or explanations. 
Output ONLY a raw JSON array of ${amount} strings. Example format:
[
  "The architecture behind...",
  "An in-depth analysis of...",
  "How [Company] scaled..."
]
`;

    console.log(`Generating ${amount} new topics to replenish the pool...`);
    let text = "";
    try {
        text = await generateWithRetry(prompt);
    } catch {
        console.error("Skipping topic replenishment due to persistent rate limiting.");
        return [];
    }

    try {
        const start = text.indexOf("[");
        const end = text.lastIndexOf("]");
        if (start !== -1 && end !== -1) {
            const jsonText = text.substring(start, end + 1);
            const parsed = JSON.parse(jsonText);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch {
        console.error("Failed to parse the new topics output:", text);
    }
    return [];
}

async function run() {
    try {
        const { topics, configPath } = await loadTopics();
        // Infinite topic generation
        const amountToGenerate = topics.length < 20 ? 10 : 5;
        const newTopics = await generateNewTopics(amountToGenerate);

        if (newTopics.length > 0) {
            topics.push(...newTopics);
            fs.writeFileSync(configPath, JSON.stringify({ topics }, null, 2), "utf8");
            console.log(
                `Successfully rotated topics. Added ${newTopics.length}. Total topics in pool: ${topics.length}`
            );
        } else {
            console.log(
                "Skipping topic rotation because AI failed to generate valid JSON or rate limited."
            );
        }

        console.log("Topic pool replenishment workflow completed.");
    } catch (e) {
        console.error("Failed executing generation pipe", e);
        process.exit(1);
    }
}

run();
