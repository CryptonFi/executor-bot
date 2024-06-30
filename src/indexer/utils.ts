import { Address } from '@ton/core';

export function getRequest(address: Address, before_lt: number, limit: number) {
    if (before_lt === 0) return `v2/blockchain/accounts/${address.toRawString()}/transactions?limit=${limit}`;
    else return `v2/blockchain/accounts/${address.toRawString()}/transactions?before_lt=${before_lt}&limit=${limit}`;
}
