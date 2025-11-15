export const fetchTrendingPapers = async (category: string, token?: string): Promise<{ success: boolean; data: any[]; error?: string }> => {
  const url = `https://api.alphaxiv.org/v2/papers/trending-papers?page_num=0&sort_by=Hot&page_size=10&custom_categories=${category}`;
  const apiToken = token || '';
  try {
    const headers: { Authorization?: string } = {};
    if (apiToken) {
      headers.Authorization = `Bearer ${apiToken}`;
    }
    const response = await fetch(url, {
      headers,
    });
    if (!response.ok) {
      throw new Error('API request failed with status ' + response.status);
    }
    const data = await response.json();
    console.log('Raw API Response:', JSON.stringify(data, null, 2).substring(0, 500) + '...'); // デバッグ用
    // レスポンスの構造を確認し、配列形式に変換
    if (Array.isArray(data)) {
      return { success: true, data };
    } else if (data && typeof data === 'object' && Array.isArray(data.papers)) {
      return { success: true, data: data.papers };
    } else if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) {
      return { success: true, data: data.data };
    } else if (data && typeof data === 'object' && data.data && data.data.data && data.data.data.trending_papers && Array.isArray(data.data.data.trending_papers)) {
      return { success: true, data: data.data.data.trending_papers };
    } else if (data && typeof data === 'object' && data.data && data.data.trending_papers && Array.isArray(data.data.trending_papers)) {
      return { success: true, data: data.data.trending_papers };
    } else {
      throw new Error('Unexpected data format from API');
    }
  } catch (error) {
    console.error('Error fetching trending papers:', error);
    return { success: false, data: [], error: error.message };
  }
};

export const getAuthToken = async (googleToken: string): Promise<{ success: boolean; apiKey?: string; error?: string }> => {
  const url = 'https://api.alphaxiv.org/v1/auth/login-google';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: googleToken }),
    });
    if (!response.ok) {
      throw new Error('Authentication failed');
    }
    const data = await response.json();
    if (data.success && data.apiKey) {
      return { success: true, apiKey: data.apiKey };
    } else {
      return { success: false, error: 'No API key returned' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
