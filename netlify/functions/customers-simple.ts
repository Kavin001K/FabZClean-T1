import { Handler } from '@netlify/functions';

// Sample data for demonstration
const sampleCustomers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    address: { street: "123 Main St", city: "New York", state: "NY", zip: "10001" },
    totalOrders: 5,
    totalSpent: "125.00",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    joinDate: new Date().toISOString(),
    lastOrder: new Date().toISOString()
  }
];

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
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(sampleCustomers),
      };
    }

    if (event.httpMethod === 'POST') {
      const customerData = JSON.parse(event.body || '{}');
      const newCustomer = {
        id: Date.now().toString(),
        ...customerData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        joinDate: new Date().toISOString(),
        lastOrder: new Date().toISOString()
      };
      
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
