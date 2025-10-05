import { Handler } from '@netlify/functions';
import { db } from './db';

export const handler: Handler = async (event, context) => {
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
      const customers = await db.getCustomers();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(customers),
      };
    }

    if (event.httpMethod === 'POST') {
      const customerData = JSON.parse(event.body || '{}');
      const newCustomer = await db.createCustomer(customerData);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newCustomer),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Customers API Error:', error);
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
