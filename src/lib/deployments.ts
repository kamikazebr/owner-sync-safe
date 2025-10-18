/**
 * Deployment utilities
 *
 * This file provides backward-compatible exports for the deployment system.
 * Actual data now comes from script/config/networks.json via network-config.ts
 *
 * For contract versions, use the useContractVersion hook to read from deployed contracts.
 * For Manager/Module implementation addresses, read from Registry contract dynamically.
 */

import { getProxyAddress } from './network-config';

// Re-export everything from network-config for backward compatibility
export {
  getDeployedAddress,
  getDeploymentBlock,
  getBlockExplorerUrl,
  getImplementationAddress,
  getProxyAddress,
  isChainConfigured,
} from './network-config';

// Legacy exports for backward compatibility
export { getImplementationAddress as getSafeModuleManagerAddress } from './network-config';
export { getImplementationAddress as getManagedSafeModuleAddress } from './network-config';

/**
 * Get deployment addresses for backward compatibility
 * Note: Manager and Module implementations should be read from Registry contract dynamically
 */
export function getDeploymentAddresses(chainId: number) {
  return {
    SyncGroupRegistry: getProxyAddress(chainId, 'SyncGroupRegistry'),
    // Manager and Module implementations are stored in Registry and may be updated
    // Read them dynamically from Registry.managerImplementation() and Registry.moduleImplementation()
  };
}
