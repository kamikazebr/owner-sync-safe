'use client';

import { useState } from 'react';
import { Address, encodeFunctionData } from 'viem';
import { useSafeApps } from './useSafeApps';
import toast from 'react-hot-toast';

export function useEnableModule() {
  const { isSafeApp, sdk, safeInfo } = useSafeApps();
  const [isEnabling, setIsEnabling] = useState(false);
  const [error, setError] = useState<string>('');

  const enableModule = async (moduleAddress: Address): Promise<boolean> => {
    if (!isSafeApp || !sdk || !safeInfo) {
      setError('Must be running as Safe App to enable modules');
      toast.error('Must be running inside Safe to enable modules');
      return false;
    }

    setIsEnabling(true);
    setError('');

    try {
      // Encode enableModule(address module) call
      const data = encodeFunctionData({
        abi: [{
          name: 'enableModule',
          type: 'function',
          inputs: [{ name: 'module', type: 'address' }],
          outputs: [],
          stateMutability: 'nonpayable',
        }],
        functionName: 'enableModule',
        args: [moduleAddress],
      });

      toast.loading('Proposing transaction to Safe...', { id: 'enable-module' });

      // Propose transaction to Safe owners
      const result = await sdk.txs.send({
        txs: [{
          to: safeInfo.safeAddress,
          value: '0',
          data,
        }],
        params: {
          safeTxGas: 10000000, // 10M gas limit for complex transactions
        },
      });

      toast.success('Transaction proposed! Waiting for signatures...', { id: 'enable-module' });

      setIsEnabling(false);
      return true;

    } catch (err: any) {
      console.error('Error enabling module:', err);
      const errorMessage = err.message || 'Failed to enable module';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'enable-module' });
      setIsEnabling(false);
      return false;
    }
  };

  return {
    enableModule,
    isEnabling,
    error,
    canEnable: isSafeApp && !!sdk,
  };
}
