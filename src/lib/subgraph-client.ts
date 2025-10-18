import { GraphQLClient } from 'graphql-request';

// Subgraph endpoint - using /version/latest to always get the latest deployed version
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/29898/owner-sync-safe-gnosis/version/latest';

// Create GraphQL client
export const subgraphClient = new GraphQLClient(SUBGRAPH_URL);

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
