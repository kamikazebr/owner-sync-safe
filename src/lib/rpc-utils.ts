import type { PublicClient, Address, AbiEvent, ParseAbiItem } from 'viem';

/**
 * Fetches event logs in chunks to work around RPC provider block range limits.
 *
 * Many RPC providers (like Alchemy) limit eth_getLogs queries to 10,000 blocks.
 * This function automatically chunks the query into smaller ranges and combines results.
 *
 * @param publicClient - The viem public client to use for fetching
 * @param params - GetLogs parameters
 * @param chunkSize - Maximum blocks per chunk (default: 9999, safe for Alchemy's 10k limit)
 * @returns Combined array of all logs from all chunks
 */
export async function fetchLogsInChunks<
  TAbiEvent extends AbiEvent | undefined = undefined,
  TTopics extends any[] = [],
>(
  publicClient: PublicClient,
  params: {
    address?: Address | Address[];
    event?: ParseAbiItem<string> | TAbiEvent;
    args?: any;
    fromBlock: bigint;
    toBlock: bigint;
  },
  chunkSize: number = 9999
) {
  const { fromBlock, toBlock, ...restParams } = params;

  // If range is small enough, fetch directly
  if (toBlock - fromBlock <= BigInt(chunkSize)) {
    return await publicClient.getLogs({
      ...restParams,
      fromBlock,
      toBlock,
    } as any);
  }

  // Otherwise, chunk the requests
  const allLogs: any[] = [];
  let currentFrom = fromBlock;

  while (currentFrom <= toBlock) {
    const currentTo = currentFrom + BigInt(chunkSize) > toBlock
      ? toBlock
      : currentFrom + BigInt(chunkSize);

    console.log(`[fetchLogsInChunks] Fetching logs from block ${currentFrom} to ${currentTo}`);

    const logs = await publicClient.getLogs({
      ...restParams,
      fromBlock: currentFrom,
      toBlock: currentTo,
    } as any);

    allLogs.push(...logs);
    currentFrom = currentTo + 1n;
  }

  console.log(`[fetchLogsInChunks] Total logs fetched: ${allLogs.length}`);
  return allLogs;
}
