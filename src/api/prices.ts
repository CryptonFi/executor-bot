import axios from 'axios';
import { logger } from '../logger';
import { CURRENCY_ADDRESSES } from '../config';

export async function GetAssetUsdPrice(assetName: string): Promise<number> {
    if (assetName === 'USD₮') {
        return 1;
    } else if (assetName === 'TON') {
        return await FetchTonPrice();
    } else {
        return await FetchJettonPrice(assetName);
    }
}

async function FetchJettonPrice(jettonName: string): Promise<number> {
    try {
        const lpAddress = CURRENCY_ADDRESSES[jettonName].lp;
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/pairs/ton/${lpAddress}`);
        return response.data.pair.priceUsd;
    } catch (error) {
        logger.error(`[FetchJettonPrice] Failed to fetch price: ${error}`);
    }
}

async function FetchTonPrice(): Promise<number> {
    try {
        const response = await axios.get(`https://api.coinpaprika.com/v1/tickers/toncoin-the-open-network`);
        return response.data.quotes.USD.price;
    } catch (error) {
        logger.error(`[FetchTonPrice] Failed to fetch price: ${error}`);
    }
}
