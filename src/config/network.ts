/**
 * BOT Chain Network Configuration
 * Verified against official developer documentation:
 * https://dev-docs.botchain.ai/docs/Developers/json-rpc-endpoint/
 */
export const BOT_CHAIN_CONFIG = {
  networkName: 'Bohr Testnet',
  rpcUrl: 'https://rpc.bohr.life',
  chainId: 968,
  chainIdHex: '0x3c8',
  currencySymbol: 'BOT',
  decimals: 18,
  docsUrl: 'https://dev-docs.botchain.ai/docs/Developers/json-rpc-endpoint/',
} as const
