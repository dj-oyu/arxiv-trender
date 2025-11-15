export const fetchTrendingPapers = async (category: string, token?: string): Promise<{ success: boolean; data: any[]; error?: string }> => {
  // v3 API: トークン不要、topics配列形式でカテゴリを指定
  const topics = encodeURIComponent(JSON.stringify([category]));
  const url = `https://api.alphaxiv.org/papers/v3/feed?pageNum=0&sort=Hot&pageSize=10&interval=All+time&topics=${topics}`;

  try {
    const response = await fetch(url, {
      headers: {
        'accept': '*/*',
        'sec-fetch-mode': 'cors',
      },
    });

    if (!response.ok) {
      throw new Error('API request failed with status ' + response.status);
    }

    const data = await response.json();
    console.log('Raw API Response:', JSON.stringify(data, null, 2).substring(0, 500) + '...'); // デバッグ用

    // v3 APIのレスポンス構造: { papers: [...] }
    if (data && typeof data === 'object' && Array.isArray(data.papers)) {
      return { success: true, data: data.papers };
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
