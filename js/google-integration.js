// google-integration.js
  const GoogleIntegration = {
      // Suas credenciais reais
      API_KEY: 'AIzaSyBbZ_qWJF4mPlkSbK12345678901234', // Insira sua API Key aqui
      CLIENT_ID: '145009781337-r0q8eejsk724ushkoo9u129ioe6hdunn.apps.googleusercontent.com',
      SCOPES: 'https://www.googleapis.com/auth/drive.file',
      tokenClient: null,
      isAuthorized: false,

      // Inicialização da API do Google
      init: function() {
          return new Promise((resolve, reject) => {
              gapi.load('client', async () => {
                  try {
                      await gapi.client.init({
                          apiKey: this.API_KEY,
                          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
                      });

                      // Inicializa o token client
                      this.tokenClient = google.accounts.oauth2.initTokenClient({
                          client_id: this.CLIENT_ID,
                          scope: this.SCOPES,
                          callback: (response) => {
                              if (response.error) {
                                  this.isAuthorized = false;
                                  reject(response);
                              } else {
                                  this.isAuthorized = true;
                                  resolve(response);
                              }
                          }
                      });

                      resolve();
                  } catch (error) {
                      reject(error);
                  }
              });
          });
      }
