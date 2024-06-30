import { createLogger, transports, format } from 'winston';


export const logger = createLogger({
	transports: [
		new transports.File({filename: 'logs/bot.log'}),
		new transports.Console()
	],
	format: format.combine(
		format.colorize(),
		format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		format.printf(({ timestamp, level, message }) => {
			return `[${timestamp}] ${level}: ${message}`;
		})
	),
});

export const setLogLevel = (logLevel: string) => {
	logger.level = logLevel;
};