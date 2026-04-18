"use client";

import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [category, setCategory] = useState('agents');  // デフォルトカテゴリ
  const [token, setToken] = useState('');  // 初期状態は空
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/papers?category=${encodeURIComponent(category)}&token=${encodeURIComponent(token)}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setPapers(data.data.map((paper: any) => ({ ...paper, summary: '' })));
      } else {
        console.error('Invalid data format from API:', data);
        alert('論文データの取得に失敗しました。データ形式が正しくありません。');
        setPapers([]);
      }
    } catch (error) {
      console.error('Error fetching papers:', error);
      alert('論文データの取得に失敗しました。');
      setPapers([]);
    }
    setLoading(false);
  };

  const handleGenerateSummary = async (index: number, paperId: string) => {
    try {
      setPapers(prevPapers => {
        const updatedPapers = [...prevPapers];
        updatedPapers[index] = { ...updatedPapers[index], summary: '要約を生成中...' };
        return updatedPapers;
      });
      const summaryResponse = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paperId: paperId }),
      });

      if (!summaryResponse.ok) {
        throw new Error('Failed to fetch summary stream');
      }

      const reader = summaryResponse.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get stream reader');
      }

      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setPapers(prevPapers => {
            const updatedPapers = [...prevPapers];
            updatedPapers[index] = { ...updatedPapers[index], summary: (updatedPapers[index].summary || '') + chunk };
            return updatedPapers;
          });
        }
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      setPapers(prevPapers => {
        const updatedPapers = [...prevPapers];
        updatedPapers[index] = { ...updatedPapers[index], summary: '要約の生成に失敗しました。' };
        return updatedPapers;
      });
    }
  };

  const handleAuthSuccess = async (credentialResponse: any) => {
    setAuthLoading(true);
    try {
      const idToken = credentialResponse.credential;
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ googleToken: idToken }),
      });
      const result = await response.json();
      if (result.success && result.apiKey) {
        setToken(result.apiKey);
        setIsLoggedIn(true);
        alert('認証成功しました。トークンが設定されました。');
      } else {
        alert('認証に失敗しました。' + (result.error ? ': ' + result.error : ''));
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('認証に失敗しました。');
    }
    setAuthLoading(false);
  };

  const handleAuthError = () => {
    alert('Google認証に失敗しました。');
    setAuthLoading(false);
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
          <h1 style={{ margin: 0 }}>Trending Papers</h1>
          {isLoggedIn ? (
            <div style={{ color: 'green', fontWeight: 'bold' }}>ログイン済み</div>
          ) : (
            <GoogleLogin
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
              text="signin_with"
              shape="rectangular"
              theme="outline"
              size="medium"
            />
          )}
        </header>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="カテゴリを入力"
            style={{ padding: '8px', width: '200px', marginRight: '10px' }}
          />
          <button onClick={handleFetch} disabled={loading} style={{ padding: '8px 16px' }}>
            {loading ? 'Loading...' : 'Fetch Papers'}
          </button>
        </div>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {papers.map((paper, index) => (
            <li key={index} style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
              <h2 style={{ marginTop: 0 }}>{paper.title}</h2>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, marginRight: '10px' }}>
                  <h3>Abstract</h3>
                  <p style={{ fontSize: '0.9em', color: '#555' }}>{paper.abstract}</p>
                  <a href={`https://arxiv.org/abs/${paper.universal_paper_id}`} target="_blank" rel="noopener noreferrer">View on arXiv</a>
                </div>
                <div style={{ flex: 1 }}>
                  <h3>AI Summary</h3>
                  {paper.summary === '要約を生成中...' ? (
                    <div className="spinner"></div>
                  ) : paper.summary ? (
                    <ReactMarkdown>{paper.summary}</ReactMarkdown>
                  ) : (
                    <button onClick={() => handleGenerateSummary(index, paper.universal_paper_id)} disabled={loading || authLoading || paper.summary === '要約を生成中...'} style={{ padding: '5px 10px' }}>
                      {paper.summary === '要約を生成中...' ? '生成中...' : 'AI要約を生成 (本文)'}
                    </button>
                  )}
                </div>
              </div>
              <p>Authors: {paper.authors && paper.authors.length > 0 ? paper.authors.join(', ') : 'N/A'}</p>
              <p>Category: {paper.categories && paper.categories.length > 0 ? paper.categories.join(', ') : 'N/A'}</p>
              <p>Comments: {paper.metrics && paper.metrics.comments_count !== undefined ? paper.metrics.comments_count : 'N/A'}</p>
              <p>Date: {paper.publication_date || 'N/A'}</p>
            </li>
          ))}
        </ul>
      </div>
    </GoogleOAuthProvider>
  );
}
