import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { DB_FILE_NAME } from '../config';
import { User } from '../models';

export class OrdersDatabase {
    private db: Database;

    constructor() {}

    async init() {
        this.db = await open({
            filename: DB_FILE_NAME,
            driver: sqlite3.Database,
        });
        await this.db.run(`
            CREATE TABLE IF NOT EXISTS transactions(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hash VARCHAR NOT NULL,
                utime TIMESTAMP NOT NULL
            );
        `);
        await this.db.run(`
            CREATE TABLE IF NOT EXISTS users(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contract_address VARCHAR NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            );
        `);
    }

    async addTransaction(hash: string, utime: number) {
        await this.db.run('INSERT INTO transactions(hash, utime) VALUES(?, ?);', hash, utime);
    }

    async isTxExists(hash: string) {
        const result = await this.db.get('SELECT * FROM transactions WHERE hash = ?', hash);
        return !!result;
    }

    async addUser(contract_address: string, created_at: number, updated_at: number) {
        await this.db.run(
            'INSERT INTO users(contract_address, created_at, updated_at) VALUES(?, ?, ?);',
            contract_address,
            created_at,
            updated_at,
        );
    }

    async getUser(contract_address: string): Promise<User> {
        const row = await this.db.get('SELECT * FROM users WHERE contract_address = ?;', contract_address);

        if (!row) return undefined;
        return {
            id: row.id,
            contractAddress: row.contract_address,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    async getUsers(): Promise<Array<User>> {
        const result = await this.db.all('SELECT * FROM users;');

        const users: User[] = [];
        for (const row of result) {
            users.push({
                id: row.id,
                contractAddress: row.contract_address,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            });
        }

        return users;
    }

    async updateUser(contract_address: string, created_at: number, updated_at: number) {
        await this.db.run(
            `
            UPDATE users 
            SET created_at = IIF(created_at > ?, ?, created_at), 
                updated_at = IIF(updated_at < ?, ?, updated_at)
            WHERE contract_address = ?;
        `,
            created_at,
            created_at,
            updated_at,
            updated_at,
            contract_address,
        );
    }
}
