import {
  createReadContract,
  createWriteContract,
  createSimulateContract,
  createWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ManagedSafeModule
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const managedSafeModuleAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [],
    name: 'VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newOwner', internalType: 'address', type: 'address' },
      { name: 'threshold', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'addSafeOwner',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'autoSyncEnabled',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'avatar',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'threshold', internalType: 'uint256', type: 'uint256' }],
    name: 'changeSafeThreshold',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'configureForSafe',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
    ],
    name: 'execTransaction',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getModuleOwner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner_', internalType: 'address', type: 'address' }],
    name: 'getPrevOwner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getSafeOwners',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getSafeThreshold',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getSyncStatus',
    outputs: [
      { name: 'syncedOwners', internalType: 'uint256', type: 'uint256' },
      { name: 'isComplete', internalType: 'bool', type: 'bool' },
      { name: 'currentLimit', internalType: 'uint256', type: 'uint256' },
      { name: 'autoSyncEnabled_', internalType: 'bool', type: 'bool' },
      { name: 'requireFullSync_', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getVersion',
    outputs: [{ name: 'version', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'isSafeConfigured',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'isSafeOwner',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'isSyncComplete',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'manager',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'maxSyncOwners',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'prevOwner', internalType: 'address', type: 'address' },
      { name: 'ownerToRemove', internalType: 'address', type: 'address' },
      { name: 'threshold', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'removeSafeOwner',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'prevOwner', internalType: 'address', type: 'address' },
      { name: 'oldOwner', internalType: 'address', type: 'address' },
      { name: 'newOwner', internalType: 'address', type: 'address' },
    ],
    name: 'replaceSafeOwner',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'requireFullSyncForOperations',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'safeConfig',
    outputs: [
      { name: 'isConfigured', internalType: 'bool', type: 'bool' },
      { name: 'threshold', internalType: 'uint256', type: 'uint256' },
      { name: 'isPartiallySynced', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'enabled', internalType: 'bool', type: 'bool' }],
    name: 'setAutoSync',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_avatar', internalType: 'address', type: 'address' }],
    name: 'setAvatar',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newLimit', internalType: 'uint256', type: 'uint256' }],
    name: 'setMaxSyncOwners',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'enabled', internalType: 'bool', type: 'bool' }],
    name: 'setRequireFullSync',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_target', internalType: 'address', type: 'address' }],
    name: 'setTarget',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes', type: 'bytes' }],
    name: 'setUp',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'syncOwnersFromSafe',
    outputs: [{ name: 'fullySynced', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'target',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
    ],
    name: 'upgradeTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousAdmin',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'newAdmin',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'AdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'enabled', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'AutoSyncStatusChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousAvatar',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newAvatar',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'AvatarSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'beacon',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'BeaconUpgraded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'version', internalType: 'uint8', type: 'uint8', indexed: false },
    ],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldLimit',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newLimit',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'MaxSyncOwnersUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'count',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'isComplete',
        internalType: 'bool',
        type: 'bool',
        indexed: false,
      },
    ],
    name: 'OwnersSynced',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'enabled', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'RequireFullSyncChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'safe', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'SafeConfigured',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'safe', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'SafeOwnerAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'safe', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'removedOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'SafeOwnerRemoved',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'safe', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'oldOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'SafeOwnerReplaced',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'safe', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'newThreshold',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'SafeThresholdChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'totalOwners',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'syncedOwners',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'SyncLimitReached',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousTarget',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newTarget',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'TargetSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'implementation',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'Upgraded',
  },
  { type: 'error', inputs: [], name: 'AlreadySafeOwner' },
  {
    type: 'error',
    inputs: [{ name: 'data', internalType: 'bytes', type: 'bytes' }],
    name: 'FailedToAddOwner',
  },
  { type: 'error', inputs: [], name: 'InvalidOwnerAddress' },
  { type: 'error', inputs: [], name: 'InvalidSafeAddress' },
  { type: 'error', inputs: [], name: 'NewOwnerAlreadyExists' },
  { type: 'error', inputs: [], name: 'NotSafeOwner' },
  { type: 'error', inputs: [], name: 'OldOwnerNotFound' },
  { type: 'error', inputs: [], name: 'OnlyModuleOwner' },
  { type: 'error', inputs: [], name: 'OnlySafeOwners' },
  { type: 'error', inputs: [], name: 'OperationRequiresFullSync' },
  { type: 'error', inputs: [], name: 'SafeAlreadyConfigured' },
  { type: 'error', inputs: [], name: 'SafeNotConfigured' },
  { type: 'error', inputs: [], name: 'SameOwnerAddress' },
  { type: 'error', inputs: [], name: 'SyncLimitTooHigh' },
  { type: 'error', inputs: [], name: 'SyncLimitTooLow' },
  { type: 'error', inputs: [], name: 'ThresholdTooHigh' },
  { type: 'error', inputs: [], name: 'ThresholdTooLow' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SafeModuleManager
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const safeModuleManagerAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [],
    name: 'VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'addModuleForSafe',
    outputs: [{ name: 'module', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newOwner', internalType: 'address', type: 'address' },
      { name: 'threshold', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'addSafeOwnerToAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'allModules',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'functionSelector', internalType: 'bytes4', type: 'bytes4' },
      { name: 'params', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'callFunctionInAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'modules', internalType: 'address[]', type: 'address[]' },
      { name: 'functionSelector', internalType: 'bytes4', type: 'bytes4' },
      { name: 'params', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'callFunctionInModules',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'threshold', internalType: 'uint256', type: 'uint256' }],
    name: 'changeSafeThresholdInAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_safe', internalType: 'address', type: 'address' }],
    name: 'createModuleForSafe',
    outputs: [{ name: 'module', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
    ],
    name: 'execTransactionInAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getAllModules',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getAllSafes',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getModuleCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'safe', internalType: 'address', type: 'address' }],
    name: 'getModuleForSafe',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getVersion',
    outputs: [{ name: 'version', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'safe', internalType: 'address', type: 'address' }],
    name: 'hasModule',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_moduleTemplate',
        internalType: 'contract ManagedSafeModule',
        type: 'address',
      },
      { name: '_owner', internalType: 'address', type: 'address' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'isModule',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'isModuleActive',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'safe', internalType: 'address', type: 'address' }],
    name: 'isValidSafe',
    outputs: [{ name: 'isValid', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'moduleTemplate',
    outputs: [
      { name: '', internalType: 'contract ManagedSafeModule', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pendingOwner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'removeModuleForSafe',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'safe', internalType: 'address', type: 'address' }],
    name: 'removeSafeFromNetwork',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'prevOwner', internalType: 'address', type: 'address' },
      { name: 'ownerToRemove', internalType: 'address', type: 'address' },
      { name: 'threshold', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'removeSafeOwnerFromAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'prevOwner', internalType: 'address', type: 'address' },
      { name: 'oldOwner', internalType: 'address', type: 'address' },
      { name: 'newOwner', internalType: 'address', type: 'address' },
    ],
    name: 'replaceSafeOwnerInAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'safeToModule',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'safe', internalType: 'address', type: 'address' },
      { name: 'module', internalType: 'address', type: 'address' },
    ],
    name: 'setSafeToModule',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_newModuleTemplate',
        internalType: 'contract ManagedSafeModule',
        type: 'address',
      },
    ],
    name: 'updateModuleTemplate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
    ],
    name: 'upgradeTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousAdmin',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'newAdmin',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'AdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'beacon',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'BeaconUpgraded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'caller',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'modules',
        internalType: 'address[]',
        type: 'address[]',
        indexed: false,
      },
    ],
    name: 'CrossModuleCall',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'version', internalType: 'uint8', type: 'uint8', indexed: false },
    ],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'safe', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'module',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ModuleCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'safe', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'module',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ModuleDisabledOnSafe',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferStarted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'safe', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'SafeRemovedFromNetwork',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'safe', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'module',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'SafeToModuleSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'implementation',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'Upgraded',
  },
  { type: 'error', inputs: [], name: 'InvalidModuleAddress' },
  { type: 'error', inputs: [], name: 'InvalidNewOwnerAddress' },
  { type: 'error', inputs: [], name: 'InvalidOwnerAddress' },
  { type: 'error', inputs: [], name: 'InvalidSafeAddress' },
  { type: 'error', inputs: [], name: 'ModuleAlreadyExists' },
  { type: 'error', inputs: [], name: 'NoModuleForSafe' },
  { type: 'error', inputs: [], name: 'NoModuleFound' },
  { type: 'error', inputs: [], name: 'OnlyManagerOwner' },
  { type: 'error', inputs: [], name: 'SameOwnerAddress' },
  { type: 'error', inputs: [], name: 'ThresholdTooLow' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SyncGroupRegistry
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const syncGroupRegistryAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [],
    name: 'VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'governanceSafe', internalType: 'address', type: 'address' },
    ],
    name: 'createGroup',
    outputs: [{ name: 'groupId', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'groupId', internalType: 'uint256', type: 'uint256' }],
    name: 'deactivateGroup',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'groupId', internalType: 'uint256', type: 'uint256' }],
    name: 'getGroup',
    outputs: [
      {
        name: '',
        internalType: 'struct SyncGroupRegistry.SyncGroup',
        type: 'tuple',
        components: [
          { name: 'manager', internalType: 'address', type: 'address' },
          { name: 'template', internalType: 'address', type: 'address' },
          { name: 'owner', internalType: 'address', type: 'address' },
          { name: 'name', internalType: 'string', type: 'string' },
          { name: 'active', internalType: 'bool', type: 'bool' },
          { name: 'createdAt', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'manager', internalType: 'address', type: 'address' }],
    name: 'getGroupByManager',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'governanceSafe', internalType: 'address', type: 'address' },
    ],
    name: 'getOwnerGroups',
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'groups',
    outputs: [
      { name: 'manager', internalType: 'address', type: 'address' },
      { name: 'template', internalType: 'address', type: 'address' },
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'active', internalType: 'bool', type: 'bool' },
      { name: 'createdAt', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_managerImplementation',
        internalType: 'contract SafeModuleManager',
        type: 'address',
      },
      {
        name: '_moduleImplementation',
        internalType: 'contract ManagedSafeModule',
        type: 'address',
      },
      { name: '_owner', internalType: 'address', type: 'address' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'groupId', internalType: 'uint256', type: 'uint256' }],
    name: 'isGroupActive',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'managerImplementation',
    outputs: [
      { name: '', internalType: 'contract SafeModuleManager', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'managerToGroup',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'moduleImplementation',
    outputs: [
      { name: '', internalType: 'contract ManagedSafeModule', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'nextGroupId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ownerGroups',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pendingOwner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'groupId', internalType: 'uint256', type: 'uint256' },
      { name: 'safe', internalType: 'address', type: 'address' },
      { name: 'module', internalType: 'address', type: 'address' },
    ],
    name: 'recordSafeAdded',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'groupId', internalType: 'uint256', type: 'uint256' },
      { name: 'safe', internalType: 'address', type: 'address' },
    ],
    name: 'recordSafeRemoved',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'groupId', internalType: 'uint256', type: 'uint256' },
      { name: 'newName', internalType: 'string', type: 'string' },
    ],
    name: 'updateGroupName',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'newManagerImplementation',
        internalType: 'contract SafeModuleManager',
        type: 'address',
      },
    ],
    name: 'updateManagerImplementation',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'newModuleImplementation',
        internalType: 'contract ManagedSafeModule',
        type: 'address',
      },
    ],
    name: 'updateModuleImplementation',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
    ],
    name: 'upgradeTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousAdmin',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'newAdmin',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'AdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'beacon',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'BeaconUpgraded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'groupId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'manager',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      { name: 'name', internalType: 'string', type: 'string', indexed: false },
    ],
    name: 'GroupCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'groupId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'GroupDeactivated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'groupId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'name', internalType: 'string', type: 'string', indexed: false },
    ],
    name: 'GroupUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'version', internalType: 'uint8', type: 'uint8', indexed: false },
    ],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferStarted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'groupId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'safe', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'module',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'SafeAddedToGroup',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'groupId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'safe', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'SafeRemovedFromGroup',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'implementation',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'Upgraded',
  },
  { type: 'error', inputs: [], name: 'GroupNotActive' },
  { type: 'error', inputs: [], name: 'InvalidGovernanceSafe' },
  { type: 'error', inputs: [], name: 'InvalidGroupId' },
  { type: 'error', inputs: [], name: 'InvalidName' },
  { type: 'error', inputs: [], name: 'ManagerAlreadyRegistered' },
  { type: 'error', inputs: [], name: 'NotGroupOwner' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__
 */
export const readManagedSafeModule = /*#__PURE__*/ createReadContract({
  abi: managedSafeModuleAbi,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"VERSION"`
 */
export const readManagedSafeModuleVersion = /*#__PURE__*/ createReadContract({
  abi: managedSafeModuleAbi,
  functionName: 'VERSION',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"autoSyncEnabled"`
 */
export const readManagedSafeModuleAutoSyncEnabled =
  /*#__PURE__*/ createReadContract({
    abi: managedSafeModuleAbi,
    functionName: 'autoSyncEnabled',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"avatar"`
 */
export const readManagedSafeModuleAvatar = /*#__PURE__*/ createReadContract({
  abi: managedSafeModuleAbi,
  functionName: 'avatar',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"getModuleOwner"`
 */
export const readManagedSafeModuleGetModuleOwner =
  /*#__PURE__*/ createReadContract({
    abi: managedSafeModuleAbi,
    functionName: 'getModuleOwner',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"getPrevOwner"`
 */
export const readManagedSafeModuleGetPrevOwner =
  /*#__PURE__*/ createReadContract({
    abi: managedSafeModuleAbi,
    functionName: 'getPrevOwner',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"getSafeOwners"`
 */
export const readManagedSafeModuleGetSafeOwners =
  /*#__PURE__*/ createReadContract({
    abi: managedSafeModuleAbi,
    functionName: 'getSafeOwners',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"getSafeThreshold"`
 */
export const readManagedSafeModuleGetSafeThreshold =
  /*#__PURE__*/ createReadContract({
    abi: managedSafeModuleAbi,
    functionName: 'getSafeThreshold',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"getSyncStatus"`
 */
export const readManagedSafeModuleGetSyncStatus =
  /*#__PURE__*/ createReadContract({
    abi: managedSafeModuleAbi,
    functionName: 'getSyncStatus',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"getVersion"`
 */
export const readManagedSafeModuleGetVersion = /*#__PURE__*/ createReadContract(
  { abi: managedSafeModuleAbi, functionName: 'getVersion' },
)

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"isSafeConfigured"`
 */
export const readManagedSafeModuleIsSafeConfigured =
  /*#__PURE__*/ createReadContract({
    abi: managedSafeModuleAbi,
    functionName: 'isSafeConfigured',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"isSafeOwner"`
 */
export const readManagedSafeModuleIsSafeOwner =
  /*#__PURE__*/ createReadContract({
    abi: managedSafeModuleAbi,
    functionName: 'isSafeOwner',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"isSyncComplete"`
 */
export const readManagedSafeModuleIsSyncComplete =
  /*#__PURE__*/ createReadContract({
    abi: managedSafeModuleAbi,
    functionName: 'isSyncComplete',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"manager"`
 */
export const readManagedSafeModuleManager = /*#__PURE__*/ createReadContract({
  abi: managedSafeModuleAbi,
  functionName: 'manager',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"maxSyncOwners"`
 */
export const readManagedSafeModuleMaxSyncOwners =
  /*#__PURE__*/ createReadContract({
    abi: managedSafeModuleAbi,
    functionName: 'maxSyncOwners',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"owner"`
 */
export const readManagedSafeModuleOwner = /*#__PURE__*/ createReadContract({
  abi: managedSafeModuleAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"proxiableUUID"`
 */
export const readManagedSafeModuleProxiableUuid =
  /*#__PURE__*/ createReadContract({
    abi: managedSafeModuleAbi,
    functionName: 'proxiableUUID',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"requireFullSyncForOperations"`
 */
export const readManagedSafeModuleRequireFullSyncForOperations =
  /*#__PURE__*/ createReadContract({
    abi: managedSafeModuleAbi,
    functionName: 'requireFullSyncForOperations',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"safeConfig"`
 */
export const readManagedSafeModuleSafeConfig = /*#__PURE__*/ createReadContract(
  { abi: managedSafeModuleAbi, functionName: 'safeConfig' },
)

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"target"`
 */
export const readManagedSafeModuleTarget = /*#__PURE__*/ createReadContract({
  abi: managedSafeModuleAbi,
  functionName: 'target',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__
 */
export const writeManagedSafeModule = /*#__PURE__*/ createWriteContract({
  abi: managedSafeModuleAbi,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"addSafeOwner"`
 */
export const writeManagedSafeModuleAddSafeOwner =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'addSafeOwner',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"changeSafeThreshold"`
 */
export const writeManagedSafeModuleChangeSafeThreshold =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'changeSafeThreshold',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"configureForSafe"`
 */
export const writeManagedSafeModuleConfigureForSafe =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'configureForSafe',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"execTransaction"`
 */
export const writeManagedSafeModuleExecTransaction =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'execTransaction',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"removeSafeOwner"`
 */
export const writeManagedSafeModuleRemoveSafeOwner =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'removeSafeOwner',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const writeManagedSafeModuleRenounceOwnership =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"replaceSafeOwner"`
 */
export const writeManagedSafeModuleReplaceSafeOwner =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'replaceSafeOwner',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"setAutoSync"`
 */
export const writeManagedSafeModuleSetAutoSync =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'setAutoSync',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"setAvatar"`
 */
export const writeManagedSafeModuleSetAvatar =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'setAvatar',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"setMaxSyncOwners"`
 */
export const writeManagedSafeModuleSetMaxSyncOwners =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'setMaxSyncOwners',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"setRequireFullSync"`
 */
export const writeManagedSafeModuleSetRequireFullSync =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'setRequireFullSync',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"setTarget"`
 */
export const writeManagedSafeModuleSetTarget =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'setTarget',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"setUp"`
 */
export const writeManagedSafeModuleSetUp = /*#__PURE__*/ createWriteContract({
  abi: managedSafeModuleAbi,
  functionName: 'setUp',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"syncOwnersFromSafe"`
 */
export const writeManagedSafeModuleSyncOwnersFromSafe =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'syncOwnersFromSafe',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const writeManagedSafeModuleTransferOwnership =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const writeManagedSafeModuleUpgradeTo =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'upgradeTo',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const writeManagedSafeModuleUpgradeToAndCall =
  /*#__PURE__*/ createWriteContract({
    abi: managedSafeModuleAbi,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__
 */
export const simulateManagedSafeModule = /*#__PURE__*/ createSimulateContract({
  abi: managedSafeModuleAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"addSafeOwner"`
 */
export const simulateManagedSafeModuleAddSafeOwner =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'addSafeOwner',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"changeSafeThreshold"`
 */
export const simulateManagedSafeModuleChangeSafeThreshold =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'changeSafeThreshold',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"configureForSafe"`
 */
export const simulateManagedSafeModuleConfigureForSafe =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'configureForSafe',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"execTransaction"`
 */
export const simulateManagedSafeModuleExecTransaction =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'execTransaction',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"removeSafeOwner"`
 */
export const simulateManagedSafeModuleRemoveSafeOwner =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'removeSafeOwner',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const simulateManagedSafeModuleRenounceOwnership =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"replaceSafeOwner"`
 */
export const simulateManagedSafeModuleReplaceSafeOwner =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'replaceSafeOwner',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"setAutoSync"`
 */
export const simulateManagedSafeModuleSetAutoSync =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'setAutoSync',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"setAvatar"`
 */
export const simulateManagedSafeModuleSetAvatar =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'setAvatar',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"setMaxSyncOwners"`
 */
export const simulateManagedSafeModuleSetMaxSyncOwners =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'setMaxSyncOwners',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"setRequireFullSync"`
 */
export const simulateManagedSafeModuleSetRequireFullSync =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'setRequireFullSync',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"setTarget"`
 */
export const simulateManagedSafeModuleSetTarget =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'setTarget',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"setUp"`
 */
export const simulateManagedSafeModuleSetUp =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'setUp',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"syncOwnersFromSafe"`
 */
export const simulateManagedSafeModuleSyncOwnersFromSafe =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'syncOwnersFromSafe',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const simulateManagedSafeModuleTransferOwnership =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const simulateManagedSafeModuleUpgradeTo =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'upgradeTo',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const simulateManagedSafeModuleUpgradeToAndCall =
  /*#__PURE__*/ createSimulateContract({
    abi: managedSafeModuleAbi,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__
 */
export const watchManagedSafeModuleEvent =
  /*#__PURE__*/ createWatchContractEvent({ abi: managedSafeModuleAbi })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const watchManagedSafeModuleAdminChangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'AdminChanged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"AutoSyncStatusChanged"`
 */
export const watchManagedSafeModuleAutoSyncStatusChangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'AutoSyncStatusChanged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"AvatarSet"`
 */
export const watchManagedSafeModuleAvatarSetEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'AvatarSet',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const watchManagedSafeModuleBeaconUpgradedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'BeaconUpgraded',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"Initialized"`
 */
export const watchManagedSafeModuleInitializedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'Initialized',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"MaxSyncOwnersUpdated"`
 */
export const watchManagedSafeModuleMaxSyncOwnersUpdatedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'MaxSyncOwnersUpdated',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"OwnersSynced"`
 */
export const watchManagedSafeModuleOwnersSyncedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'OwnersSynced',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const watchManagedSafeModuleOwnershipTransferredEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"RequireFullSyncChanged"`
 */
export const watchManagedSafeModuleRequireFullSyncChangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'RequireFullSyncChanged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"SafeConfigured"`
 */
export const watchManagedSafeModuleSafeConfiguredEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'SafeConfigured',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"SafeOwnerAdded"`
 */
export const watchManagedSafeModuleSafeOwnerAddedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'SafeOwnerAdded',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"SafeOwnerRemoved"`
 */
export const watchManagedSafeModuleSafeOwnerRemovedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'SafeOwnerRemoved',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"SafeOwnerReplaced"`
 */
export const watchManagedSafeModuleSafeOwnerReplacedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'SafeOwnerReplaced',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"SafeThresholdChanged"`
 */
export const watchManagedSafeModuleSafeThresholdChangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'SafeThresholdChanged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"SyncLimitReached"`
 */
export const watchManagedSafeModuleSyncLimitReachedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'SyncLimitReached',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"TargetSet"`
 */
export const watchManagedSafeModuleTargetSetEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'TargetSet',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link managedSafeModuleAbi}__ and `eventName` set to `"Upgraded"`
 */
export const watchManagedSafeModuleUpgradedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: managedSafeModuleAbi,
    eventName: 'Upgraded',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__
 */
export const readSafeModuleManager = /*#__PURE__*/ createReadContract({
  abi: safeModuleManagerAbi,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"VERSION"`
 */
export const readSafeModuleManagerVersion = /*#__PURE__*/ createReadContract({
  abi: safeModuleManagerAbi,
  functionName: 'VERSION',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"allModules"`
 */
export const readSafeModuleManagerAllModules = /*#__PURE__*/ createReadContract(
  { abi: safeModuleManagerAbi, functionName: 'allModules' },
)

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"getAllModules"`
 */
export const readSafeModuleManagerGetAllModules =
  /*#__PURE__*/ createReadContract({
    abi: safeModuleManagerAbi,
    functionName: 'getAllModules',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"getAllSafes"`
 */
export const readSafeModuleManagerGetAllSafes =
  /*#__PURE__*/ createReadContract({
    abi: safeModuleManagerAbi,
    functionName: 'getAllSafes',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"getModuleCount"`
 */
export const readSafeModuleManagerGetModuleCount =
  /*#__PURE__*/ createReadContract({
    abi: safeModuleManagerAbi,
    functionName: 'getModuleCount',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"getModuleForSafe"`
 */
export const readSafeModuleManagerGetModuleForSafe =
  /*#__PURE__*/ createReadContract({
    abi: safeModuleManagerAbi,
    functionName: 'getModuleForSafe',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"getVersion"`
 */
export const readSafeModuleManagerGetVersion = /*#__PURE__*/ createReadContract(
  { abi: safeModuleManagerAbi, functionName: 'getVersion' },
)

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"hasModule"`
 */
export const readSafeModuleManagerHasModule = /*#__PURE__*/ createReadContract({
  abi: safeModuleManagerAbi,
  functionName: 'hasModule',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"isModule"`
 */
export const readSafeModuleManagerIsModule = /*#__PURE__*/ createReadContract({
  abi: safeModuleManagerAbi,
  functionName: 'isModule',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"isModuleActive"`
 */
export const readSafeModuleManagerIsModuleActive =
  /*#__PURE__*/ createReadContract({
    abi: safeModuleManagerAbi,
    functionName: 'isModuleActive',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"moduleTemplate"`
 */
export const readSafeModuleManagerModuleTemplate =
  /*#__PURE__*/ createReadContract({
    abi: safeModuleManagerAbi,
    functionName: 'moduleTemplate',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"owner"`
 */
export const readSafeModuleManagerOwner = /*#__PURE__*/ createReadContract({
  abi: safeModuleManagerAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"pendingOwner"`
 */
export const readSafeModuleManagerPendingOwner =
  /*#__PURE__*/ createReadContract({
    abi: safeModuleManagerAbi,
    functionName: 'pendingOwner',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"proxiableUUID"`
 */
export const readSafeModuleManagerProxiableUuid =
  /*#__PURE__*/ createReadContract({
    abi: safeModuleManagerAbi,
    functionName: 'proxiableUUID',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"safeToModule"`
 */
export const readSafeModuleManagerSafeToModule =
  /*#__PURE__*/ createReadContract({
    abi: safeModuleManagerAbi,
    functionName: 'safeToModule',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__
 */
export const writeSafeModuleManager = /*#__PURE__*/ createWriteContract({
  abi: safeModuleManagerAbi,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"acceptOwnership"`
 */
export const writeSafeModuleManagerAcceptOwnership =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'acceptOwnership',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"addModuleForSafe"`
 */
export const writeSafeModuleManagerAddModuleForSafe =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'addModuleForSafe',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"addSafeOwnerToAll"`
 */
export const writeSafeModuleManagerAddSafeOwnerToAll =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'addSafeOwnerToAll',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"callFunctionInAll"`
 */
export const writeSafeModuleManagerCallFunctionInAll =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'callFunctionInAll',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"callFunctionInModules"`
 */
export const writeSafeModuleManagerCallFunctionInModules =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'callFunctionInModules',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"changeSafeThresholdInAll"`
 */
export const writeSafeModuleManagerChangeSafeThresholdInAll =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'changeSafeThresholdInAll',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"createModuleForSafe"`
 */
export const writeSafeModuleManagerCreateModuleForSafe =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'createModuleForSafe',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"execTransactionInAll"`
 */
export const writeSafeModuleManagerExecTransactionInAll =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'execTransactionInAll',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"initialize"`
 */
export const writeSafeModuleManagerInitialize =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"isValidSafe"`
 */
export const writeSafeModuleManagerIsValidSafe =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'isValidSafe',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"removeModuleForSafe"`
 */
export const writeSafeModuleManagerRemoveModuleForSafe =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'removeModuleForSafe',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"removeSafeFromNetwork"`
 */
export const writeSafeModuleManagerRemoveSafeFromNetwork =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'removeSafeFromNetwork',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"removeSafeOwnerFromAll"`
 */
export const writeSafeModuleManagerRemoveSafeOwnerFromAll =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'removeSafeOwnerFromAll',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const writeSafeModuleManagerRenounceOwnership =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"replaceSafeOwnerInAll"`
 */
export const writeSafeModuleManagerReplaceSafeOwnerInAll =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'replaceSafeOwnerInAll',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"setSafeToModule"`
 */
export const writeSafeModuleManagerSetSafeToModule =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'setSafeToModule',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const writeSafeModuleManagerTransferOwnership =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"updateModuleTemplate"`
 */
export const writeSafeModuleManagerUpdateModuleTemplate =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'updateModuleTemplate',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const writeSafeModuleManagerUpgradeTo =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'upgradeTo',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const writeSafeModuleManagerUpgradeToAndCall =
  /*#__PURE__*/ createWriteContract({
    abi: safeModuleManagerAbi,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__
 */
export const simulateSafeModuleManager = /*#__PURE__*/ createSimulateContract({
  abi: safeModuleManagerAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"acceptOwnership"`
 */
export const simulateSafeModuleManagerAcceptOwnership =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'acceptOwnership',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"addModuleForSafe"`
 */
export const simulateSafeModuleManagerAddModuleForSafe =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'addModuleForSafe',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"addSafeOwnerToAll"`
 */
export const simulateSafeModuleManagerAddSafeOwnerToAll =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'addSafeOwnerToAll',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"callFunctionInAll"`
 */
export const simulateSafeModuleManagerCallFunctionInAll =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'callFunctionInAll',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"callFunctionInModules"`
 */
export const simulateSafeModuleManagerCallFunctionInModules =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'callFunctionInModules',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"changeSafeThresholdInAll"`
 */
export const simulateSafeModuleManagerChangeSafeThresholdInAll =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'changeSafeThresholdInAll',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"createModuleForSafe"`
 */
export const simulateSafeModuleManagerCreateModuleForSafe =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'createModuleForSafe',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"execTransactionInAll"`
 */
export const simulateSafeModuleManagerExecTransactionInAll =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'execTransactionInAll',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"initialize"`
 */
export const simulateSafeModuleManagerInitialize =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"isValidSafe"`
 */
export const simulateSafeModuleManagerIsValidSafe =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'isValidSafe',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"removeModuleForSafe"`
 */
export const simulateSafeModuleManagerRemoveModuleForSafe =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'removeModuleForSafe',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"removeSafeFromNetwork"`
 */
export const simulateSafeModuleManagerRemoveSafeFromNetwork =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'removeSafeFromNetwork',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"removeSafeOwnerFromAll"`
 */
export const simulateSafeModuleManagerRemoveSafeOwnerFromAll =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'removeSafeOwnerFromAll',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const simulateSafeModuleManagerRenounceOwnership =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"replaceSafeOwnerInAll"`
 */
export const simulateSafeModuleManagerReplaceSafeOwnerInAll =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'replaceSafeOwnerInAll',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"setSafeToModule"`
 */
export const simulateSafeModuleManagerSetSafeToModule =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'setSafeToModule',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const simulateSafeModuleManagerTransferOwnership =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"updateModuleTemplate"`
 */
export const simulateSafeModuleManagerUpdateModuleTemplate =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'updateModuleTemplate',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const simulateSafeModuleManagerUpgradeTo =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'upgradeTo',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const simulateSafeModuleManagerUpgradeToAndCall =
  /*#__PURE__*/ createSimulateContract({
    abi: safeModuleManagerAbi,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link safeModuleManagerAbi}__
 */
export const watchSafeModuleManagerEvent =
  /*#__PURE__*/ createWatchContractEvent({ abi: safeModuleManagerAbi })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const watchSafeModuleManagerAdminChangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: safeModuleManagerAbi,
    eventName: 'AdminChanged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const watchSafeModuleManagerBeaconUpgradedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: safeModuleManagerAbi,
    eventName: 'BeaconUpgraded',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `eventName` set to `"CrossModuleCall"`
 */
export const watchSafeModuleManagerCrossModuleCallEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: safeModuleManagerAbi,
    eventName: 'CrossModuleCall',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `eventName` set to `"Initialized"`
 */
export const watchSafeModuleManagerInitializedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: safeModuleManagerAbi,
    eventName: 'Initialized',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `eventName` set to `"ModuleCreated"`
 */
export const watchSafeModuleManagerModuleCreatedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: safeModuleManagerAbi,
    eventName: 'ModuleCreated',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `eventName` set to `"ModuleDisabledOnSafe"`
 */
export const watchSafeModuleManagerModuleDisabledOnSafeEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: safeModuleManagerAbi,
    eventName: 'ModuleDisabledOnSafe',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `eventName` set to `"OwnershipTransferStarted"`
 */
export const watchSafeModuleManagerOwnershipTransferStartedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: safeModuleManagerAbi,
    eventName: 'OwnershipTransferStarted',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const watchSafeModuleManagerOwnershipTransferredEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: safeModuleManagerAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `eventName` set to `"SafeRemovedFromNetwork"`
 */
export const watchSafeModuleManagerSafeRemovedFromNetworkEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: safeModuleManagerAbi,
    eventName: 'SafeRemovedFromNetwork',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `eventName` set to `"SafeToModuleSet"`
 */
export const watchSafeModuleManagerSafeToModuleSetEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: safeModuleManagerAbi,
    eventName: 'SafeToModuleSet',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link safeModuleManagerAbi}__ and `eventName` set to `"Upgraded"`
 */
export const watchSafeModuleManagerUpgradedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: safeModuleManagerAbi,
    eventName: 'Upgraded',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__
 */
export const readSyncGroupRegistry = /*#__PURE__*/ createReadContract({
  abi: syncGroupRegistryAbi,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"VERSION"`
 */
export const readSyncGroupRegistryVersion = /*#__PURE__*/ createReadContract({
  abi: syncGroupRegistryAbi,
  functionName: 'VERSION',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"getGroup"`
 */
export const readSyncGroupRegistryGetGroup = /*#__PURE__*/ createReadContract({
  abi: syncGroupRegistryAbi,
  functionName: 'getGroup',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"getGroupByManager"`
 */
export const readSyncGroupRegistryGetGroupByManager =
  /*#__PURE__*/ createReadContract({
    abi: syncGroupRegistryAbi,
    functionName: 'getGroupByManager',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"getOwnerGroups"`
 */
export const readSyncGroupRegistryGetOwnerGroups =
  /*#__PURE__*/ createReadContract({
    abi: syncGroupRegistryAbi,
    functionName: 'getOwnerGroups',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"groups"`
 */
export const readSyncGroupRegistryGroups = /*#__PURE__*/ createReadContract({
  abi: syncGroupRegistryAbi,
  functionName: 'groups',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"isGroupActive"`
 */
export const readSyncGroupRegistryIsGroupActive =
  /*#__PURE__*/ createReadContract({
    abi: syncGroupRegistryAbi,
    functionName: 'isGroupActive',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"managerImplementation"`
 */
export const readSyncGroupRegistryManagerImplementation =
  /*#__PURE__*/ createReadContract({
    abi: syncGroupRegistryAbi,
    functionName: 'managerImplementation',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"managerToGroup"`
 */
export const readSyncGroupRegistryManagerToGroup =
  /*#__PURE__*/ createReadContract({
    abi: syncGroupRegistryAbi,
    functionName: 'managerToGroup',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"moduleImplementation"`
 */
export const readSyncGroupRegistryModuleImplementation =
  /*#__PURE__*/ createReadContract({
    abi: syncGroupRegistryAbi,
    functionName: 'moduleImplementation',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"nextGroupId"`
 */
export const readSyncGroupRegistryNextGroupId =
  /*#__PURE__*/ createReadContract({
    abi: syncGroupRegistryAbi,
    functionName: 'nextGroupId',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"owner"`
 */
export const readSyncGroupRegistryOwner = /*#__PURE__*/ createReadContract({
  abi: syncGroupRegistryAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"ownerGroups"`
 */
export const readSyncGroupRegistryOwnerGroups =
  /*#__PURE__*/ createReadContract({
    abi: syncGroupRegistryAbi,
    functionName: 'ownerGroups',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"pendingOwner"`
 */
export const readSyncGroupRegistryPendingOwner =
  /*#__PURE__*/ createReadContract({
    abi: syncGroupRegistryAbi,
    functionName: 'pendingOwner',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"proxiableUUID"`
 */
export const readSyncGroupRegistryProxiableUuid =
  /*#__PURE__*/ createReadContract({
    abi: syncGroupRegistryAbi,
    functionName: 'proxiableUUID',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__
 */
export const writeSyncGroupRegistry = /*#__PURE__*/ createWriteContract({
  abi: syncGroupRegistryAbi,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"acceptOwnership"`
 */
export const writeSyncGroupRegistryAcceptOwnership =
  /*#__PURE__*/ createWriteContract({
    abi: syncGroupRegistryAbi,
    functionName: 'acceptOwnership',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"createGroup"`
 */
export const writeSyncGroupRegistryCreateGroup =
  /*#__PURE__*/ createWriteContract({
    abi: syncGroupRegistryAbi,
    functionName: 'createGroup',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"deactivateGroup"`
 */
export const writeSyncGroupRegistryDeactivateGroup =
  /*#__PURE__*/ createWriteContract({
    abi: syncGroupRegistryAbi,
    functionName: 'deactivateGroup',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"initialize"`
 */
export const writeSyncGroupRegistryInitialize =
  /*#__PURE__*/ createWriteContract({
    abi: syncGroupRegistryAbi,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"recordSafeAdded"`
 */
export const writeSyncGroupRegistryRecordSafeAdded =
  /*#__PURE__*/ createWriteContract({
    abi: syncGroupRegistryAbi,
    functionName: 'recordSafeAdded',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"recordSafeRemoved"`
 */
export const writeSyncGroupRegistryRecordSafeRemoved =
  /*#__PURE__*/ createWriteContract({
    abi: syncGroupRegistryAbi,
    functionName: 'recordSafeRemoved',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const writeSyncGroupRegistryRenounceOwnership =
  /*#__PURE__*/ createWriteContract({
    abi: syncGroupRegistryAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const writeSyncGroupRegistryTransferOwnership =
  /*#__PURE__*/ createWriteContract({
    abi: syncGroupRegistryAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"updateGroupName"`
 */
export const writeSyncGroupRegistryUpdateGroupName =
  /*#__PURE__*/ createWriteContract({
    abi: syncGroupRegistryAbi,
    functionName: 'updateGroupName',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"updateManagerImplementation"`
 */
export const writeSyncGroupRegistryUpdateManagerImplementation =
  /*#__PURE__*/ createWriteContract({
    abi: syncGroupRegistryAbi,
    functionName: 'updateManagerImplementation',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"updateModuleImplementation"`
 */
export const writeSyncGroupRegistryUpdateModuleImplementation =
  /*#__PURE__*/ createWriteContract({
    abi: syncGroupRegistryAbi,
    functionName: 'updateModuleImplementation',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const writeSyncGroupRegistryUpgradeTo =
  /*#__PURE__*/ createWriteContract({
    abi: syncGroupRegistryAbi,
    functionName: 'upgradeTo',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const writeSyncGroupRegistryUpgradeToAndCall =
  /*#__PURE__*/ createWriteContract({
    abi: syncGroupRegistryAbi,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__
 */
export const simulateSyncGroupRegistry = /*#__PURE__*/ createSimulateContract({
  abi: syncGroupRegistryAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"acceptOwnership"`
 */
export const simulateSyncGroupRegistryAcceptOwnership =
  /*#__PURE__*/ createSimulateContract({
    abi: syncGroupRegistryAbi,
    functionName: 'acceptOwnership',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"createGroup"`
 */
export const simulateSyncGroupRegistryCreateGroup =
  /*#__PURE__*/ createSimulateContract({
    abi: syncGroupRegistryAbi,
    functionName: 'createGroup',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"deactivateGroup"`
 */
export const simulateSyncGroupRegistryDeactivateGroup =
  /*#__PURE__*/ createSimulateContract({
    abi: syncGroupRegistryAbi,
    functionName: 'deactivateGroup',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"initialize"`
 */
export const simulateSyncGroupRegistryInitialize =
  /*#__PURE__*/ createSimulateContract({
    abi: syncGroupRegistryAbi,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"recordSafeAdded"`
 */
export const simulateSyncGroupRegistryRecordSafeAdded =
  /*#__PURE__*/ createSimulateContract({
    abi: syncGroupRegistryAbi,
    functionName: 'recordSafeAdded',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"recordSafeRemoved"`
 */
export const simulateSyncGroupRegistryRecordSafeRemoved =
  /*#__PURE__*/ createSimulateContract({
    abi: syncGroupRegistryAbi,
    functionName: 'recordSafeRemoved',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const simulateSyncGroupRegistryRenounceOwnership =
  /*#__PURE__*/ createSimulateContract({
    abi: syncGroupRegistryAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const simulateSyncGroupRegistryTransferOwnership =
  /*#__PURE__*/ createSimulateContract({
    abi: syncGroupRegistryAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"updateGroupName"`
 */
export const simulateSyncGroupRegistryUpdateGroupName =
  /*#__PURE__*/ createSimulateContract({
    abi: syncGroupRegistryAbi,
    functionName: 'updateGroupName',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"updateManagerImplementation"`
 */
export const simulateSyncGroupRegistryUpdateManagerImplementation =
  /*#__PURE__*/ createSimulateContract({
    abi: syncGroupRegistryAbi,
    functionName: 'updateManagerImplementation',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"updateModuleImplementation"`
 */
export const simulateSyncGroupRegistryUpdateModuleImplementation =
  /*#__PURE__*/ createSimulateContract({
    abi: syncGroupRegistryAbi,
    functionName: 'updateModuleImplementation',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const simulateSyncGroupRegistryUpgradeTo =
  /*#__PURE__*/ createSimulateContract({
    abi: syncGroupRegistryAbi,
    functionName: 'upgradeTo',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const simulateSyncGroupRegistryUpgradeToAndCall =
  /*#__PURE__*/ createSimulateContract({
    abi: syncGroupRegistryAbi,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link syncGroupRegistryAbi}__
 */
export const watchSyncGroupRegistryEvent =
  /*#__PURE__*/ createWatchContractEvent({ abi: syncGroupRegistryAbi })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const watchSyncGroupRegistryAdminChangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: syncGroupRegistryAbi,
    eventName: 'AdminChanged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const watchSyncGroupRegistryBeaconUpgradedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: syncGroupRegistryAbi,
    eventName: 'BeaconUpgraded',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `eventName` set to `"GroupCreated"`
 */
export const watchSyncGroupRegistryGroupCreatedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: syncGroupRegistryAbi,
    eventName: 'GroupCreated',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `eventName` set to `"GroupDeactivated"`
 */
export const watchSyncGroupRegistryGroupDeactivatedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: syncGroupRegistryAbi,
    eventName: 'GroupDeactivated',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `eventName` set to `"GroupUpdated"`
 */
export const watchSyncGroupRegistryGroupUpdatedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: syncGroupRegistryAbi,
    eventName: 'GroupUpdated',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `eventName` set to `"Initialized"`
 */
export const watchSyncGroupRegistryInitializedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: syncGroupRegistryAbi,
    eventName: 'Initialized',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `eventName` set to `"OwnershipTransferStarted"`
 */
export const watchSyncGroupRegistryOwnershipTransferStartedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: syncGroupRegistryAbi,
    eventName: 'OwnershipTransferStarted',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const watchSyncGroupRegistryOwnershipTransferredEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: syncGroupRegistryAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `eventName` set to `"SafeAddedToGroup"`
 */
export const watchSyncGroupRegistrySafeAddedToGroupEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: syncGroupRegistryAbi,
    eventName: 'SafeAddedToGroup',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `eventName` set to `"SafeRemovedFromGroup"`
 */
export const watchSyncGroupRegistrySafeRemovedFromGroupEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: syncGroupRegistryAbi,
    eventName: 'SafeRemovedFromGroup',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link syncGroupRegistryAbi}__ and `eventName` set to `"Upgraded"`
 */
export const watchSyncGroupRegistryUpgradedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: syncGroupRegistryAbi,
    eventName: 'Upgraded',
  })
