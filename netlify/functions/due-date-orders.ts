import { Handler } from '@netlify/functions';
import { db } from './db';

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
      const { type, days } = event.queryStringParameters || {};
      
      let orders;
      let title;
      
      switch (type) {
        case 'today':
          orders = await db.getTodaysDueOrders();
          title = "Today's Due Orders";
          break;
        case 'tomorrow':
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          orders = (await db.getOrdersByDueDate(1)).filter(order => {
            const dueDate = new Date(order.dueDate).toISOString().split('T')[0];
            return dueDate === tomorrowStr;
          });
          title = "Tomorrow's Due Orders";
          break;
        case 'overdue':
          orders = await db.getOverdueOrders();
          title = "Overdue Orders";
          break;
        case 'upcoming':
        default:
          const daysAhead = days ? parseInt(days) : 7;
          orders = await db.getOrdersByDueDate(daysAhead);
          title = `Upcoming Orders (Next ${daysAhead} days)`;
          break;
      }

      // Add additional computed fields for better display
      const enrichedOrders = orders.map(order => {
        const dueDate = new Date(order.dueDate);
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let urgency = 'normal';
        if (diffDays < 0) urgency = 'overdue';
        else if (diffDays === 0) urgency = 'today';
        else if (diffDays === 1) urgency = 'tomorrow';
        else if (diffDays <= 3) urgency = 'urgent';
        
        return {
          ...order,
          daysUntilDue: diffDays,
          urgency,
          isOverdue: diffDays < 0,
          isToday: diffDays === 0,
          isTomorrow: diffDays === 1,
          formattedDueDate: dueDate.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          formattedEstimatedDelivery: new Date(order.estimatedDelivery).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        };
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          title,
          orders: enrichedOrders,
          count: enrichedOrders.length,
          summary: {
            total: enrichedOrders.length,
            overdue: enrichedOrders.filter(o => o.isOverdue).length,
            today: enrichedOrders.filter(o => o.isToday).length,
            tomorrow: enrichedOrders.filter(o => o.isTomorrow).length,
            urgent: enrichedOrders.filter(o => o.urgency === 'urgent').length
          },
          timestamp: new Date().toISOString()
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Due date orders API error:', error);
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

