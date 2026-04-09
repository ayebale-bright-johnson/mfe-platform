export const authConfig = {
  authority: 'https://your-idp.example.com/realms/mfe-demo',
  clientId: 'mfe-shell',
  redirectUri: 'http://localhost:5173/callback',
  postLogoutRedirectUri: 'http://localhost:5173',
  scope: 'openid profile email',
};
