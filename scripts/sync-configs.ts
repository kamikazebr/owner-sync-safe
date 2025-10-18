/**
 * Sync deployment configurations from networks.json to other config files
 *
 * This script is the single source of truth synchronization tool:
 * - Reads from: script/config/networks.json (source of truth)
 * - Generates: pkg/subgraph/configs/*.json (for subgraph deployment)
 *
 * Usage: pnpm sync-configs
 */

import * as fs from 'fs';
import * as path from 'path';

interface NetworkConfig {
  name: string;
  chainId: number;
  testnet: boolean;
  ENVS?: Record<string, string>;
  PROXIES?: Record<string, string>;
  IMPLEMENTATIONS?: Record<string, string>;
  METADATA?: {
    deploymentBlock?: number;
    deploymentTx?: string;
    notes?: string;
  };
}

interface NetworksJson {
  networks: NetworkConfig[];
}

interface SubgraphConfig {
  network: string;
  chainId: number;
  SyncGroupRegistry: {
    address: string;
    startBlock: number;
  };
}

const PROJECT_ROOT = path.join(__dirname, '..');
const NETWORKS_JSON_PATH = path.join(PROJECT_ROOT, 'script/config/networks.json');
const SUBGRAPH_CONFIGS_DIR = path.join(PROJECT_ROOT, 'pkg/subgraph/configs');

function loadNetworksJson(): NetworksJson {
  if (!fs.existsSync(NETWORKS_JSON_PATH)) {
    throw new Error(`networks.json not found at ${NETWORKS_JSON_PATH}`);
  }

  const content = fs.readFileSync(NETWORKS_JSON_PATH, 'utf-8');
  return JSON.parse(content);
}

function generateSubgraphConfig(network: NetworkConfig): SubgraphConfig | null {
  const { name, chainId, PROXIES, METADATA } = network;

  // Validate required data
  if (!PROXIES?.SyncGroupRegistry) {
    console.warn(`⚠️  Skipping ${name}: Missing SyncGroupRegistry proxy address`);
    return null;
  }

  const deploymentBlock = METADATA?.deploymentBlock;
  if (!deploymentBlock) {
    console.warn(`⚠️  Skipping ${name}: Missing deployment block`);
    return null;
  }

  // Note: SafeModuleManager and ManagedSafeModule are templates in the subgraph,
  // not data sources. They don't need addresses here - they're dynamically
  // instantiated when Registry events fire.
  return {
    network: name,
    chainId,
    SyncGroupRegistry: {
      address: PROXIES.SyncGroupRegistry,
      startBlock: deploymentBlock,
    },
  };
}

function writeSubgraphConfig(networkName: string, config: SubgraphConfig) {
  const filePath = path.join(SUBGRAPH_CONFIGS_DIR, `${networkName}.json`);

  // Ensure directory exists
  if (!fs.existsSync(SUBGRAPH_CONFIGS_DIR)) {
    fs.mkdirSync(SUBGRAPH_CONFIGS_DIR, { recursive: true });
  }

  // Write config file
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

  console.log(`✅ Generated ${networkName}.json`);
  console.log(`   Registry: ${config.SyncGroupRegistry.address}`);
  console.log(`   Block:    ${config.SyncGroupRegistry.startBlock}`);
}

function main() {
  console.log('🔄 Syncing deployment configs from networks.json...\n');

  // Load source of truth
  const networksJson = loadNetworksJson();
  console.log(`📖 Loaded ${networksJson.networks.length} network(s) from networks.json\n`);

  let generatedCount = 0;

  // Generate subgraph configs for each network
  for (const network of networksJson.networks) {
    console.log(`📝 Processing ${network.name} (chain ${network.chainId})...`);

    const subgraphConfig = generateSubgraphConfig(network);
    if (subgraphConfig) {
      writeSubgraphConfig(network.name, subgraphConfig);
      generatedCount++;
    }
    console.log('');
  }

  // Summary
  console.log('━'.repeat(60));
  console.log(`✨ Sync complete!`);
  console.log(`   Generated ${generatedCount} subgraph config(s)`);
  console.log(`   Source: script/config/networks.json`);
  console.log(`   Output: pkg/subgraph/configs/*.json`);
  console.log('━'.repeat(60));
  console.log('');
  console.log('📌 Next steps:');
  console.log('   1. Review changes: git diff pkg/subgraph/configs/');
  console.log('   2. Regenerate subgraph manifest: pnpm manifest:gnosis');
  console.log('   3. Deploy subgraph: pnpm deploy:gnosis');
}

main();
