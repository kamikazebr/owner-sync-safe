import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Mustache from 'mustache';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const network = process.argv[2] || 'gnosis';

console.log(`Generating subgraph.yaml for network: ${network}`);

// Load network config
const configPath = path.join(__dirname, '../../configs', `${network}.json`);
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Load template
const templatePath = path.join(__dirname, '../templates/subgraph.yaml');
const template = fs.readFileSync(templatePath, 'utf8');

// Generate subgraph.yaml
const output = Mustache.render(template, config);

// Write to root of subgraph package
const outputPath = path.join(__dirname, '../../subgraph.yaml');
fs.writeFileSync(outputPath, output);

console.log(`✅ Generated subgraph.yaml for ${network}`);
console.log(`   Config: ${configPath}`);
console.log(`   Output: ${outputPath}`);
