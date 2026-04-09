import type { FC } from 'react';
import { useState } from 'react';
import { useMfeAuth, RequirePermission } from '@mfe/auth-mfe-consumer';

interface Order {
  id: string;
  customer: string;
  total: number;
  status: string;
}

const MOCK_ORDERS: Order[] = [
  { id: 'ORD-001', customer: 'Acme Corp', total: 1250.00, status: 'Shipped' },
  { id: 'ORD-002', customer: 'Globex Inc', total: 890.50, status: 'Processing' },
  { id: 'ORD-003', customer: 'Initech LLC', total: 2100.00, status: 'Delivered' },
];

const thStyle = { textAlign: 'left' as const, padding: '8px', borderBottom: '2px solid #ccc' };
const tdStyle = { padding: '8px', borderBottom: '1px solid #eee' };

const OrdersModule: FC = () => {
  const { state } = useMfeAuth();
  const [orders] = useState<Order[]>(MOCK_ORDERS);

  return (
    <div>
      <h1>Orders Dashboard</h1>
      {state.status === 'AUTHENTICATED' && (
        <p>
          Logged in as: {state.user.name} ({state.user.email})
        </p>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Order ID</th>
            <th style={thStyle}>Customer</th>
            <th style={thStyle}>Total</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td style={tdStyle}>{order.id}</td>
              <td style={tdStyle}>{order.customer}</td>
              <td style={tdStyle}>{`$${order.total.toFixed(2)}`}</td>
              <td style={tdStyle}>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <RequirePermission
        permission="orders:write"
        fallback={<p style={{ color: '#999', marginTop: '16px' }}>You do not have permission to create orders.</p>}
      >
        <div style={{ marginTop: '16px' }}>
          <button
            style={{ padding: '8px 16px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => { alert('Create Order clicked'); }}
          >
            Create Order
          </button>
        </div>
      </RequirePermission>
    </div>
  );
};

export default OrdersModule;
