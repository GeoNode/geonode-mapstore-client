/**
 * Web-IFC Logging Helper
 * @module Logging
 */
export declare enum LogLevel {
    LOG_LEVEL_DEBUG = 0,
    LOG_LEVEL_INFO = 1,
    LOG_LEVEL_WARN = 2,
    LOG_LEVEL_ERROR = 3,
    LOG_LEVEL_OFF = 4
}
export declare abstract class Log {
    private static logLevel;
    static setLogLevel(level: number): void;
    static log(msg: string, ...args: any[]): void;
    static debug(msg: string, ...args: any[]): void;
    static info(msg: string, ...args: any[]): void;
    static warn(msg: string, ...args: any[]): void;
    static error(msg: string, ...args: any[]): void;
}
