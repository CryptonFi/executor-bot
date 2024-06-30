import { Address } from '@ton/core';

export type User = {
    id: number;
    contractAddress: string;
    createdAt: number;
    updatedAt: number;
};

export type Order = {
    orderId: bigint;
    orderType: number;
    fromAddress: Address | null;
    fromAmount: bigint;
    fromAmountLeft: bigint;
    toAddress: Address | null;
    toAmount: bigint;
    toMasterAddress: Address | null;
};
