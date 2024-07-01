import { internal, OpenedContract, toNano, TonClient, WalletContractV4 } from '@ton/ton';
import { Address, beginCell, SendMode } from '@ton/core';
import { KeyPair } from '@ton/crypto';
import { OrderType, UserOrder } from './wrappers/user_order';
import { logger } from '../logger';
import { ADDRESS_CURRENCIES } from '../config';
import { Order } from '../models';
import { JettonMinter } from './wrappers/jetton_minter';
import { GetAddressFriendly } from '../utils';

export async function FetchOrderDetails(tonClient: TonClient, userOrderAddress: Address): Promise<Array<Order>> {
    const ordersList: Array<Order> = [];
    try {
        const UserOrderContract = tonClient.open(new UserOrder(userOrderAddress));
        const ordersDict = await UserOrderContract.getOrders();

        for (const id of ordersDict.keys()) {
            const ord = ordersDict.get(id);
            ordersList.push({
                orderId: id,
                orderType: ord?.orderType!,
                fromAddress: ord?.fromAddress!,
                fromAmount: ord?.fromAmount!,
                fromAmountLeft: ord?.fromAmountLeft!,
                toAddress: ord?.toAddress!,
                toAmount: ord?.toAmount!,
                toMasterAddress: ord?.toMasterAddress!,
            });
        }
    } catch (err: any) {
        if (err.message !== 'Unable to execute get method. Got exit_code: -13')
            logger.error(`Failed to load user orders. Error: ${err}`);
        return [];
    }
    return ordersList;
}

export async function GetAssetByAddress(
    tonClient: TonClient,
    address: Address,
    isMaster: boolean,
): Promise<string | undefined> {
    if (!address) {
        return 'TON';
    }
    const masterAddr = isMaster ? address : await LoadMasterAddr(tonClient, address);
    if (masterAddr.toString() in ADDRESS_CURRENCIES) return ADDRESS_CURRENCIES[masterAddr.toString()];
}

async function LoadMasterAddr(client: TonClient, address: Address): Promise<Address | undefined> {
    const retriesAmount = 3;
    for (let i = 0; i < retriesAmount; i++) {
        try {
            const res = await client.runMethod(address, 'get_wallet_data');
            res.stack.readBigNumber(); // balance
            res.stack.readAddress(); // owner
            return res.stack.readAddress();
        } catch (err) {
            logger.error(`[LoadMasterAddr] Error on wallet ${address.toString()} data fetching: ${err}`);
        }
    }
}

export async function ExecuteOrder(
    tonClient: TonClient,
    contract: OpenedContract<WalletContractV4>,
    keys: KeyPair,
    userOrderAddr: string,
    order: Order,
    queryId: number = 1,
) {
    var msg;
    const executorAddr = contract.address;
    if (order.orderType !== OrderType.JETTON_TON) {
        const jettonToContract = tonClient.open(JettonMinter.createFromAddress(order.toMasterAddress!));
        const executorJettonWalletAddr = await jettonToContract.getWalletAddress(executorAddr);
        msg = {
            value: toNano(0.2),
            to: GetAddressFriendly(executorJettonWalletAddr),
            body: beginCell()
                .storeUint(0xf8a7ea5, 32) // op code - jetton transfer
                .storeUint(queryId, 64)
                .storeCoins(order.toAmount)
                .storeAddress(Address.parse(userOrderAddr))
                .storeAddress(executorAddr)
                .storeBit(0)
                .storeCoins(toNano(0.1))
                .storeBit(1)
                .storeRef(
                    beginCell()
                        .storeUint(0xa0cef9d9, 32) // op code - execute_order
                        .storeUint(queryId, 64) // query id
                        .storeUint(BigInt(order.orderId), 32) // order id
                        .endCell(),
                )
                .endCell(),
        };
    } else {
        msg = {
            value: toNano(0.2) + order.toAmount,
            to: GetAddressFriendly(Address.parse(userOrderAddr)),
            body: beginCell()
                .storeUint(0x3b016c81, 32) // execute_order
                .storeUint(queryId, 64)
                .storeUint(BigInt(order.orderId), 32)
                .storeCoins(order.toAmount)
                .endCell(),
        };
    }

    await contract.sendTransfer({
        seqno: await contract.getSeqno(),
        secretKey: keys.secretKey,
        messages: [internal(msg)],
        sendMode: SendMode.PAY_GAS_SEPARATELY,
    });
    logger.info(`[ExecuteOrder] Execution message was sent.`);
}
