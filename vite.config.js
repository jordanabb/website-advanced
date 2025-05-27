import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(configEnv => {
  // configEnv contains mode (development, production) and command (serve, build)

  const base = '/';


  const config = {
    plugins: [react()],
    base: base,
  };



  return config;
});