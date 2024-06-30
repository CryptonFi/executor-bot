import axios from 'axios';
import { configDotenv } from 'dotenv';
import { logger } from './logger';
import { OrdersDatabase } from './db/database';
import { IndexOrders } from './indexer/indexer';
import { TON_API_ENDPOINT } from './config';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { TonClient, WalletContractV4 } from '@ton/ton';
import { HandleUserOrders } from './execution/executor';
import { mnemonicToWalletKey } from '@ton/crypto';

async function main() {
    configDotenv();
    logger.info(`[App] Start executor bot...`);

    const db = new OrdersDatabase();
    await db.init();

    const tonApi = axios.create({ baseURL: TON_API_ENDPOINT });
    const endpoint = await getHttpEndpoint({ network: 'testnet' });
    const tonClient = new TonClient({ endpoint });

    const keys = await mnemonicToWalletKey(process.env.WALLET_PRIVATE_KEY.split(' '));
    const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keys.publicKey,
    });
    const contract = tonClient.open(wallet);

    IndexOrders(tonApi, db).catch((err) => logger.error(`Indexation failed with error: ${err}`));
    HandleUserOrders(tonClient, contract, keys, db).catch((err) => logger.error(`Execution failed with error: ${err}`));
}

main();
