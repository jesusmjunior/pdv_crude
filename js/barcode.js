// Sistema de leitura de código de barras
  const BarcodeScanner = {
      // Inicia o scanner em um elemento HTML
      init: function(targetElement, callback) {
          Quagga.init({
              inputStream: {
                  name: "Live",
                  type: "LiveStream",
                  target: targetElement,
                  constraints: {
                      width: { min: 640 },
                      height: { min: 480 },
                      facingMode: "environment"
                  },
              },
              locator: {
                  patchSize: "medium",
                  halfSample: true
              },
              decoder: {
                  readers: [
                      "code_128_reader",
                      "ean_reader",
                      "ean_8_reader",
                      "code_39_reader",
                      "upc_reader",
                      "upc_e_reader"
                  ]
              },
              locate: true
          }, function(err) {
              if (err) {
                  console.error("Erro ao iniciar scanner:", err);
                  alert("Não foi possível acessar a câmera. Verifique as permissões.");
                  return;
              }
              console.log("Scanner iniciado!");
              Quagga.start();
          });

          // Evento para quando detectar um código de barras
          Quagga.onDetected(function(result) {
              console.log("Código detectado:", result.codeResult.code);

              // Som de beep
              BarcodeScanner.beep();

              // Executar callback passando o código
              if (callback) {
                  callback(result.codeResult.code);
              }
          });
      },

      // Para o scanner
      stop: function() {
          Quagga.stop();
      },

      // Som de beep quando ler código
      beep: function() {
          var beep = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU8PTw==");
          beep.play();
      }
  };

  3. export.js (Exportação de dados)

  // Sistema de exportação de dados
  const Exporter = {
      // Exportar banco para SQL
      exportToSQL: function() {
          const sql = DB.exportToSQL();

          // Criar arquivo para download
          const blob = new Blob([sql], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);

          // Criar link e fazer download
          const a = document.createElement('a');
          a.href = url;
          a.download = 'orion_pdv_export.sql';
          document.body.appendChild(a);
          a.click();

          // Limpar
          setTimeout(function() {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
          }, 100);
      },

      // Exportar para Excel (CSV)
      exportToExcel: function() {
          const csv = DB.exportToCSV();

          // Produtos
          this.downloadCSV(csv.produtos, 'produtos.csv');

          // Vendas
          setTimeout(() => {
              this.downloadCSV(csv.vendas, 'vendas.csv');
          }, 500);

          // Itens
          setTimeout(() => {
              this.downloadCSV(csv.itens, 'itens_venda.csv');
          }, 1000);
      },

      // Função para download de CSV
      downloadCSV: function(csv, filename) {
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();

          // Limpar
          setTimeout(function() {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
          }, 100);
      },

      // Backup do banco de dados
      backupDB: function() {
          const backup = DB.backup();

          // Criar arquivo para download
          const blob = new Blob([backup], { type: 'application/json' });
          const url = URL.createObjectURL(blob);

          // Criar link e fazer download
          const a = document.createElement('a');
          a.href = url;
          a.download = 'orion_pdv_backup.json';
          document.body.appendChild(a);
          a.click();

          // Limpar
          setTimeout(function() {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
          }, 100);
      },

      // Restaurar backup
      restoreDB: function(file) {
          const reader = new FileReader();

          reader.onload = function(e) {
              const success = DB.restore(e.target.result);

              if (success) {
                  alert('Backup restaurado com sucesso! A página será recarregada.');
                  window.location.reload();
              } else {
                  alert('Erro ao restaurar backup. Arquivo inválido.');
              }
          };

          reader.readAsText(file);
      }
  };
