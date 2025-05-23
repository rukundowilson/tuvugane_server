"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.pool = promise_1.default.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tuvugane',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
// Test database connection
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const connection = yield exports.pool.getConnection();
        console.log(`MySQL Connected: ${process.env.DB_HOST}`);
        connection.release();
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
});
// Execute SQL query with parameters
const query = (sql_1, ...args_1) => __awaiter(void 0, [sql_1, ...args_1], void 0, function* (sql, params = []) {
    try {
        const [results] = yield exports.pool.execute(sql, params);
        return results;
    }
    catch (error) {
        console.error(`Query error: ${error.message}`);
        throw error;
    }
});
exports.query = query;
exports.default = connectDB;
