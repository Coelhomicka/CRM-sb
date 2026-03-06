import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  User as UserIcon, 
  LayoutDashboard, 
  ClipboardList, 
  LogOut, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  DollarSign,
  Award,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie
} from 'recharts';
import { User, Product, Category, Order, Stats } from './types';

// --- COMPONENTS ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const variants: any = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-zinc-800 text-white hover:bg-zinc-900',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-border text-text hover:bg-surface-hover'
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-surface rounded-2xl border border-border shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

// --- MAIN APP ---

export default function App() {
  const [view, setView] = useState<'store' | 'cart' | 'profile' | 'seller-orders' | 'seller-dashboard' | 'seller-manage' | 'seller-stock' | 'auth'>('store');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [stockStats, setStockStats] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string>(localStorage.getItem('logoUrl') || 'https://image2url.com/r2/default/images/1772767434146-702f7a65-f338-4653-b3e4-bd31d6073ae9.png');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  
  // Management states
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Session expired');
      })
      .then(userData => {
        setUser(userData);
        if (userData.role === 'seller' && view === 'store') {
          setView('seller-dashboard');
        }
      })
      .catch(() => {
        logout();
      });
    }
  }, [token]);

  const updateLogo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLogoUrl) {
      setLogoUrl(newLogoUrl);
      localStorage.setItem('logoUrl', newLogoUrl);
      setNewLogoUrl('');
      alert('Logo atualizado com sucesso!');
    }
  };

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone })
      });
      const data = await res.json();
      if (res.ok) {
        if (authMode === 'login') {
          setToken(data.token);
          setUser(data.user);
          localStorage.setItem('token', data.token);
          setView(data.user.role === 'seller' ? 'seller-dashboard' : 'store');
        } else {
          setAuthMode('login');
          alert('Cadastro realizado! Faça login.');
        }
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setView('store');
    setCart([]);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const [showPixModal, setShowPixModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);

  const checkout = async () => {
    if (!token) {
      setView('auth');
      return;
    }
    
    if (paymentMethod === 'card') {
      if (!cardData.number || !cardData.expiry || !cardData.cvv) {
        alert('Por favor, preencha os dados obrigatórios do cartão (Número, Validade e CVV).');
        return;
      }
      
      if (!cardData.expiry.includes('/')) {
        alert('Formato de validade inválido. Use MM/AA (ex: 12/25)');
        return;
      }
    }

    setLoading(true);
    console.log('Iniciando checkout...', { paymentMethod });
    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    
    try {
      // 1. Create the order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          items: cart.map(item => ({ id: item.product.id, quantity: item.quantity, price: item.product.price })),
          total_amount: total
        })
      });
      
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      const orderId = orderData.orderId;
      setCurrentOrderId(orderId);

      // 2. Process payment
      let paymentPayload: any = {
        order_id: orderId,
        payment_method: paymentMethod,
      };

      if (paymentMethod === 'card') {
        const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
        if (!mpPublicKey || mpPublicKey === 'YOUR_MP_PUBLIC_KEY') {
          throw new Error('Chave pública do Mercado Pago não configurada (VITE_MP_PUBLIC_KEY).');
        }

        // Initialize MP SDK
        // @ts-ignore
        if (!window.MercadoPago) {
          throw new Error('SDK do Mercado Pago não carregado. Verifique sua conexão.');
        }

        // @ts-ignore
        const mp = new window.MercadoPago(mpPublicKey, { locale: 'pt-BR' });
        
        // Split expiry
        const expiryParts = cardData.expiry.split('/');
        const month = expiryParts[0].trim();
        let year = expiryParts[1].trim();
        
        // Ensure 4 digit year
        if (year.length === 2) year = '20' + year;
        
        console.log('Gerando token do cartão...');
        
        // Create token
        const tokenResponse = await mp.createCardToken({
          cardNumber: cardData.number.replace(/\s/g, ''),
          cardholderName: cardData.name || 'CLIENTE TABASAAS',
          cardExpirationMonth: month,
          cardExpirationYear: year,
          securityCode: cardData.cvv,
        });

        if (tokenResponse && tokenResponse.id) {
          console.log('Token gerado com sucesso:', tokenResponse.id);
          
          // Try to identify payment method
          const bin = cardData.number.replace(/\s/g, '').substring(0, 6);
          let paymentMethodId = '';
          
          try {
            const { results } = await mp.getPaymentMethods({ bin });
            paymentMethodId = results?.[0]?.id;
            console.log('Método de pagamento identificado:', paymentMethodId);
          } catch (e) {
            console.warn('Não foi possível identificar o método de pagamento automaticamente:', e);
          }

          paymentPayload.card_data = {
            token: tokenResponse.id,
            installments: 1,
            payment_method_id: paymentMethodId,
          };
        } else {
          console.error('Erro detalhado do MP Token:', tokenResponse);
          const errorMsg = tokenResponse?.cause?.[0]?.description || 'Erro ao gerar token do cartão. Verifique os dados.';
          throw new Error(errorMsg);
        }
      }

      const paymentRes = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentPayload)
      });

      const paymentData = await paymentRes.json();
      
      if (paymentRes.ok) {
        if (paymentMethod === 'pix') {
          setShowPixModal(true);
        } else {
          alert('Pagamento com cartão aprovado!');
          setView('profile');
        }
        setCart([]);
      } else {
        alert(paymentData.error || 'Erro ao processar pagamento');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao finalizar pedido');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    if (!currentOrderId) return;
    setLoading(true);
    // Simulate payment confirmation
    await fetch(`/api/seller/orders/${currentOrderId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'paid' })
    });
    setShowPixModal(false);
    setView('profile');
    setLoading(false);
    alert('Pagamento confirmado com sucesso!');
  };

  const fetchMyOrders = async () => {
    const res = await fetch('/api/orders/my', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setOrders(data);
  };

  const fetchSellerOrders = async () => {
    const res = await fetch('/api/seller/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setOrders(data);
  };

  const fetchStats = async () => {
    const response = await fetch('/api/seller/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setStats(data);
  };

  const fetchStockStats = async () => {
    try {
      console.log('[STOCK] Starting fetch stock stats...');
      console.log('[STOCK] Token:', token ? 'exists' : 'missing');
      console.log('[STOCK] Full token:', token);
      
      const url = '/api/seller/stock-analysis';
      console.log('[STOCK] Fetching URL:', url);
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[STOCK] Response received');
      console.log('[STOCK] Response status:', response.status);
      console.log('[STOCK] Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[STOCK] Response not ok:', response.status, response.statusText, errorText);
        alert(`Erro ao carregar dados de estoque: ${response.status} - ${errorText}`);
        setStockStats(null);
        return;
      }
      
      const data = await response.json();
      console.log('[STOCK] Data received successfully:', data);
      console.log('[STOCK] Data keys:', Object.keys(data));
      console.log('[STOCK] Setting stockStats state...');
      setStockStats(data);
      console.log('[STOCK] State set successfully');
    } catch (error) {
      console.error('[STOCK] Error type:', error.constructor.name);
      console.error('[STOCK] Error message:', error.message);
      console.error('[STOCK] Error stack:', error.stack);
      console.error('[STOCK] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      alert(`Erro ao buscar dados de estoque: ${error.message || 'Erro desconhecido'}`);
      setStockStats(null);
    }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setLoading(true);
    const method = editingProduct.id ? 'PATCH' : 'POST';
    const url = editingProduct.id ? `/api/seller/products/${editingProduct.id}` : '/api/seller/products';
    
    await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(editingProduct)
    });
    
    setShowProductModal(false);
    setEditingProduct(null);
    fetchProducts();
    setLoading(false);
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    await fetch(`/api/seller/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchProducts();
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setLoading(true);
    const method = editingCategory.id ? 'PATCH' : 'POST';
    const url = editingCategory.id ? `/api/seller/categories/${editingCategory.id}` : '/api/seller/categories';
    
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(editingCategory)
    });
    
    if (res.ok) {
      setShowCategoryModal(false);
      setEditingCategory(null);
      fetchCategories();
    } else {
      const data = await res.json();
      alert(data.error || 'Erro ao salvar categoria');
    }
    setLoading(false);
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    const res = await fetch(`/api/seller/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      fetchCategories();
    } else {
      const data = await res.json();
      alert(data.error || 'Erro ao excluir categoria');
    }
  };

  const updateOrderStatus = async (id: number, status: string) => {
    await fetch(`/api/seller/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    fetchSellerOrders();
  };

  const cancelOrder = async (id: number) => {
    if (!confirm('Tem certeza que deseja cancelar este pedido? O estoque será restaurado.')) return;
    await fetch(`/api/seller/orders/${id}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchSellerOrders();
  };

  useEffect(() => {
    console.log('[EFFECT] View changed to:', view, 'Token exists:', !!token);
    if (view === 'profile' && token) fetchMyOrders();
    if (view === 'seller-orders' && token) fetchSellerOrders();
    if (view === 'seller-dashboard' && token) fetchStats();
    if (view === 'seller-stock' && token) {
      console.log('[EFFECT] Calling fetchStockStats...');
      fetchStockStats();
    }
    if (view === 'seller-manage' && token) {
      fetchProducts();
      fetchCategories();
    }
  }, [view, token]);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('store')}>
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary overflow-hidden border border-primary/20">
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <span className="text-xl font-serif font-bold tracking-tight text-black">Smooking Brother</span>
        </div>

        <div className="flex items-center gap-4">
          {user?.role === 'seller' ? (
            <>
              <button onClick={() => setView('seller-dashboard')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${view === 'seller-dashboard' ? 'bg-surface-hover font-semibold' : 'hover:bg-surface-hover'}`}>
                <LayoutDashboard size={20} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button onClick={() => setView('seller-orders')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${view === 'seller-orders' ? 'bg-surface-hover font-semibold' : 'hover:bg-surface-hover'}`}>
                <ClipboardList size={20} />
                <span className="hidden sm:inline">Pedidos</span>
              </button>
              <button onClick={() => setView('seller-manage')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${view === 'seller-manage' ? 'bg-surface-hover font-semibold' : 'hover:bg-surface-hover'}`}>
                <Package size={20} />
                <span className="hidden sm:inline">Gerenciar</span>
              </button>
              <button onClick={() => setView('seller-stock')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${view === 'seller-stock' ? 'bg-surface-hover font-semibold' : 'hover:bg-surface-hover'}`}>
                <TrendingUp size={20} />
                <span className="hidden sm:inline">Estoque</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setView('store')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${view === 'store' ? 'bg-surface-hover font-semibold' : 'hover:bg-surface-hover'}`}>
                <ShoppingBag size={20} />
                <span className="hidden sm:inline">Loja</span>
              </button>
              <button onClick={() => setView('cart')} className="relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors">
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
                <span className="hidden sm:inline">Carrinho</span>
              </button>
            </>
          )}

          {token ? (
            <div className="flex items-center gap-2 border-l border-border pl-4">
              <button onClick={() => setView('profile')} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors">
                <UserIcon size={20} />
                <span className="hidden sm:inline">{user?.email.split('@')[0]}</span>
                {user?.role === 'customer' && (
                  <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Award size={10} /> {user.points} pts
                  </span>
                )}
              </button>
              <button onClick={logout} className="p-2 text-text-muted hover:text-primary transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Button onClick={() => setView('auth')}>Entrar</Button>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {showPixModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
              >
                <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Pagamento PIX</h3>
                <p className="text-text-muted text-sm mb-6">Escaneie o QR Code abaixo ou copie o código para pagar seu pedido #{currentOrderId}.</p>
                
                <div className="bg-surface-hover aspect-square rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-border">
                  <div className="text-text-muted flex flex-col items-center">
                    <div className="w-32 h-32 bg-zinc-800 rounded-lg mb-2 flex items-center justify-center text-white font-mono text-[8px] p-2 text-center overflow-hidden">
                      00020126580014BR.GOV.BCB.PIX0136...
                    </div>
                    <span className="text-[10px] font-bold uppercase">QR Code Simulado</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button onClick={confirmPayment} className="w-full py-3" disabled={loading}>
                    {loading ? 'Confirmando...' : 'Já paguei'}
                  </Button>
                  <button 
                    onClick={() => setShowPixModal(false)} 
                    className="text-sm text-text-muted hover:text-text font-medium"
                  >
                    Pagar depois
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {view === 'store' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col gap-4">
                <h1 className="text-4xl font-bold tracking-tight">Nossos Produtos</h1>
                <p className="text-text-muted max-w-2xl">Explore nossa seleção premium de charutos, narguilés e acessórios para a melhor experiência.</p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button 
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCategoryId === null ? 'bg-primary text-white shadow-md' : 'bg-surface border border-border text-text-muted hover:border-text'}`}
                >
                  Todos
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCategoryId === cat.id ? 'bg-primary text-white shadow-md' : 'bg-surface border border-border text-text-muted hover:border-text'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products
                  .filter(p => selectedCategoryId === null || p.category_id === selectedCategoryId)
                  .map(product => (
                  <Card key={product.id} className="group flex flex-col h-full">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-surface-hover">
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 bg-surface/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        {product.category_name}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                      <p className="text-text-muted text-sm line-clamp-2 mb-4">{product.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                      <div>
                        <span className="text-xs text-text-muted block">Preço</span>
                        <span className="text-xl font-bold text-primary">R$ {product.price.toFixed(2)}</span>
                      </div>
                      <Button 
                        onClick={() => addToCart(product)} 
                        disabled={product.stock <= 0}
                        className="p-3 rounded-xl"
                      >
                        <Plus size={20} />
                      </Button>
                    </div>
                    {product.stock <= 5 && product.stock > 0 && (
                      <span className="text-[10px] text-amber-600 font-bold mt-2">Apenas {product.stock} em estoque!</span>
                    )}
                    {product.stock === 0 && (
                      <span className="text-[10px] text-red-600 font-bold mt-2">Esgotado</span>
                    )}
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'cart' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <h1 className="text-3xl font-bold">Seu Carrinho</h1>
              
              {cart.length === 0 ? (
                <Card className="text-center py-12">
                  <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mx-auto mb-4 text-text-muted">
                    <ShoppingCart size={32} />
                  </div>
                  <p className="text-text-muted mb-6">Seu carrinho está vazio.</p>
                  <Button onClick={() => setView('store')}>Voltar para a Loja</Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    {cart.map(item => (
                      <Card key={item.product.id} className="flex gap-4 p-4">
                        <img src={item.product.image_url} className="w-20 h-20 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        <div className="flex-1">
                          <h3 className="font-bold">{item.product.name}</h3>
                          <p className="text-text-muted text-sm">R$ {item.product.price.toFixed(2)}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button onClick={() => updateCartQuantity(item.product.id, -1)} className="p-1 hover:bg-surface-hover rounded"><Minus size={16} /></button>
                            <span className="font-medium">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.product.id, 1)} className="p-1 hover:bg-surface-hover rounded"><Plus size={16} /></button>
                          </div>
                        </div>
                        <div className="text-right flex flex-col justify-between">
                          <button onClick={() => removeFromCart(item.product.id)} className="text-text-muted hover:text-primary"><Trash2 size={18} /></button>
                          <span className="font-bold">R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="space-y-4">
                    <Card className="sticky top-24">
                      <h2 className="font-bold text-xl mb-4">Resumo</h2>
                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-text-muted">
                          <span>Subtotal</span>
                          <span>R$ {cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-text-muted">
                          <span>Entrega</span>
                          <span className="text-primary font-medium">Grátis</span>
                        </div>
                        <div className="pt-4 border-t border-border flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>R$ {cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center gap-2 text-primary text-xs">
                          <Award size={14} />
                          <span>Você ganhará <b>{Math.floor(cartTotal / 10)} pontos</b> com esta compra!</span>
                        </div>
                      </div>

                      <div className="space-y-4 mb-6">
                        <p className="font-bold text-sm text-text">Forma de Pagamento</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => setPaymentMethod('pix')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'pix' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-text-muted'}`}
                          >
                            <DollarSign size={20} />
                            <span className="text-xs font-bold">PIX</span>
                          </button>
                          <button 
                            onClick={() => setPaymentMethod('card')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-text-muted'}`}
                          >
                            <CreditCard size={20} />
                            <span className="text-xs font-bold">Cartão</span>
                          </button>
                        </div>

                        {paymentMethod === 'card' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-3 pt-2"
                          >
                            <input 
                              type="text" 
                              placeholder="Número do Cartão"
                              value={cardData.number}
                              onChange={e => setCardData({...cardData, number: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:ring-2 focus:ring-primary outline-none"
                            />
                            <input 
                              type="text" 
                              placeholder="Nome no Cartão (Opcional)"
                              value={cardData.name}
                              onChange={e => setCardData({...cardData, name: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:ring-2 focus:ring-primary outline-none"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input 
                                type="text" 
                                placeholder="MM/AA"
                                value={cardData.expiry}
                                onChange={e => setCardData({...cardData, expiry: e.target.value})}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:ring-2 focus:ring-primary outline-none"
                              />
                              <input 
                                type="text" 
                                placeholder="CVV"
                                value={cardData.cvv}
                                onChange={e => setCardData({...cardData, cvv: e.target.value})}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:ring-2 focus:ring-primary outline-none"
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <Button onClick={checkout} className="w-full py-4 text-lg" disabled={loading}>
                        {loading ? 'Processando...' : `Pagar com ${paymentMethod === 'pix' ? 'PIX' : 'Cartão'}`}
                      </Button>
                      <p className="text-[10px] text-text-muted text-center mt-4">Pagamento processado via Mercado Pago Sandbox</p>
                    </Card>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'auth' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto pt-12"
            >
              <Card>
                <h2 className="text-2xl font-bold mb-6 text-center text-text">
                  {authMode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
                </h2>
                <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === 'register' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Nome Completo (Opcional)</label>
                        <input 
                          type="text" 
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text focus:ring-2 focus:ring-primary outline-none"
                          placeholder="Ex: João Silva"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Telefone (Opcional)</label>
                        <input 
                          type="tel" 
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text focus:ring-2 focus:ring-primary outline-none"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text focus:ring-2 focus:ring-primary outline-none"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Senha</label>
                    <input 
                      type="password" 
                      required 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text focus:ring-2 focus:ring-primary outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  <Button className="w-full py-3" disabled={loading}>
                    {loading ? 'Carregando...' : (authMode === 'login' ? 'Entrar' : 'Cadastrar')}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <button 
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    {authMode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-serif font-bold">Minha Conta</h1>
                {user?.role === 'customer' && (
                  <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl font-bold flex items-center gap-2 border border-primary/20">
                    <Award size={24} />
                    <span>{user?.points} Pontos Acumulados</span>
                  </div>
                )}
              </div>

              {user?.role === 'seller' && (
                <Card className="border-primary/20 bg-primary/5">
                  <h3 className="text-lg font-serif font-bold mb-4 flex items-center gap-2 text-primary">
                    <LayoutDashboard size={20} /> Configurações da Marca
                  </h3>
                  <form onSubmit={updateLogo} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">URL do Novo Logo</label>
                      <input 
                        type="url" 
                        required
                        placeholder="https://exemplo.com/logo.png"
                        value={newLogoUrl}
                        onChange={e => setNewLogoUrl(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-primary/20 bg-white text-text focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full sm:w-auto">Atualizar Logo</Button>
                    </div>
                  </form>
                  <p className="text-[10px] text-primary/60 mt-2 italic">* O logo será atualizado em toda a plataforma imediatamente.</p>
                </Card>
              )}

              <div className="space-y-4">
                <h2 className="text-xl font-serif font-bold">Histórico de Pedidos</h2>
                {orders.length === 0 ? (
                  <Card className="text-center py-8 text-text-muted">Nenhum pedido encontrado.</Card>
                ) : (
                  orders.map(order => (
                    <Card key={order.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          order.status === 'delivered' ? 'bg-emerald-100/20 text-emerald-600' : 
                          order.status === 'cancelled' ? 'bg-red-100/20 text-red-600' : 'bg-surface-hover text-text-muted'
                        }`}>
                          {order.status === 'delivered' ? <CheckCircle size={24} /> : 
                           order.status === 'cancelled' ? <XCircle size={24} /> : <Package size={24} />}
                        </div>
                        <div>
                          <p className="font-bold">Pedido #{order.id}</p>
                          <p className="text-xs text-text-muted">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {order.total_amount.toFixed(2)}</p>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          order.status === 'delivered' ? 'bg-emerald-100/20 text-emerald-600' : 
                          order.status === 'cancelled' ? 'bg-red-100/20 text-red-600' : 
                          order.status === 'out_for_delivery' ? 'bg-blue-100/20 text-blue-600' : 'bg-surface-hover text-text-muted'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {view === 'seller-orders' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-8"
            >
              <h1 className="text-3xl font-bold">Gestão de Pedidos</h1>
              
              <div className="grid grid-cols-1 gap-4">
                {orders.map(order => (
                  <Card key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-surface-hover rounded-xl flex items-center justify-center text-text-muted">
                        <Package size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">#{order.id}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            order.status === 'delivered' ? 'bg-emerald-100/20 text-emerald-600' : 
                            order.status === 'cancelled' ? 'bg-red-100/20 text-red-600' : 
                            order.status === 'out_for_delivery' ? 'bg-blue-100/20 text-blue-600' : 'bg-surface-hover text-text-muted'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-text-muted">{order.customer_email}</p>
                        <p className="text-xs text-text-muted/60">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-lg mr-4">R$ {order.total_amount.toFixed(2)}</span>
                      
                      {order.status === 'pending' && (
                        <Button onClick={() => updateOrderStatus(order.id, 'paid')} variant="outline" className="text-xs">Confirmar Pagamento</Button>
                      )}
                      {order.status === 'paid' && (
                        <Button onClick={() => updateOrderStatus(order.id, 'out_for_delivery')} className="text-xs flex items-center gap-1">
                          <Truck size={14} /> Saiu para Entrega
                        </Button>
                      )}
                      {order.status === 'out_for_delivery' && (
                        <Button onClick={() => updateOrderStatus(order.id, 'delivered')} variant="primary" className="text-xs flex items-center gap-1">
                          <CheckCircle size={14} /> Entregue
                        </Button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <Button onClick={() => cancelOrder(order.id)} variant="danger" className="text-xs flex items-center gap-1">
                          <XCircle size={14} /> Cancelar
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'seller-dashboard' && stats && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-8"
            >
              <h1 className="text-3xl font-bold">Insights do Negócio</h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100/20 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Faturamento Total</p>
                    <p className="text-2xl font-bold">R$ {stats.revenue.toFixed(2)}</p>
                  </div>
                </Card>
                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100/20 text-blue-600 rounded-2xl flex items-center justify-center">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Faturamento Mensal</p>
                    <p className="text-2xl font-bold">R$ {stats.monthlyRevenue.toFixed(2)}</p>
                  </div>
                </Card>
                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 text-primary rounded-2xl flex items-center justify-center">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Ticket Médio</p>
                    <p className="text-2xl font-bold">R$ {stats.avgTicket.toFixed(2)}</p>
                  </div>
                </Card>
                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100/20 text-purple-600 rounded-2xl flex items-center justify-center">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Novos Clientes</p>
                    <p className="text-2xl font-bold">{stats.newCustomers}</p>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg">Evolução de Vendas (Últimos 7 dias)</h3>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span>Receita Diária</span>
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.revenueHistory}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          fontSize={10} 
                          stroke="#64748b" 
                          tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          fontSize={10} 
                          stroke="#64748b" 
                          tickFormatter={(val) => `R$ ${val}`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          formatter={(val: any) => [`R$ ${val.toFixed(2)}`, 'Receita']}
                          labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                        />
                        <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <h3 className="font-bold text-lg mb-6">Top 5 Produtos Mais Vendidos</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} fontSize={12} stroke="#64748b" />
                        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="total_sold" radius={[0, 4, 4, 0]} barSize={20}>
                          {stats.topProducts.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={['#10b981', '#059669', '#047857', '#065f46', '#064e3b'][index % 5]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <h3 className="font-bold text-lg mb-6">Clientes que Mais Compraram</h3>
                  <div className="space-y-4">
                    {stats.topCustomers.map((customer, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-surface-hover rounded-xl border border-transparent hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{customer.name || 'Sem Nome'}</span>
                            <span className="text-[10px] text-text-muted">{customer.phone || 'Sem Telefone'}</span>
                          </div>
                        </div>
                        <span className="font-bold text-primary">R$ {customer.total_spent.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {view === 'seller-stock' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-8"
            >
              <h1 className="text-3xl font-bold">Análise de Estoque</h1>
              
              {!stockStats ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-text-muted">Carregando dados de estoque...</p>
                  <p className="text-xs text-text-muted mt-2">Se demorar muito, verifique o console (F12)</p>
                </div>
              ) : (
                <div>
              {console.log('[RENDER] Rendering stock stats with data:', stockStats)}

              {/* Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100/20 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Package size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Total Produtos</p>
                    <p className="text-2xl font-bold">{stockStats.overview.totalProducts}</p>
                  </div>
                </Card>
                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100/20 text-purple-600 rounded-2xl flex items-center justify-center">
                    <LayoutDashboard size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Categorias</p>
                    <p className="text-2xl font-bold">{stockStats.overview.totalCategories}</p>
                  </div>
                </Card>
                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100/20 text-red-600 rounded-2xl flex items-center justify-center">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Estoque Baixo</p>
                    <p className="text-2xl font-bold">{stockStats.overview.lowStockProducts}</p>
                  </div>
                </Card>
                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100/20 text-orange-600 rounded-2xl flex items-center justify-center">
                    <XCircle size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Sem Estoque</p>
                    <p className="text-2xl font-bold">{stockStats.overview.outOfStockProducts}</p>
                  </div>
                </Card>
                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100/20 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Valor Total</p>
                    <p className="text-2xl font-bold">R$ {stockStats.overview.totalStockValue.toFixed(2)}</p>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Stock by Category Chart */}
                <Card>
                  <h3 className="font-bold text-lg mb-6">Estoque por Categoria</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stockStats.stockByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="total_stock"
                        >
                          {stockStats.stockByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} unidades`, 'Estoque']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Top Value Products */}
                <Card>
                  <h3 className="font-bold text-lg mb-6">Produtos com Maior Valor em Estoque</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stockStats.topValueProducts.slice(0, 8)} layout="vertical" margin={{ left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} fontSize={10} stroke="#64748b" />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }} 
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Valor em Estoque']}
                        />
                        <Bar dataKey="stock_value" radius={[0, 4, 4, 0]} barSize={20} fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Critical Stock Products */}
                <Card>
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-500" />
                    Produtos com Estoque Crítico
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {stockStats.criticalStockProducts.map((product, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-surface-hover rounded-xl border border-transparent hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            product.status === 'Sem Estoque' ? 'bg-red-500' :
                            product.status === 'Crítico' ? 'bg-orange-500' :
                            'bg-yellow-500'
                          }`}></div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{product.name}</span>
                            <span className="text-[10px] text-text-muted">
                              {product.stock} unidades • R$ {product.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            product.status === 'Sem Estoque' ? 'bg-red-100 text-red-700' :
                            product.status === 'Crítico' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {product.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Stock Movement */}
                <Card>
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-500" />
                    Giro de Estoque (30 dias)
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {stockStats.stockMovement.map((product, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-surface-hover rounded-xl border border-transparent hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{product.name}</span>
                            <span className="text-[10px] text-text-muted">
                              Vendidos: {product.sold_quantity} • Estoque: {product.stock}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-primary">{product.turnover_rate}%</span>
                          <p className="text-[10px] text-text-muted">Taxa de Giro</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Category Value Analysis */}
              <Card>
                <h3 className="font-bold text-lg mb-6">Análise de Valor por Categoria</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockStats.stockByCategory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        fontSize={12} 
                        stroke="#64748b"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        fontSize={10} 
                        stroke="#64748b" 
                        tickFormatter={(val) => `R$ ${val}`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(val: any) => [`R$ ${val.toFixed(2)}`, 'Valor Total']}
                      />
                      <Bar dataKey="category_value" radius={[4, 4, 0, 0]} barSize={40}>
                        {stockStats.stockByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
                </div>
              )}
            </motion.div>
          )}

          {view === 'seller-manage' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-12"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">Gerenciamento</h1>
                <div className="flex gap-2">
                  <Button onClick={() => { setEditingCategory({}); setShowCategoryModal(true); }} variant="outline" className="flex items-center gap-2">
                    <Plus size={18} /> Nova Categoria
                  </Button>
                  <Button onClick={() => { setEditingProduct({ category_id: categories[0]?.id }); setShowProductModal(true); }} className="flex items-center gap-2">
                    <Plus size={18} /> Novo Produto
                  </Button>
                </div>
              </div>

              {/* Categories Management */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <LayoutDashboard size={20} className="text-primary" /> Categorias
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categories.map(cat => (
                    <Card key={cat.id} className="flex items-center justify-between p-4 group">
                      <span className="font-medium">{cat.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }} className="p-2 text-text-muted hover:text-primary transition-colors">
                          <Plus size={16} />
                        </button>
                        <button onClick={() => deleteCategory(cat.id)} className="p-2 text-text-muted hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Products Management */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Package size={20} className="text-primary" /> Produtos
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-4 font-bold text-sm text-text-muted uppercase tracking-wider">Produto</th>
                        <th className="py-4 font-bold text-sm text-text-muted uppercase tracking-wider">Categoria</th>
                        <th className="py-4 font-bold text-sm text-text-muted uppercase tracking-wider">Preço</th>
                        <th className="py-4 font-bold text-sm text-text-muted uppercase tracking-wider">Estoque</th>
                        <th className="py-4 font-bold text-sm text-text-muted uppercase tracking-wider text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <img src={product.image_url} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                              <div>
                                <p className="font-bold">{product.name}</p>
                                <p className="text-xs text-text-muted line-clamp-1">{product.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-1 bg-surface-hover rounded-md text-[10px] font-bold uppercase text-text-muted">
                              {product.category_name}
                            </span>
                          </td>
                          <td className="py-4 font-medium">R$ {product.price.toFixed(2)}</td>
                          <td className="py-4">
                            <span className={`font-bold ${product.stock <= 5 ? 'text-red-600' : 'text-text-muted'}`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setEditingProduct(product); setShowProductModal(true); }} className="p-2 text-text-muted hover:text-primary transition-colors">
                                <Plus size={18} />
                              </button>
                              <button onClick={() => deleteProduct(product.id)} className="p-2 text-text-muted hover:text-red-600 transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface rounded-3xl p-8 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh] border border-border"
            >
              <h3 className="text-2xl font-bold mb-6 text-text">{editingProduct?.id ? 'Editar Produto' : 'Novo Produto'}</h3>
              <form onSubmit={saveProduct} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-text-muted mb-1">Nome do Produto</label>
                    <input 
                      type="text" required
                      value={editingProduct?.name || ''}
                      onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-text-muted mb-1">Categoria</label>
                    <select 
                      required
                      value={editingProduct?.category_id || ''}
                      onChange={e => setEditingProduct({...editingProduct, category_id: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text focus:ring-2 focus:ring-primary outline-none"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Preço (R$)</label>
                    <input 
                      type="number" step="0.01" required
                      value={editingProduct?.price || ''}
                      onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Estoque</label>
                    <input 
                      type="number" required
                      value={editingProduct?.stock || ''}
                      onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-text-muted mb-1">URL da Imagem</label>
                    <input 
                      type="url" required
                      value={editingProduct?.image_url || ''}
                      onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-text-muted mb-1">Descrição</label>
                    <textarea 
                      rows={3} required
                      value={editingProduct?.description || ''}
                      onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text focus:ring-2 focus:ring-primary outline-none resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 py-3" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Produto'}
                  </Button>
                  <Button onClick={() => setShowProductModal(false)} variant="outline" className="flex-1 py-3">
                    Cancelar
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showCategoryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-border"
            >
              <h3 className="text-2xl font-bold mb-6 text-text">{editingCategory?.id ? 'Editar Categoria' : 'Nova Categoria'}</h3>
              <form onSubmit={saveCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Nome da Categoria</label>
                  <input 
                    type="text" required
                    value={editingCategory?.name || ''}
                    onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 py-3" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button onClick={() => setShowCategoryModal(false)} variant="outline" className="flex-1 py-3">
                    Cancelar
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 border-t border-border py-12 px-6 bg-surface">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary overflow-hidden border border-primary/20">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <span className="text-base font-serif font-bold text-black">Smooking Brother</span>
            </div>
            <p className="text-text-muted text-sm">A melhor plataforma para gestão de tabacarias e conveniências.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><button onClick={() => setView('store')} className="hover:text-primary">Loja</button></li>
              <li><button onClick={() => setView('auth')} className="hover:text-primary">Minha Conta</button></li>
              <li><button className="hover:text-primary">Termos de Uso</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Contato</h4>
            <p className="text-text-muted text-sm">suporte@tabasass.com</p>
            <p className="text-text-muted text-sm">+55 (11) 99999-9999</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border text-center text-text-muted/40 text-xs">
          © 2024 Smooking Brother. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
