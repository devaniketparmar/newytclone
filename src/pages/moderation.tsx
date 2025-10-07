import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import UniversalLayout from '@/components/UniversalLayout';
import SearchHeader from '@/components/SearchHeader';
import ModerationDashboard from '@/components/ModerationDashboard';

import { api } from '../lib/axios';
interface ModerationPageProps {
  user?: any;
}

export default function ModerationPage({ user }: ModerationPageProps) {
  const currentUser = user || null;
  const [searchQuery, setSearchQuery] = useState('');

  // Check if user has moderation permissions (you might want to add role-based access)
  const hasModerationAccess = currentUser && currentUser.role === 'MODERATOR'; // Adjust based on your user model

  if (!hasModerationAccess) {
    return (
      <UniversalLayout
        user={currentUser}
        showHeader={true}
        headerContent={
          <SearchHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showViewToggle={false}
            compact={false}
          />
        }
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You don't have permission to access the moderation dashboard.
            </p>
            <p className="text-sm text-gray-500">
              Contact an administrator if you believe this is an error.
            </p>
          </div>
        </div>
      </UniversalLayout>
    );
  }

  return (
    <UniversalLayout
      user={currentUser}
      showHeader={true}
      headerContent={
        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showViewToggle={false}
          compact={false}
        />
      }
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <span className="mr-3 text-red-600">🛡️</span>
            Content Moderation
          </h1>
          <p className="text-gray-600">
            Manage hashtag content and ensure community safety
          </p>
        </div>

        <ModerationDashboard />
      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  let user = null;
  const token = context.req.cookies.token;

  if (token) {
    try {
      const protocol = context.req.headers['x-forwarded-proto'] || 'http';
      const host = context.req.headers.host;
      const baseUrl = process.env.NODE_ENV === 'production'
        ? 'https://your-domain.com'
        : `${protocol}://${host}`;

      const userResponse = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          'Cookie': `token=${token}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        user = userData.data.user;
      }
    } catch (error) {
      console.log('Could not fetch user data:', error);
    }
  }

  return {
    props: {
      user,
    },
  };
};
