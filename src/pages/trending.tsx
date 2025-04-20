import { useState } from 'react';
import { fetchTrendingPapers } from '../api/alphaxiv';
import { generateSummary } from '../api/grok';

export default function TrendingPage() {
  const [category, setCategory] = useState('agents');  // デフォルトカテゴリ
  const [token, setToken] = useState('');  // トークンを設定
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    const data = await fetchTrendingPapers(category, token);
    if (data.success) {
      const papersWithSummaries = await Promise.all(data.data.map(async (paper: any) => {
        const summary = await generateSummary(paper.abstract);  // 仮定: abstractフィールドがある
        return { ...paper, summary };
      }));
      setPapers(papersWithSummaries);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Trending Papers</h1>
      <input
        type="text"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Enter category"
      />
      <input
        type="text"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Enter API token"
      />
      <button onClick={handleFetch} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Papers'}
      </button>
      <ul>
        {papers.map((paper, index) => (
          <li key={index}>
            <h2>{paper.title}</h2>
            <p>{paper.summary}</p>
            <p>Authors: {paper.authors.join(', ')}</p>
            <p>Category: {paper.metadata.category}</p>
            <p>Comments: {paper.metadata.comments}</p>
            <p>Date: {paper.metadata.date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
