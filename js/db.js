  // Sistema de armazenamento local com suporte a exportação
  const DB = {
      // Inicializa o banco de dados
      init: function() {
          if (!localStorage.getItem('orion_pdv')) {
              // Criar estrutura inicial do banco
              const initialDB = {
                  produtos: [],
                  vendas: [],
                  configuracoes: {
                      nome_loja: 'ORION PDV',
                      cnpj: '',
                      telefone: '',
                      endereco: '',
                      postgres: {
                          host: '34.95.140.152',
                          porta: '5432',
                          banco: 'orion_pdv',
                          usuario: 'orion_app',
                          senha: '123456'
                      }
                  },
                  usuarios: [
                      {
                          id: 1,
                          username: 'admin',
                          password: 'admin123',
                          nome: 'Administrador',
                          tipo: 'admin'
                      }
                  ]
              };

              localStorage.setItem('orion_pdv', JSON.stringify(initialDB));
          }
      },

      // Obter o banco completo
      getDB: function() {
          return JSON.parse(localStorage.getItem('orion_pdv'));
      },

      // Salvar o banco completo
      saveDB: function(db) {
          localStorage.setItem('orion_pdv', JSON.stringify(db));
      },

      // Obter produtos
      getProdutos: function() {
          const db = this.getDB();
          return db.produtos || [];
      },

      // Buscar produto por código de barras
      getProdutoPorCodigoBarras: function(codigo) {
          const produtos = this.getProdutos();
          return produtos.find(p => p.codigo_barras === codigo);
      },

      // Salvar produto
      saveProduto: function(produto) {
          const db = this.getDB();

          if (produto.id) {
              // Atualizar produto existente
              const index = db.produtos.findIndex(p => p.id === produto.id);
              if (index !== -1) {
                  db.produtos[index] = produto;
              }
          } else {
              // Novo produto
              produto.id = Date.now();
              db.produtos.push(produto);
          }

          this.saveDB(db);
          return produto;
      },

      // Excluir produto
      deleteProduto: function(id) {
          const db = this.getDB();
          db.produtos = db.produtos.filter(p => p.id !== id);
          this.saveDB(db);
      },

      // Registrar venda
      saveVenda: function(venda) {
          const db = this.getDB();

          // Adicionar id e data
          venda.id = Date.now();
          venda.data = new Date().toISOString();

          // Atualizar estoque
          venda.itens.forEach(item => {
              const produto = db.produtos.find(p => p.id === item.produto_id);
              if (produto) {
                  produto.estoque -= item.quantidade;
              }
          });

          // Adicionar à lista de vendas
          db.vendas.push(venda);

          this.saveDB(db);
          return venda;
      },

      // Exportar para PostgreSQL (SQL)
      exportToSQL: function() {
          const db = this.getDB();
          let sql = '-- Exportação do ORION PDV para PostgreSQL\n';
          sql += '-- Data: ' + new Date().toLocaleString() + '\n\n';

          // Produtos
          sql += '-- Produtos\n';
          db.produtos.forEach(p => {
              sql += `INSERT INTO produtos (codigo_barras, nome, preco_venda, estoque, grupo_id) VALUES ` +
                    `('${p.codigo_barras}', '${p.nome.replace(/'/g, "''")}', ${p.preco_venda}, ${p.estoque},
  ${p.grupo_id || 'NULL'});\n`;
          });

          // Vendas
          sql += '\n-- Vendas\n';
          db.vendas.forEach(v => {
              sql += `INSERT INTO vendas (data, usuario, forma_pagamento, valor_total) VALUES ` +
                    `('${v.data}', '${v.usuario}', '${v.forma_pagamento}', ${v.valor_total});\n`;

              // Itens da venda
              sql += `-- Itens da venda ${v.id}\n`;
              v.itens.forEach(item => {
                  sql += `INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, subtotal) VALUES
   ` +
                        `(currval('vendas_id_seq'), (SELECT id FROM produtos WHERE codigo_barras =
  '${item.codigo_barras}'), ` +
                        `${item.quantidade}, ${item.preco_unitario}, ${item.subtotal});\n`;
              });
          });

          return sql;
      },

      // Exportar para CSV (Excel)
      exportToCSV: function() {
          const db = this.getDB();

          // Produtos CSV
          let produtosCSV = 'ID,Código de Barras,Nome,Preço,Estoque,Grupo\n';
          db.produtos.forEach(p => {
              produtosCSV += `${p.id},"${p.codigo_barras}","${p.nome.replace(/"/g,
  '""')}",${p.preco_venda},${p.estoque},${p.grupo_id || ''}\n`;
          });

          // Vendas CSV
          let vendasCSV = 'ID,Data,Usuário,Forma Pagamento,Valor Total\n';
          db.vendas.forEach(v => {
              vendasCSV += `${v.id},"${v.data}","${v.usuario}","${v.forma_pagamento}",${v.valor_total}\n`;
          });

          // Itens de Venda CSV
          let itensCSV = 'Venda ID,Produto ID,Código de Barras,Nome Produto,Quantidade,Preço Unitário,Subtotal\n';
          db.vendas.forEach(v => {
              v.itens.forEach(item => {
                  itensCSV += `${v.id},${item.produto_id},"${item.codigo_barras}","${item.nome_produto}",${item.quant
  idade},${item.preco_unitario},${item.subtotal}\n`;
              });
          });

          return {
              produtos: produtosCSV,
              vendas: vendasCSV,
              itens: itensCSV
          };
      },

      // Backup completo do banco de dados
      backup: function() {
          return JSON.stringify(this.getDB(), null, 2);
      },

      // Restaurar backup
      restore: function(backupData) {
          try {
              const data = JSON.parse(backupData);
              if (data.produtos && data.vendas && data.usuarios) {
                  localStorage.setItem('orion_pdv', backupData);
                  return true;
              }
              return false;
          } catch (e) {
              console.error('Erro ao restaurar backup:', e);
              return false;
          }
      }
  };

  // Inicializar o banco
  DB.init();
