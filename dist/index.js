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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const testRoutes_1 = __importDefault(require("./routes/testRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const superAdminRoutes_1 = __importDefault(require("./routes/superAdminRoutes"));
const agencyRoutes_1 = __importDefault(require("./routes/agencyRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const ticketRoutes_1 = __importDefault(require("./routes/ticketRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('dev'));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/api/test', testRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/super-admin', superAdminRoutes_1.default);
app.use('/api/agencies', agencyRoutes_1.default);
app.use('/api/admins', adminRoutes_1.default);
app.use('/api/categories', categoryRoutes_1.default);
app.use('/api/tickets', ticketRoutes_1.default);
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Tuvugane API' });
});
// Add global error handler at the end
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ message: 'Internal server error (global handler)' });
});
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Connect to database
        // await connectDB();
        // Start listening
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
});
startServer();
