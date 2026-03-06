# 🔐 Acessos de Teste - CRM Smooking Brother

Este documento contém as credenciais de teste para diferentes tipos de usuários no sistema CRM.

## 👤 Tipos de Usuário

### 🛒 **CUSTOMER (Cliente)**
**Perfil:** Cliente final que pode fazer compras e acumular pontos

- **Email:** `cliente@teste.com`
- **Senha:** `customer123`
- **Nome:** João Cliente
- **Telefone:** (11) 99999-1111
- **Pontos:** 150 pontos de fidelidade

**Funcionalidades disponíveis:**
- ✅ Navegar pela loja
- ✅ Adicionar produtos ao carrinho
- ✅ Finalizar compras (PIX/Cartão)
- ✅ Acumular pontos de fidelidade
- ✅ Ver histórico de pedidos
- ✅ Gerenciar perfil

---

### 👨‍💼 **SELLER (Vendedor/Administrador)**
**Perfil:** Administrador com acesso completo ao sistema

- **Email:** `vendedor@teste.com`
- **Senha:** `seller123`
- **Nome:** Maria Vendedora
- **Telefone:** (11) 99999-2222

**Funcionalidades disponíveis:**
- ✅ **Dashboard:** Métricas de vendas e insights
- ✅ **Pedidos:** Gerenciar todos os pedidos
- ✅ **Gerenciar:** CRUD de produtos e categorias
- ✅ **Estoque:** Análise completa de estoque
- ✅ **Configurações:** Alterar logo da marca

---

### 🔧 **SELLER (Admin Original)**
**Perfil:** Conta administrativa padrão do sistema

- **Email:** `admin@smookingbrother.com`
- **Senha:** `admin123`
- **Nome:** (Não definido)

**Funcionalidades disponíveis:**
- ✅ Todas as funcionalidades de vendedor
- ✅ Acesso administrativo completo

---

## 🚀 Como Testar

### 1. **Acesso ao Sistema**
```
URL: http://localhost:3000
```

### 2. **Fluxo de Teste - Cliente**
1. Acesse a URL
2. Clique em "Entrar"
3. Use as credenciais do **CUSTOMER**
4. Navegue pela loja
5. Adicione produtos ao carrinho
6. Finalize uma compra
7. Verifique o perfil e pontos

### 3. **Fluxo de Teste - Vendedor**
1. Acesse a URL
2. Clique em "Entrar"
3. Use as credenciais do **SELLER**
4. Explore o Dashboard
5. Gerencie pedidos
6. Adicione/edite produtos
7. Analise o estoque

---

## 📊 Funcionalidades por Perfil

| Funcionalidade | Customer | Seller |
|---|---|---|
| Loja/Compras | ✅ | ❌ |
| Carrinho | ✅ | ❌ |
| Pontos Fidelidade | ✅ | ❌ |
| Dashboard Vendas | ❌ | ✅ |
| Gerenciar Pedidos | ❌ | ✅ |
| CRUD Produtos | ❌ | ✅ |
| Análise Estoque | ❌ | ✅ |
| Configurações | ❌ | ✅ |

---

## 🔄 Dados de Teste

### Produtos Disponíveis
- Charutos premium
- Narguilés diversos
- Acessórios para fumo
- Essências variadas

### Categorias
- Charutos
- Narguilés  
- Acessórios
- Essências

### Métodos de Pagamento
- **PIX:** Simulado (aprovação manual)
- **Cartão:** Integração Mercado Pago (sandbox)

---

## ⚠️ Observações Importantes

1. **Ambiente de Teste:** Todos os dados são fictícios
2. **Pagamentos:** Modo sandbox - não há cobrança real
3. **Estoque:** Limitado para demonstração
4. **Pontos:** Sistema de fidelidade funcional
5. **Logs:** Verifique o console para debug

---

## 🛠️ Troubleshooting

### Problemas Comuns:
- **Erro de login:** Verifique se o servidor está rodando
- **Produtos não carregam:** Reinicie o servidor
- **Pagamento falha:** Verifique configuração MP
- **Estoque zerado:** Use o painel admin para repor

### Comandos Úteis:
```bash
# Iniciar servidor
npm run dev

# Verificar logs
# Console do navegador (F12)

# Resetar dados
# Deletar arquivo tabacaria.db e reiniciar
```

---

**📅 Última atualização:** Março 2026  
**🔗 Repositório:** CRM-sb  
**👨‍💻 Desenvolvido para:** Smooking Brother
