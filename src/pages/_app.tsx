import type { AppProps } from 'next/app';
import '../app/globals.css';
import PageTransitionProgress from '@/components/PageTransitionProgress';

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <PageTransitionProgress />
      <Component {...pageProps} />
    </>
  );
}

export default App;
