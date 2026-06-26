import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { SIM_ON_THE_WAY_MS, SIM_DELIVERED_MS } from '../lib/simulationConfig';
import type { Order } from '../types/database';

/* ─── Types ────────────────────────────────────────────────── */

interface SimContextValue {
  activeOrders: Order[];
  currentTick: number;
  scheduleNewOrder: (order: Order) => void;
  cancelOrder: (orderId: string) => Promise<void>;
}

/* ─── Context ───────────────────────────────────────────────── */

const SimContext = createContext<SimContextValue | null>(null);

export function useOrderSimulation() {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error('useOrderSimulation must be inside OrderSimulationProvider');
  return ctx;
}

/* ─── Provider ──────────────────────────────────────────────── */

export function OrderSimulationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const activeOrdersRef = useRef<Order[]>([]);
  const [currentTick, setCurrentTick] = useState<number>(Date.now());
  const notifiedOrdersRef = useRef<Set<string>>(new Set());

  // Keep ref in sync with state to avoid stale closures in the interval
  useEffect(() => {
    activeOrdersRef.current = activeOrders;
  }, [activeOrders]);

  /* Fire browser + in-app notification */
  const fireDeliveredNotification = useCallback((order: Order) => {
    // 1. In-memory deduplication (fast path)
    if (notifiedOrdersRef.current.has(order.id)) return;
    
    // 2. Local Storage deduplication (cross-refresh path)
    let notifiedStr = localStorage.getItem('swiftcart_notified_orders');
    let notifiedArr: string[] = [];
    if (notifiedStr) {
      try {
        notifiedArr = JSON.parse(notifiedStr);
      } catch (e) { /* ignore parse error */ }
    }

    if (notifiedArr.includes(order.id)) {
      notifiedOrdersRef.current.add(order.id); // sync in-memory
      return; // Already notified on a previous session/refresh
    }

    // Add to both tracking structures
    notifiedOrdersRef.current.add(order.id);
    notifiedArr.push(order.id);
    localStorage.setItem('swiftcart_notified_orders', JSON.stringify(notifiedArr));

    toast.success(`Order #${order.id.slice(0, 8).toUpperCase()} Delivered!`, {
      description: `Your order totaling ₹${order.total_amount.toFixed(2)} has arrived.`,
      duration: 5000,
    });

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🎉 Order Delivered!', {
          body: `Order #${order.id.slice(0, 8).toUpperCase()} · ₹${order.total_amount.toFixed(2)} has arrived!`,
          icon: '/vite.svg',
          tag: `order-${order.id}`,
        });
      } catch (err) {
        console.warn('Desktop notification failed:', err);
      }
    }
  }, []);

  /* Interval Heartbeat */
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTick(now);
      
      activeOrdersRef.current.forEach((order) => {
        const elapsed = now - new Date(order.created_at).getTime();
        
        // Milestone 1: pending → processing
        if (order.status === 'pending' && elapsed >= SIM_ON_THE_WAY_MS) {
          supabase.from('orders').update({ status: 'processing' }).eq('id', order.id).then();
        }
        
        // Milestone 2: processing/pending → delivered
        if ((order.status === 'pending' || order.status === 'processing') && elapsed >= SIM_DELIVERED_MS) {
          fireDeliveredNotification(order);
          supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id).then();
        }
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  /* Called by CheckoutPage right after a successful order insert */
  const scheduleNewOrder = useCallback((order: Order) => {
    setActiveOrders((prev) => {
      if (prev.find((o) => o.id === order.id)) return prev;
      return [order, ...prev];
    });
  }, []);

  /* Cancel: optimistic UI update + Supabase update */
  const cancelOrder = useCallback(async (orderId: string) => {
    setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
  }, []);

  /* On user login: request notification permission + subscribe to updates */
  useEffect(() => {
    if (!user) {
      setActiveOrders([]);
      localStorage.removeItem('swiftcart_notified_orders');
      notifiedOrdersRef.current.clear();
      return;
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch((err) => console.warn('Failed to request notification permission:', err));
    }

    // Initial fetch
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setActiveOrders(data as Order[]);
        }
      });

    // Realtime updates
    const channel = supabase
      .channel('global-orders-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            setActiveOrders((prev) => {
              if (prev.find(o => o.id === newOrder.id)) return prev;
              return [newOrder, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Order;
            const oldRecord = payload.old as Order;
            
            // Realtime is just a fallback for notifications if it wasn't triggered locally
            if (updated.status === 'delivered' && oldRecord && oldRecord.status !== 'delivered') {
              fireDeliveredNotification(updated);
            } else if (updated.status === 'delivered' && !oldRecord) {
              fireDeliveredNotification(updated);
            }

            setActiveOrders((prev) => {
              if (updated.status === 'delivered' || updated.status === 'cancelled') {
                return prev.filter((o) => o.id !== updated.id);
              }
              const exists = prev.find((o) => o.id === updated.id);
              if (exists) {
                return prev.map((o) => o.id === updated.id ? updated : o);
              } else {
                return [updated, ...prev];
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fireDeliveredNotification]);

  return (
    <SimContext.Provider value={{ activeOrders, currentTick, scheduleNewOrder, cancelOrder }}>
      {children}
    </SimContext.Provider>
  );
}
