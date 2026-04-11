import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

// Initialize configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;

if (!GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY from environment.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function generateContent(): Promise<string> {
    try {
        // gemini-2.5-flash is extremely fast, free-tier eligible, and supports massive outputs 
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
Write a complete and highly professional thesis on a topic related to distributed systems, backend architectures, or modern infrastructure. 
The content must be extraordinarily detailed, meticulously researched, and provide enough depth to take approximately 20 to 35 minutes to read (around 4000 to 6000 words).
Structure the thesis professionally with:
- An Abstract / Executive Summary
- In-depth Introductions and Historical Context
- Core Architectural Principles
- Detailed Trade-offs, Benchmarks, and Case Studies
- Advanced Best Practices and Future Trends
- A Strong Conclusion

Do not generate a short summary. Generate the full, rigorous paper. Use markdown formatting. Include a standard # Title at the very top.
`;

        console.log("Generating thesis using Google Gemini...");
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (e) {
        console.error("Error generating content", e);
        throw e;
    }
}

function saveToDisk(content: string) {
    const rootDir = process.cwd();
    const articlesDir = path.join(rootDir, 'articles');
    
    if (!fs.existsSync(articlesDir)) {
        fs.mkdirSync(articlesDir, { recursive: true });
    }

    // Extract title or fallback to date
    let titleSlug = new Date().toISOString().split('T')[0]; // fallback YYYY-MM-DD
    const titleMatch = content.match(/^#\s+(.+)$/m);
    
    if (titleMatch && titleMatch[1]) {
        // clean up the title to be file-system friendly
        const cleanTitle = titleMatch[1]
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        
        // e.g "2023-10-01-the-architecture-of-raft.md"
        titleSlug = `${titleSlug}-${cleanTitle}`;
    }

    // Restrict filename length
    if (titleSlug.length > 60) {
        titleSlug = titleSlug.substring(0, 60);
    }
    
    const fileName = `${titleSlug}.md`;
    const filePath = path.join(articlesDir, fileName);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`\nSuccessfully saved thesis to: ${filePath}`);
}

async function run() {
    try {
        const content = await generateContent();
        
        // Print a preview to the console logs natively
        console.log("=========================================");
        console.log("           THESIS PREVIEW                ");
        console.log("=========================================\n");
        console.log(content.substring(0, 1500) + "\n\n... [TRUNCATED] ...\n");
        
        // Save the massive content down natively
        saveToDisk(content);
        
        console.log("Daily learning workflow completed.");
    } catch (e) {
        console.error("Failed executing generation pipe", e);
        process.exit(1);
    }
}

run();