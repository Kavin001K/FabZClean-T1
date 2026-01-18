import fetch from 'node-fetch';

async function testUpdate() {
  try {
    // 1. Get an order (assuming one exists)
    console.log('Fetching orders...');
    
    // Attempt to login first to get a token if needed (skipping for now, assuming dev mode might allow or we can bypass)
    // Actually, the server requires JWT. We need to simulate a login or use a known token.
    // Or we can temporarily disable auth in server/routes/orders.ts if needed, but let's try without first.
    // Wait, previous turns showed we re-enabled JWT.
    // Let's try to login as admin/admin (default seed)
    
    let token = '';
    try {
        const loginRes = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'password123' }) // Assuming default seed
        });
        const loginData: any = await loginRes.json();
        if (loginData.token) {
            token = loginData.token;
            console.log('Logged in successfully.');
        } else {
            console.log('Login failed, proceeding without token (might fail).');
        }
    } catch (e) {
        console.log('Login error:', e);
    }

    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch('http://localhost:5001/api/orders', { headers });
    const data: any = await response.json();
    
    if (!data || !data.data || data.data.length === 0) {
      console.log('No orders found to test.');
      return;
    }

    const order = data.data[0];
    console.log('Testing with order:', order.id, 'Current Total:', order.totalAmount);

    // 2. Update the order
    const updatePayload = {
      totalAmount: "150.00",
      items: [{
        serviceName: "Test Service",
        quantity: 1,
        price: "150.00",
        subtotal: "150.00"
      }]
    };

    console.log('Sending update:', updatePayload);

    const updateResponse = await fetch(`http://localhost:5001/api/orders/${order.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatePayload)
    });

    const updateResult: any = await updateResponse.json();
    console.log('Update Result:', JSON.stringify(updateResult, null, 2));

    // 3. Verify update
    const verifyResponse = await fetch(`http://localhost:5001/api/orders/${order.id}`, { headers });
    const verifyData: any = await verifyResponse.json();
    const verifyOrder = verifyData.data;

    console.log('Verified Order Total:', verifyOrder.totalAmount);
    console.log('Verified Order Items:', JSON.stringify(verifyOrder.items, null, 2));

    if (verifyOrder.totalAmount === "150.00") {
      console.log('SUCCESS: Total Amount updated correctly.');
    } else {
      console.log('FAILURE: Total Amount did NOT update.');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUpdate();
