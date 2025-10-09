import React, { useState, useEffect } from 'react';
import { ClientAuth } from '../../utils/clientAuth';

interface AuthDebugProps {
  userId: string;
}

export default function AuthDebug({ userId }: AuthDebugProps) {
  const [tokenStatus, setTokenStatus] = useState<any>(null);
  const [authTest, setAuthTest] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    const status = ClientAuth.getTokenStatus();
    setTokenStatus(status);
    
    // Test authentication
    testAuthentication();
  }, []);

  const testAuthentication = async () => {
    try {
      const result = await ClientAuth.testAuthentication(userId);
      setAuthTest(result);
    } catch (error) {
      setAuthTest({ success: false, error: error.message });
    }
  };

  const testAnalyticsAPI = async () => {
    try {
      const data = await ClientAuth.fetchAnalytics(userId, '28d', 'overview');
      setTestResult({ success: true, data });
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication Debug</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">User ID:</label>
          <p className="text-sm text-gray-900">{userId}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Token Status:</label>
          <p className={`text-sm ${tokenStatus?.hasToken ? 'text-green-600' : 'text-yellow-600'}`}>
            {tokenStatus?.hasToken ? 'Present in localStorage' : 'Missing from localStorage (using cookies)'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Authentication Test:</label>
          <p className={`text-sm ${authTest?.success ? 'text-green-600' : authTest?.success === false ? 'text-red-600' : 'text-gray-600'}`}>
            {authTest?.success ? 'Valid' : authTest?.success === false ? 'Invalid' : 'Testing...'}
          </p>
        </div>
        
        {tokenStatus?.token && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Token Preview:</label>
            <p className="text-xs text-gray-500 font-mono break-all">
              {tokenStatus.token}
            </p>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={() => testAnalyticsAPI()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Test Analytics API
          </button>
          
          <button
            onClick={() => {
              ClientAuth.clearToken();
              setTokenStatus(ClientAuth.getTokenStatus());
              setAuthTest(null);
              setTestResult(null);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Clear Token
          </button>
        </div>
        
        {testResult && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Test Result:</label>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
