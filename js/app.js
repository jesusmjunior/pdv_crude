  // Carrinho de compras
  let carrinho = [];

  // Verificar autenticação
  function verificarAutenticacao() {
      const usuario = localStorage.getItem('usuario_atual');
      if (!usuario) {
          window.location.href = 'login.html';
      }
  }

  // Inicializar quando a página carregar
  document.addEventListener('DOMContentLoaded', function() {
      // Verificar autenticação
      verificarAutenticacao();

      // Inicializar componentes
      inicializarMenu();
      inicializarProdutos();
      inicializarScanner();
      inicializarFormularios();
      inicializarExportacao();
  });

  // Inicializar menu de navegação
  function inicializarMenu() {
      const menuItems = document.querySelectorAll('.menu-item');
      const views = document.querySelectorAll('.view');

      menuItems.forEach(item => {
          item.addEventListener('click', function() {
              const targetView = this.getAttribute('data-view');

              // Atualizar menu
              menuItems.forEach(i => i.classList.remove('active'));
              this.classList.add('active');

              // Mostrar view
              views.forEach(v => v.classList.remove('active'));
              document.getElementById(targetView).classList.add('active');

              // Ações específicas para cada view
              if (targetView === 'produtos-view') {
                  carregarTabelaProdutos();
              }
          });
      });

      // Botão de logout
      document.getElementById('logout-btn').addEventListener('click', function() {
          localStorage.removeItem('usuario_atual');
          window.location.href = 'login.html';
      });
  }

  // Inicializar produtos na tela PDV
  function inicializarProdutos() {
      carregarProdutos();

      // Pesquisa de produtos
      document.getElementById('search-btn').addEventListener('click', function() {
          const query = document.getElementById('product-search').value.trim();
          carregarProdutos(query);
      });

      // Limpar venda
      document.getElementById('clear-sale-btn').addEventListener('click', function() {
          if (carrinho.length > 0) {
              if (confirm('Tem certeza que deseja limpar a venda atual?')) {
                  carrinho = [];
                  atualizarCarrinho();
              }
          }
      });

      // Finalizar venda
      document.getElementById('checkout-btn').addEventListener('click', function() {
          if (carrinho.length === 0) return;

          const total = calcularTotal();
          document.getElementById('payment-total').textContent = formatarMoeda(total);

          // Abrir modal de pagamento
          document.getElementById('payment-modal').style.display = 'block';
      });

      // Confirmar pagamento
      document.getElementById('confirm-payment-btn').addEventListener('click', function() {
          const formaPagamento = document.getElementById('payment-method').value;
          const usuario = JSON.parse(localStorage.getItem('usuario_atual'));

          // Verificar dinheiro e troco
          if (formaPagamento === 'dinheiro') {
              const valorRecebido = parseFloat(document.getElementById('received-amount').value);
              const total = calcularTotal();

              if (valorRecebido < total) {
                  alert('Valor recebido é menor que o total da venda!');
                  return;
              }
          }

          // Criar objeto da venda
          const venda = {
              usuario: usuario.username,
              data: new Date().toISOString(),
              forma_pagamento: formaPagamento,
              valor_total: calcularTotal(),
              itens: carrinho.map(item => ({
                  produto_id: item.id,
                  codigo_barras: item.codigo_barras,
                  nome_produto: item.nome,
                  quantidade: item.quantidade,
                  preco_unitario: item.preco_venda,
                  subtotal: item.quantidade * item.preco_venda
              }))
          };

          // Salvar venda
          DB.saveVenda(venda);

          // Limpar carrinho
          carrinho = [];
          atualizarCarrinho();

          // Fechar modal
          document.getElementById('payment-modal').style.display = 'none';

          // Feedback
          alert('Venda finalizada com sucesso!');

          // Atualizar produtos
          carregarProdutos();
      });

      // Cancelar pagamento
      document.getElementById('cancel-payment-btn').addEventListener('click', function() {
          document.getElementById('payment-modal').style.display = 'none';
      });

      // Cálculo de troco
      document.getElementById('received-amount').addEventListener('input', function() {
          const valorRecebido = parseFloat(this.value) || 0;
          const total = calcularTotal();
          const troco = Math.max(0, valorRecebido - total);

          document.getElementById('change-amount').textContent = formatarMoeda(troco);
      });
  }

  // Carregar produtos na grade de produtos
  function carregarProdutos(query = '') {
      const produtosGrid = document.getElementById('products-grid');
      let produtos = DB.getProdutos();

      // Filtrar por busca
      if (query) {
          query = query.toLowerCase();
          produtos = produtos.filter(p =>
              p.nome.toLowerCase().includes(query) ||
              p.codigo_barras.includes(query)
          );
      }

      // Limpar e preencher grid
      produtosGrid.innerHTML = '';

      if (produtos.length === 0) {
          produtosGrid.innerHTML = '<div class="no-products">Nenhum produto encontrado</div>';
          return;
      }

      produtos.forEach(produto => {
          const card = document.createElement('div');
          card.className = 'product-card';
          card.innerHTML = `
              <div class="product-name">${produto.nome}</div>
              <div class="product-price">${formatarMoeda(produto.preco_venda)}</div>
              <div class="product-stock">Estoque: ${produto.estoque}</div>
          `;

          // Adicionar ao carrinho ao clicar
          card.addEventListener('click', function() {
              adicionarAoCarrinho(produto);
          });

          produtosGrid.appendChild(card);
      });
  }

  // Carregar tabela de produtos
  function carregarTabelaProdutos() {
      const tbody = document.querySelector('#products-table tbody');
      const produtos = DB.getProdutos();

      tbody.innerHTML = '';

      produtos.forEach(p => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
              <td>${p.codigo_barras}</td>
              <td>${p.nome}</td>
              <td>${formatarMoeda(p.preco_venda)}</td>
              <td>${p.estoque}</td>
              <td>
                  <button class="btn-edit" data-id="${p.id}">
                      <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-delete" data-id="${p.id}">
                      <i class="fas fa-trash"></i>
                  </button>
              </td>
          `;

          tbody.appendChild(tr);
      });

      // Eventos dos botões
      document.querySelectorAll('.btn-edit').forEach(btn => {
          btn.addEventListener('click', function() {
              const id = parseInt(this.getAttribute('data-id'));
              abrirFormularioProduto(id);
          });
      });

      document.querySelectorAll('.btn-delete').forEach(btn => {
          btn.addEventListener('click', function() {
              const id = parseInt(this.getAttribute('data-id'));
              if (confirm('Tem certeza que deseja excluir este produto?')) {
                  DB.deleteProduto(id);
                  carregarTabelaProdutos();
                  carregarProdutos();
              }
          });
      });
  }

  // Abrir formulário de produto
  function abrirFormularioProduto(id = null) {
      const form = document.getElementById('product-form');
      const modal = document.getElementById('product-modal');
      const title = document.getElementById('product-modal-title');

      // Resetar formulário
      form.reset();
      document.getElementById('product-id').value = '';

      if (id) {
          // Modo edição
          title.textContent = 'Editar Produto';

          const produto = DB.getProdutos().find(p => p.id === id);
          if (produto) {
              document.getElementById('product-id').value = produto.id;
              document.getElementById('product-code').value = produto.codigo_barras || '';
              document.getElementById('product-name').value = produto.nome || '';
              document.getElementById('product-price').value = produto.preco_venda || '';
              document.getElementById('product-stock').value = produto.estoque || '';
              document.getElementById('product-group').value = produto.grupo_id || '';
          }
      } else {
          // Modo criação
          title.textContent = 'Novo Produto';
      }

      // Abrir modal
      modal.style.display = 'block';
  }

  // Inicializar scanner de código de barras
  function inicializarScanner() {
      // Scanner na tela PDV
      document.getElementById('barcode-btn').addEventListener('click', function() {
          const scannerContainer = document.getElementById('scanner-container');
          const viewfinder = document.getElementById('scanner-viewfinder');

          scannerContainer.style.display = 'block';

          // Iniciar scanner
          BarcodeScanner.init(viewfinder, function(barcode) {
              // Parar scanner
              BarcodeScanner.stop();
              scannerContainer.style.display = 'none';

              // Buscar produto
              const produto = DB.getProdutoPorCodigoBarras(barcode);

              if (produto) {
                  // Adicionar ao carrinho
                  adicionarAoCarrinho(produto);
              } else {
                  // Perguntar se deseja cadastrar
                  if (confirm(`Produto com código ${barcode} não encontrado. Deseja cadastrá-lo?`)) {
                      // Abrir formulário preenchendo o código
                      const form = document.getElementById('product-form');
                      form.reset();
                      document.getElementById('product-id').value = '';
                      document.getElementById('product-code').value = barcode;

                      // Abrir modal
                      document.getElementById('product-modal-title').textContent = 'Novo Produto';
                      document.getElementById('product-modal').style.display = 'block';
                  }
              }
          });
      });

      // Fechar scanner
      document.getElementById('close-scanner').addEventListener('click', function() {
          BarcodeScanner.stop();
          document.getElementById('scanner-container').style.display = 'none';
      });

      // Scanner no formulário de produto
      document.getElementById('scan-product-code').addEventListener('click', function() {
          const scannerContainer = document.getElementById('scanner-container');
          const viewfinder = document.getElementById('scanner-viewfinder');

          // Esconder modal de produto
          document.getElementById('product-modal').style.display = 'none';

          // Mostrar scanner
          scannerContainer.style.display = 'block';

          // Iniciar scanner
          BarcodeScanner.init(viewfinder, function(barcode) {
              // Parar scanner
              BarcodeScanner.stop();
              scannerContainer.style.display = 'none';

              // Preencher código no formulário
              document.getElementById('product-code').value = barcode;

              // Reabrir modal
              document.getElementById('product-modal').style.display = 'block';
          });
      });
  }

  // Inicializar formulários
  function inicializarFormularios() {
      // Botão novo produto
      document.getElementById('add-product-btn').addEventListener('click', function() {
          abrirFormularioProduto();
      });

      // Formulário de produto
      document.getElementById('save-product-btn').addEventListener('click', function() {
          const form = document.getElementById('product-form');
          const id = document.getElementById('product-id').value;
          const codigo = document.getElementById('product-code').value;
          const nome = document.getElementById('product-name').value;
          const preco = parseFloat(document.getElementById('product-price').value);
          const estoque = parseInt(document.getElementById('product-stock').value);
          const grupo = document.getElementById('product-group').value;

          // Validações básicas
          if (!codigo || !nome || isNaN(preco) || isNaN(estoque)) {
              alert('Preencha todos os campos corretamente!');
              return;
          }

          // Criar objeto do produto
          const produto = {
              id: id ? parseInt(id) : null,
              codigo_barras: codigo,
              nome: nome,
              preco_venda: preco,
              estoque: estoque,
              grupo_id: grupo || null
          };

          // Salvar produto
          DB.saveProduto(produto);

          // Fechar modal
          document.getElementById('product-modal').style.display = 'none';

          // Atualizar visões
          carregarTabelaProdutos();
          carregarProdutos();
      });

      // Fechar modal
      document.getElementById('cancel-product-btn').addEventListener('click', function() {
          document.getElementById('product-modal').style.display = 'none';
      });

      document.querySelector('#product-modal .close').addEventListener('click', function() {
          document.getElementById('product-modal').style.display = 'none';
      });

      // Fechar modal ao clicar fora
      window.addEventListener('click', function(event) {
          const modal = document.getElementById('product-modal');
          if (event.target === modal) {
              modal.style.display = 'none';
          }

          const paymentModal = document.getElementById('payment-modal');
          if (event.target === paymentModal) {
              paymentModal.style.display = 'none';
          }
      });
  }

  // Inicializar exportação
  function inicializarExportacao() {
      // Exportar para SQL
      document.getElementById('export-sql-btn').addEventListener('click', function() {
          Exporter.exportToSQL();
      });

      // Exportar para Excel
      document.getElementById('export-excel-btn').addEventListener('click', function() {
          Exporter.exportToExcel();
      });

      // Backup completo
      document.getElementById('backup-btn').addEventListener('click', function() {
          Exporter.backupDB();
      });

      // Restaurar backup
      document.getElementById('restore-btn').addEventListener('click', function() {
          document.getElementById('restore-file').click();
      });

      document.getElementById('restore-file').addEventListener('change', function() {
          if (this.files.length > 0) {
              Exporter.restoreDB(this.files[0]);
          }
      });
  }

  // Adicionar ao carrinho
  function adicionarAoCarrinho(produto) {
      // Verificar estoque
      if (produto.estoque <= 0) {
          alert('Produto sem estoque disponível!');
          return;
      }

      // Verificar se já está no carrinho
      const index = carrinho.findIndex(item => item.id === produto.id);

      if (index !== -1) {
          // Verificar estoque disponível
          if (carrinho[index].quantidade >= produto.estoque) {
              alert('Estoque insuficiente!');
              return;
          }

          // Incrementar quantidade
          carrinho[index].quantidade++;
      } else {
          // Adicionar ao carrinho
          carrinho.push({
              ...produto,
              quantidade: 1
          });
      }

      // Atualizar exibição do carrinho
      atualizarCarrinho();
  }

  // Atualizar exibição do carrinho
  function atualizarCarrinho() {
      const cartItems = document.getElementById('cart-items');
      const cartTotal = document.getElementById('cart-total');
      const checkoutBtn = document.getElementById('checkout-btn');

      cartItems.innerHTML = '';

      if (carrinho.length === 0) {
          cartItems.innerHTML = '<div class="empty-cart">Nenhum item adicionado</div>';
          cartTotal.textContent = formatarMoeda(0);
          checkoutBtn.disabled = true;
          return;
      }

      // Exibir itens
      carrinho.forEach((item, index) => {
          const subtotal = item.quantidade * item.preco_venda;

          const cartItem = document.createElement('div');
          cartItem.className = 'cart-item';
          cartItem.innerHTML = `
              <div class="item-name">${item.nome}</div>
              <div class="item-quantity">
                  <button class="qty-btn minus" data-index="${index}">-</button>
                  <span>${item.quantidade}</span>
                  <button class="qty-btn plus" data-index="${index}">+</button>
              </div>
              <div class="item-price">${formatarMoeda(subtotal)}</div>
              <button class="remove-btn" data-index="${index}">&times;</button>
          `;

          cartItems.appendChild(cartItem);
      });

      // Adicionar eventos aos botões
      document.querySelectorAll('.qty-btn.minus').forEach(btn => {
          btn.addEventListener('click', function() {
              const index = parseInt(this.getAttribute('data-index'));
              if (carrinho[index].quantidade > 1) {
                  carrinho[index].quantidade--;
                  atualizarCarrinho();
              }
          });
      });

      document.querySelectorAll('.qty-btn.plus').forEach(btn => {
          btn.addEventListener('click', function() {
              const index = parseInt(this.getAttribute('data-index'));
              const produto = DB.getProdutos().find(p => p.id === carrinho[index].id);

              if (carrinho[index].quantidade < produto.estoque) {
                  carrinho[index].quantidade++;
                  atualizarCarrinho();
              } else {
                  alert('Estoque insuficiente!');
              }
          });
      });

      document.querySelectorAll('.remove-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const index = parseInt(this.getAttribute('data-index'));
              carrinho.splice(index, 1);
              atualizarCarrinho();
          });
      });

      // Atualizar total
      cartTotal.textContent = formatarMoeda(calcularTotal());
      checkoutBtn.disabled = false;
  }

  // Calcular total do carrinho
  function calcularTotal() {
      return carrinho.reduce((total, item) => total + (item.quantidade * item.preco_venda), 0);
  }

  // Formatar número como moeda
  function formatarMoeda(valor) {
      return 'R$ ' + valor.toFixed(2).replace('.', ',');
  }
