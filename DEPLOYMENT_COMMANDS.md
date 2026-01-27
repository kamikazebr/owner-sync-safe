# Multi-Chain Deployment Commands

**Branch**: `feature/ccip-integration`
**Commit**: `bdd1659` - Add cross-chain architecture design and CCIP research

## ✅ Pre-requisites

Ensure your `.env` file has all required variables:

```bash
# RPC URLs
RPC_URL_GNOSIS=https://rpc.gnosischain.com
RPC_URL_CELO=https://forno.celo.org
RPC_URL_POLYGON=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
RPC_URL_BASE=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
RPC_URL_OPTIMISM=https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY
RPC_URL_ARBITRUM=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY

# Etherscan API v2 (unified for ALL networks)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Note**: Etherscan API v2 is unified across all EVM chains. One key works for Gnosis, Celo, Polygon, Base, Optimism, Arbitrum, and more.

## 🚀 Deployment Commands

**IMPORTANT**: Each command will ask for password for account `pkf`.

### Order of Deployment

Deploy in this order for optimal workflow:

#### 1. Gnosis Chain (Hub) - FIRST
```bash
task deploy:registry:gnosis
```
**Why first**: This is the Hub chain in Hub-Spoke architecture. Deploy here first to establish the source of truth.

**What happens**:
- Tests run automatically (pre-dependency)
- Deploys SyncGroupRegistry with UUPS proxy
- Verifies on Gnosisscan
- Updates `script/config/networks.json`
- Syncs configs to subgraph
- **Requires**: Password for `pkf` account

---

#### 2. Celo - Spoke Chain
```bash
task deploy:registry:celo
```
**Gas costs**: Very low (L2 since March 2025)
**Verification**: Celoscan

---

#### 3. Polygon - Spoke Chain
```bash
task deploy:registry:polygon
```
**Gas costs**: Low (30-110 gwei typical)
**Verification**: Polygonscan

---

#### 4. Base - Spoke Chain
```bash
task deploy:registry:base
```
**Gas costs**: Very low (L2, 0.001 gwei)
**Verification**: Basescan

---

#### 5. Optimism - Spoke Chain
```bash
task deploy:registry:optimism
```
**Gas costs**: Very low (L2, 0.001 gwei)
**Verification**: Optimistic Etherscan

---

#### 6. Arbitrum - Spoke Chain
```bash
task deploy:registry:arbitrum
```
**Gas costs**: Low (L2, 0.02-0.1 gwei)
**Verification**: Arbiscan

---

## 📊 Post-Deployment Checklist

After each deployment:
- [ ] Check `script/config/networks.json` updated correctly
- [ ] Verify contract on block explorer
- [ ] Note down deployed addresses
- [ ] Test contract interaction on deployed network

After ALL deployments:
- [ ] All 6 chains have Registry deployed
- [ ] Update CROSS_CHAIN_DESIGN.md with actual addresses
- [ ] Test cross-chain message flow (testnet first!)
- [ ] Configure CCIP/LayerZero adapters

## 🔍 Verification

Check deployed contracts:
```bash
# View networks.json
cat script/config/networks.json

# Check specific chain
cat script/config/networks.json | jq '.gnosis'
cat script/config/networks.json | jq '.celo'
# etc.
```

## 💡 Troubleshooting

**"RPC_URL_XXX not set in .env"**:
- Check `.env` file exists
- Ensure variable is uncommented
- Verify RPC URL is valid

**"XXXSCAN_API_KEY not set in .env"**:
- Get API key from respective block explorer
- Add to `.env` file

**"Tests failed"**:
- Run `task test` to see which test failed
- Fix failing test before deploying

**"Account pkf not found"**:
- Ensure foundry keystore has `pkf` account
- Run `cast wallet list` to verify

## 📝 Notes

- **Gas Optimization**: Gnosis has highest gas cost (L1), deploy there during low gas times
- **L2 Chains**: Celo, Base, Optimism, Arbitrum are all L2s with very low gas costs
- **Verification**: Auto-verifies on block explorers via `--verify` flag
- **Timeline**: ~5-10 minutes per chain (including verification)
- **Total Time**: ~30-60 minutes for all 6 chains

## 🎯 Next Steps After Deployment

1. **Test cross-chain messaging** (use testnet first)
2. **Implement CCIP adapter** (see `MESSAGING_ABSTRACTION_GUIDE.md`)
3. **Configure DVNs** (if using LayerZero)
4. **Set up monitoring** (message delivery tracking)
5. **Deploy CrossChainExecutor** contracts on spoke chains
6. **Test owner synchronization** flow

## 📚 Documentation References

- `docs/CROSS_CHAIN_DESIGN.md` - Complete architecture
- `docs/CCIP_HACKATHON_CASES.md` - Hackathon research
- `docs/MESSAGING_ABSTRACTION_GUIDE.md` - Implementation guide
- `docs/TASKFILE.md` - Task documentation
