import { Address } from '@ton/core';

// Testnet
export const IS_TESTNET = true;
export const CRYPTON_MASTER_ADDRESS = Address.parse('EQADNWMDEpeeQKW2Diy2nz04LtRDWdpuydKTPVyFZqI9PZpt');
export const TON_API_ENDPOINT = 'https://testnet.tonapi.io/';
export const DB_FILE_NAME = 'orders.db';

class Currency {
    readonly address: string;
    readonly decimals: number;
    readonly lp: string;

    constructor(opts: { address: string; decimals: number; lp: string }) {
        this.address = opts.address;
        this.decimals = opts.decimals;
        this.lp = opts.lp;
    }
}

export const CURRENCY_ADDRESSES: Record<string, Currency> = {
    TON: new Currency({ address: '0', decimals: 1_000_000_000, lp: '' }),

    GRAM: new Currency({
        address: 'EQAN3PScHwP77_gko2l1ZF02IV4F1uTk15OExbUi9Idj8M2n',
        decimals: 1_000_000_000,
        lp: 'EQASBZLwa2vfdsgoDF2w96pdccBJJRxDNXXPUL7NMm0WdnMx',
    }),
    NOT: new Currency({
        address: 'EQA4vUDA7rEidZI6voKuErOYpWWR5jGj2_WCBIwyqiiNMTdP',
        decimals: 1_000_000_000,
        lp: 'EQARK5MKz_MK51U5AZjK3hxhLg1SmQG2Z-4Pb7Zapi_xwmrN',
    }),
    STON: new Currency({
        address: 'EQAjm8Db5pHlW27jvlBOaDHe5smtaxmpMgm0zjSZ_6QsnWuY',
        decimals: 1_000_000_000,
        lp: 'EQDtZHOtVWaf9UIU6rmjLPNLTGxNLNogvK5xUZlMRgZwQ4Gt',
    }),
    'USD₮': new Currency({
        address: 'EQCL1FH085zADKW9xXAmXGmqhOxxCcvQo6SnbhY75DIwmrTl',
        decimals: 1_000_000_000,
        lp: '',
    }),
    FISH: new Currency({
        address: 'EQBmixzri81nz9RSK8IsZ0JmoLI3BkRNhXytgOMo1A2ZGyGf',
        decimals: 1_000_000_000,
        lp: 'EQCVflRjTn91FKGZzy2UTHgLn3hG3TsOlQIsAOPcB57K5gT5',
    }),
    HIF: new Currency({
        address: 'EQDTXaFOMjW16eThuZpNhajCfloI9oAjtkf6SEns-YLCX_bL',
        decimals: 1_000_000_000,
        lp: 'EQCgsOdELK_Yl2Y_OCuzX4tIX0rILe-5T2rTeu5t0sWdTx1r',
    }),
};

export const ADDRESS_CURRENCIES = Object.assign(
    {},
    ...Object.entries(CURRENCY_ADDRESSES).map(([a, b]) => ({ [b.address]: a })),
);
