import { useQuery } from '@tanstack/react-query';
import { Address } from 'viem';
import { subgraphClient, GET_OPERATION_FAILURES, GET_RECENT_FAILURES_FOR_TX } from '@/lib/subgraph-client';

interface ModuleOperationFailure {
  id: string;
  module: {
    id: string;
    safe: string;
  };
  safe: string;
  operation: string;
  errorData: string;
  timestamp: string;
  blockNumber?: string;
  transactionHash: string;
}

interface OperationFailuresResponse {
  moduleOperationFailures: ModuleOperationFailure[];
}

export function useOperationFailures(managerAddress?: Address) {
  return useQuery({
    queryKey: ['operationFailures', managerAddress],
    queryFn: async () => {
      if (!managerAddress) return [];

      const data = await subgraphClient.request<OperationFailuresResponse>(
        GET_OPERATION_FAILURES,
        { managerAddress: managerAddress.toLowerCase() }
      );

      return data.moduleOperationFailures;
    },
    enabled: !!managerAddress,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function useRecentFailuresForTx(transactionHash?: string) {
  return useQuery({
    queryKey: ['recentFailures', transactionHash],
    queryFn: async () => {
      if (!transactionHash) return [];

      const data = await subgraphClient.request<OperationFailuresResponse>(
        GET_RECENT_FAILURES_FOR_TX,
        { transactionHash: transactionHash.toLowerCase() }
      );

      return data.moduleOperationFailures;
    },
    enabled: !!transactionHash,
    refetchInterval: 5000, // Refetch every 5 seconds for recent tx
  });
}

// Helper to decode common error messages
export function decodeErrorData(errorData: string): string {
  if (!errorData || errorData === '0x') {
    return 'Unknown error';
  }

  // Common error selectors
  const errorMap: Record<string, string> = {
    '0x82b42900': 'Unauthorized()', // GS104: Module not enabled
    '0x': 'Execution reverted without message',
  };

  const selector = errorData.slice(0, 10);
  if (errorMap[selector]) {
    return errorMap[selector];
  }

  // Try to decode as string if longer
  if (errorData.length > 138) {
    try {
      // Skip first 4 bytes (selector) + next 64 bytes (offset + length)
      const hex = errorData.slice(138);
      const decoded = Buffer.from(hex, 'hex').toString('utf8').replace(/\0/g, '');
      if (decoded && decoded.trim()) {
        return decoded.trim();
      }
    } catch (e) {
      // Ignore decoding errors
    }
  }

  return `Error: ${errorData.slice(0, 20)}...`;
}
