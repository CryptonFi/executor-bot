import { OpenedContract, TonClient, WalletContractV4 } from '@ton/ton';
import { Address } from '@ton/core';
import { KeyPair } from '@ton/crypto';
import { logger } from '../logger';
import { OrdersDatabase } from '../db/database';
import { ExecuteOrder, FetchOrderDetails, GetAssetByAddress } from '../api/orders';
import { GetAssetUsdPrice } from '../api/prices';
import { CURRENCY_ADDRESSES } from '../config';
import { sleep } from '../utils';

export async function HandleUserOrders(
    tonClient: TonClient,
    contract: OpenedContract<WalletContractV4>,
    keys: KeyPair,
    db: OrdersDatabase,
) {
    logger.info(`[HandleUserOrders] Start orders processing...`);
    while (true) {
        const users = await db.getUsers();
        for (const user of users) {
            try {
                const orders = await FetchOrderDetails(tonClient, Address.parse(user.contractAddress));
                for (const order of orders) {
                    const fromAsset = await GetAssetByAddress(tonClient, order.fromAddress, false);
                    if (!fromAsset) continue;
                    const fromPrice = await GetAssetUsdPrice(fromAsset);
                    const fromDigits = CURRENCY_ADDRESSES[fromAsset].decimals;

                    const toAsset = await GetAssetByAddress(tonClient, order.toMasterAddress, true);
                    if (!toAsset) continue;
                    const toPrice = await GetAssetUsdPrice(toAsset);
                    const toDigits = CURRENCY_ADDRESSES[toAsset].decimals;

                    const fromValue = (Number(order.fromAmount) * fromPrice) / fromDigits;
                    const toValue = (Number(order.toAmount) * toPrice) / toDigits;
                    logger.info(
                        `[HandleUserOrders] Process order from ${Number(order.fromAmount) / fromDigits} ${fromAsset} (value: ${fromValue}$)  to  ${Number(order.toAmount) / toDigits} ${toAsset} (value: ${toValue}$)`,
                    );

                    if (fromValue > toValue) {
                        logger.info('[HandleUserOrders] Run order execution');
                        await ExecuteOrder(tonClient, contract, keys, user.contractAddress, order);
                    } else {
                        logger.info('[HandleUserOrders] Should not be executed');
                    }
                }
            } catch (err) {
                logger.error(
                    `[HandleUserOrders] Failed to process orders for user ${user.contractAddress}. Error: ${err}`,
                );
            }
        }

        await sleep(60000);
    }
}
