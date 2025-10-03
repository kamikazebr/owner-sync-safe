export const SafeModuleManagerABI = [
  {
    "inputs": [],
    "name": "VERSION",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_safe", "type": "address"}],
    "name": "createModuleForSafe",
    "outputs": [{"internalType": "address", "name": "module", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "addModuleForSafe",
    "outputs": [{"internalType": "address", "name": "module", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "safe", "type": "address"},
      {"internalType": "address", "name": "module", "type": "address"}
    ],
    "name": "setSafeToModule",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "safeToModule",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "safe", "type": "address"}],
    "name": "getModuleForSafe",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "safe", "type": "address"}],
    "name": "hasModule",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getModuleCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "allModules",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "isModule",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "safe", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "module", "type": "address"}
    ],
    "name": "ModuleCreated",
    "type": "event"
  }
] as const;

export const ManagedSafeModuleABI = [
  {
    "inputs": [],
    "name": "configureForSafe",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "newOwner", "type": "address"},
      {"internalType": "uint256", "name": "threshold", "type": "uint256"}
    ],
    "name": "addSafeOwner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "prevOwner", "type": "address"},
      {"internalType": "address", "name": "ownerToRemove", "type": "address"},
      {"internalType": "uint256", "name": "threshold", "type": "uint256"}
    ],
    "name": "removeSafeOwner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "prevOwner", "type": "address"},
      {"internalType": "address", "name": "oldOwner", "type": "address"},
      {"internalType": "address", "name": "newOwner", "type": "address"}
    ],
    "name": "replaceSafeOwner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "threshold", "type": "uint256"}],
    "name": "changeSafeThreshold",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "syncOwnersFromSafe",
    "outputs": [{"internalType": "bool", "name": "fullySynced", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bool", "name": "enabled", "type": "bool"}],
    "name": "setAutoSync",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bool", "name": "enabled", "type": "bool"}],
    "name": "setRequireFullSync",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "newLimit", "type": "uint256"}],
    "name": "setMaxSyncOwners",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSafeOwners",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSafeThreshold",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isSafeConfigured",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isSyncComplete",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSyncStatus",
    "outputs": [
      {"internalType": "uint256", "name": "syncedOwners", "type": "uint256"},
      {"internalType": "bool", "name": "isComplete", "type": "bool"},
      {"internalType": "uint256", "name": "currentLimit", "type": "uint256"},
      {"internalType": "bool", "name": "autoSyncEnabled_", "type": "bool"},
      {"internalType": "bool", "name": "requireFullSync_", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "autoSyncEnabled",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "requireFullSyncForOperations",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxSyncOwners",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "address", "name": "safe", "type": "address"}],
    "name": "SafeConfigured",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "safe", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "newOwner", "type": "address"}
    ],
    "name": "SafeOwnerAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "safe", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "removedOwner", "type": "address"}
    ],
    "name": "SafeOwnerRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "safe", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "oldOwner", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "newOwner", "type": "address"}
    ],
    "name": "SafeOwnerReplaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "uint256", "name": "count", "type": "uint256"},
      {"indexed": false, "internalType": "bool", "name": "isComplete", "type": "bool"}
    ],
    "name": "OwnersSynced",
    "type": "event"
  }
] as const;

export const SafeABI = [
  {
    "inputs": [],
    "name": "getOwners",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getThreshold",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "module", "type": "address"}],
    "name": "enableModule",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "prevModule", "type": "address"},
      {"internalType": "address", "name": "module", "type": "address"}
    ],
    "name": "disableModule",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "module", "type": "address"}],
    "name": "isModuleEnabled",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;