import { Handler } from '@netlify/functions';
import { storage } from '../../server/storage';

export const handler: Handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight' }),
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      const orders = await storage.getOrders();
      const products = await storage.getProducts();
      
      const productMap = new Map(products.map(product => [product.id, product.name]));
      
      const transformedOrders = orders.map(order => {
        const firstItem = order.items?.[0];
        const productId = firstItem?.productId;
        const serviceName = productId ? productMap.get(productId) || 'Unknown Service' : 'Unknown Service';
        
        return {
          ...order,
          date: order.createdAt,
          total: parseFloat(order.totalAmount),
          service: serviceName,
          priority: 'Normal'
        };
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(transformedOrders),
      };
    }

    if (event.httpMethod === 'POST') {
      const orderData = JSON.parse(event.body || '{}');
      const newOrder = await storage.createOrder(orderData);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newOrder),
      };
    }

    if (event.httpMethod === 'PUT') {
      const orderData = JSON.parse(event.body || '{}');
      const updatedOrder = await storage.updateOrder(orderData.id, orderData);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedOrder),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Orders API Error:', error);
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