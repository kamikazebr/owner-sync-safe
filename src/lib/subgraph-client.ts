import { GraphQLClient } from 'graphql-request';

// Subgraph endpoints per network - using /version/latest to always get the latest deployed version
const SUBGRAPH_URLS: Record<number, string> = {
  // Gnosis Chain
  100: 'https://api.studio.thegraph.com/query/29898/owner-sync-safe-gnosis/version/latest',
  // Base
  8453: 'https://api.studio.thegraph.com/query/29898/owner-sync-safe-base/version/latest',
};

/**
 * Get GraphQL client for a specific chain
 */
export function getSubgraphClient(chainId: number): GraphQLClient {
  const url = SUBGRAPH_URLS[chainId];
  if (!url) {
    console.warn(`No subgraph configured for chain ${chainId}, falling back to Gnosis`);
    return new GraphQLClient(SUBGRAPH_URLS[100]);
  }
  return new GraphQLClient(url);
}

// Default client for Gnosis Chain (backwards compatibility)
export const subgraphClient = getSubgraphClient(100);

// GraphQL queries
export const GET_GROUP_SAFES = `
  query GetGroupSafes($managerAddress: Bytes!) {
    managedSafeModules(where: { manager: $managerAddress }) {
      id
      safe
      isConfigured
      threshold
      createdAt
      owners(where: { isActive: true }) {
        owner
        addedAt
      }
    }
  }
`;

export const GET_ACTIVE_GROUPS = `
  query GetActiveGroups($safeAddress: Bytes!) {
    managedSafeModules(where: { safe: $safeAddress, isActive: true }) {
      id
      manager {
        id
        group {
          groupId
          name
          owner
          active
        }
      }
      isConfigured
      createdAt
    }
  }
`;

export const GET_PENDING_SETUPS = `
  query GetPendingSetups($safeAddress: Bytes!) {
    managedSafeModules(where: { safe: $safeAddress, isActive: false }) {
      id
      manager {
        id
        group {
          groupId
          name
          owner
          active
        }
      }
      createdAt
    }
  }
`;

export const GET_ALL_GROUPS = `
  query GetAllGroups {
    syncGroups(where: { active: true }, orderBy: createdAt, orderDirection: desc) {
      id
      groupId
      name
      owner
      manager {
        id
        totalModules
      }
      createdAt
    }
  }
`;

export const GET_GROUP_BY_MANAGER = `
  query GetGroupByManager($managerAddress: Bytes!) {
    safeModuleManagers(where: { id: $managerAddress }) {
      id
      group {
        groupId
        name
        owner
        active
      }
    }
  }
`;

export const GET_OPERATION_FAILURES = `
  query GetOperationFailures($managerAddress: Bytes!, $first: Int = 100) {
    moduleOperationFailures(
      where: { manager: $managerAddress }
      orderBy: timestamp
      orderDirection: desc
      first: $first
    ) {
      id
      module {
        id
        safe
      }
      safe
      operation
      errorData
      timestamp
      blockNumber
      transactionHash
    }
  }
`;

export const GET_RECENT_FAILURES_FOR_TX = `
  query GetRecentFailuresForTx($transactionHash: Bytes!) {
    moduleOperationFailures(
      where: { transactionHash: $transactionHash }
    ) {
      id
      module {
        id
        safe
      }
      safe
      operation
      errorData
      timestamp
    }
  }
`;
