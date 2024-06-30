import { AxiosInstance, AxiosResponse } from 'axios';
import { Address } from '@ton/core';
import { getRequest } from './utils';
import { CRYPTON_MASTER_ADDRESS } from '../config';
import { sleep } from '../utils';
import { OrdersDatabase } from '../db/database';
import { User } from '../models';
import { logger } from '../logger';

const MAX_RETRIES = 10;
const LIMIT = 1000;

export async function IndexOrders(tonApi: AxiosInstance, db: OrdersDatabase) {
    logger.info(`[IndexOrders] Start orders indexation...`);

    let before_lt = 0;
    while (true) {
        const result = await FetchTransactionsBatch(tonApi, LIMIT, before_lt);
        const transactions = result.data.transactions;

        if (transactions.length === 0) {
            logger.info(`[IndexOrders] All transactions were successfully indexed`);
            before_lt = 0;
            await sleep(10000);
            continue;
        }
        if (await db.isTxExists(transactions[0].hash)) {
            logger.info(`[IndexOrders] Already indexed, no new changes found`);
            before_lt = 0;
            await sleep(5000);
            continue;
        }

        for (const transaction of transactions) {
            if (await db.isTxExists(transaction.hash)) continue;
            await db.addTransaction(transaction.hash, transaction.utime * 1000);

            before_lt = transaction.lt;
            const user = await ParseTransaction(transaction);
            if (!user) continue;
            if (await db.getUser(user.contractAddress)) {
                await db.updateUser(user.contractAddress, user.createdAt, user.updatedAt);
            } else {
                await db.addUser(user.contractAddress, user.createdAt, user.updatedAt);
            }
        }
    }
}

async function FetchTransactionsBatch(
    tonApi: AxiosInstance,
    limit: number,
    before_lt: number,
): Promise<AxiosResponse<any, any>> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            return await tonApi.get(getRequest(CRYPTON_MASTER_ADDRESS, before_lt, limit));
        } catch (e) {
            logger.error(`[FetchTransactionsBatch] Error on fetching master order transactions: ${e}`);
            await sleep(3000);
        }
    }
}

async function ParseTransaction(transaction): Promise<User | null> {
    if (transaction.compute_phase.success === false) return null;
    if (!transaction.out_msgs.length) return null;

    for (const msg of transaction.out_msgs) {
        if (msg.op_code === undefined) {
            return {
                id: null,
                contractAddress: Address.parseRaw(msg.destination.address).toString(),
                createdAt: msg.created_at,
                updatedAt: msg.created_at,
            };
        }
    }
    return null;
}
