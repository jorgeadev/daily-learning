import fs from 'fs';
import path from 'path';

const dir = 'web/src/content/blog';
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.md')) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!content.startsWith('---')) {
      const match = content.match(/^#\s+(.+)\r?\n/);
      if (match) {
        const title = match[1].replace(/"/g, '\\"');
        const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : '';
        const frontmatter = `---\ntitle: "${title}"\ndate: ${date}\n---\n\n`;
        fs.writeFileSync(fullPath, frontmatter + content.substring(match[0].length));
        console.log(`Updated ${file}`);
      }
    }
  }
});
