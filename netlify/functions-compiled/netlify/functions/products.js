"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const storage_1 = require("./server/storage");
const handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json',
    };
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'CORS preflight' }),
        };
    }
    try {
        if (event.httpMethod === 'GET') {
            const products = await storage_1.storage.getProducts();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(products),
            };
        }
        if (event.httpMethod === 'POST') {
            const productData = JSON.parse(event.body || '{}');
            const newProduct = await storage_1.storage.createProduct(productData);
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(newProduct),
            };
        }
        if (event.httpMethod === 'PUT') {
            const productData = JSON.parse(event.body || '{}');
            const updatedProduct = await storage_1.storage.updateProduct(productData.id, productData);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(updatedProduct),
            };
        }
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ message: 'Method not allowed' }),
        };
    }
    catch (error) {
        console.error('Products API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
        };
    }
};
exports.handler = handler;
