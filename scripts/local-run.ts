import * as fs from 'fs';
import * as path from 'path';

// This script is designed to run locally without requiring any API keys or credentials.
// It mocks the behavior of the daily learning generation process and tests the FS writing.

async function generateMockContent(): Promise<string> {
    console.log("Generating mock daily learning thesis...");
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return `# The Architecture, Challenges, and Mathematical Underpinnings of Distributed Consensus Protocols

## Abstract
This paper provides an exhaustive, thesis-level examination of consensus protocols in distributed systems, specifically evaluating the transition from Paxos to Raft...
[Simulated 20-35 minute read]

## 1. Introduction to Distributed Fault Tolerance
In the era of cloud-native infrastructure, the ability to maintain a consistent state across a fleet of unpredictable, volatile nodes is not just a feature, but a mandatory requirement. The theoretical grounds established by the CAP theorem...

## 2. Mathematical Foundations of Paxos
When Leslie Lamport introduced Paxos in 1989...

## 3. Transition to Raft and Understandability
As the complexity of Paxos hindered implementations...

[... Thousands of words simulated for a local run ...]`;
}

function saveToDisk(content: string) {
    const rootDir = process.cwd();
    const articlesDir = path.join(rootDir, 'articles');
    
    if (!fs.existsSync(articlesDir)) {
        console.log("Creating /articles directory...");
        fs.mkdirSync(articlesDir, { recursive: true });
    }

    let titleSlug = new Date().toISOString().split('T')[0]; // fallback YYYY-MM-DD
    const titleMatch = content.match(/^#\s+(.+)$/m);
    
    if (titleMatch && titleMatch[1]) {
        const cleanTitle = titleMatch[1]
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        titleSlug = `${titleSlug}-mock-${cleanTitle}`;
    }

    if (titleSlug.length > 60) {
        titleSlug = titleSlug.substring(0, 60);
    }
    
    const fileName = `${titleSlug}.md`;
    const filePath = path.join(articlesDir, fileName);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`\nSuccessfully saved local mockup to: ${filePath}`);
}

async function runLocally() {
    console.log("Starting local mock workflow...\n");
    
    const content = await generateMockContent();
    saveToDisk(content);
    
    console.log("Local mock workflow completed successfully.");
}

runLocally();
