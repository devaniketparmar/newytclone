import React from 'react';
import { GetServerSideProps } from 'next';
import ShortsAnalytics from '../../components/ShortsAnalytics';

interface ShortsAnalyticsPageProps {
  user: any;
}

export default function ShortsAnalyticsPage({ user }: ShortsAnalyticsPageProps) {
  return <ShortsAnalytics user={user} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Check authentication
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/me`, {
      headers: {
        cookie: context.req.headers.cookie || ''
      }
    });

    if (!response.ok) {
      return {
        redirect: {
          destination: '/auth',
          permanent: false
        }
      };
    }

    const userData = await response.json();
    const user = userData.data;

    return {
      props: {
        user
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      redirect: {
        destination: '/auth',
        permanent: false
      }
    };
  }
};
