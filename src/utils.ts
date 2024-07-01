import { Address } from '@ton/core';
import { IS_TESTNET } from './config';

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function GetAddressFriendly(addr: Address) {
    return IS_TESTNET
        ? addr.toString({
              bounceable: true,
              testOnly: true,
          })
        : addr.toString({
              bounceable: true,
              testOnly: false,
          });
}
